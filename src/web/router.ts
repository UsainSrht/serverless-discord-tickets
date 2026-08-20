import { loadGuildConfig, type BotConfig, type DeepPartial } from '../config';
import {
  getGuildChannels,
  getGuildDetails,
  getGuildRoles,
  syncGuildCommands,
} from '../discord/api';
import { getKV, type Env } from '../env';
import type { ConfigSessionData } from '../types';
import { renderDashboardHtml, renderExpiredHtml } from './html';

export function isWebRequest(url: URL): boolean {
  const path = url.pathname;
  return (
    path === '/customize' ||
    path === '/config' ||
    path === '/api/session-data' ||
    path === '/api/config' ||
    path === '/api/sync-commands'
  );
}

export async function handleWebRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const token = url.searchParams.get('token')?.trim();
  const kv = getKV(env);

  if (!kv) {
    if (path.startsWith('/api/')) {
      return new Response(
        JSON.stringify({
          error:
            'TICKETS_KV is not configured. Please bind a KV namespace in wrangler.toml.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      renderExpiredHtml(
        'TICKETS_KV is not configured in Cloudflare Workers. Please bind a KV namespace in wrangler.toml.',
      ),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  if (!token) {
    if (path.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Missing session token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      renderExpiredHtml('Missing session token. Please use the link provided by /ticket-admin customize in Discord.'),
      { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const rawSession = await kv.get(`session:${token}`);
  if (!rawSession) {
    if (path.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'This session has expired or is invalid.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      renderExpiredHtml('This 10-minute link has expired or does not exist.'),
      { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  let session: ConfigSessionData;
  try {
    session = JSON.parse(rawSession) as ConfigSessionData;
  } catch {
    return new Response(
      renderExpiredHtml('Corrupted session data. Please run /ticket-admin customize again.'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  // Handle Web Page
  if (path === '/customize' || path === '/config') {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    return new Response(renderDashboardHtml(token), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Handle API: GET /api/session-data
  if (path === '/api/session-data') {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const [config, channels, roles, guild] = await Promise.all([
        loadGuildConfig(env, session.guildId),
        getGuildChannels(env, session.guildId).catch(() => []),
        getGuildRoles(env, session.guildId).catch(() => []),
        getGuildDetails(env, session.guildId).catch(() => ({ id: session.guildId, name: session.guildName || 'Discord Server' })),
      ]);

      const now = Date.now();
      const expiresInSeconds = Math.max(
        0,
        Math.floor((session.expiresAt - now) / 1000),
      );

      return new Response(
        JSON.stringify({
          config,
          guild,
          channels,
          roles,
          expiresInSeconds,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        },
      );
    } catch (error) {
      console.error('Error loading session data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Discord server data.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // Handle API: POST /api/config
  if (path === '/api/config') {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const body = (await request.json()) as DeepPartial<BotConfig>;
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      await kv.put(`guild_config:${session.guildId}`, JSON.stringify(body));

      let commandsSynced = false;
      let syncError: string | undefined;

      // Automatically sync guild slash commands with Discord if credentials exist
      if (env.DISCORD_APPLICATION_ID && env.DISCORD_TOKEN) {
        try {
          const effectiveConfig = await loadGuildConfig(env, session.guildId);
          await syncGuildCommands(env, session.guildId, effectiveConfig);
          commandsSynced = true;
        } catch (syncErr) {
          console.warn(
            `Guild commands sync warning for guild ${session.guildId}:`,
            syncErr,
          );
          syncError =
            syncErr instanceof Error ? syncErr.message : String(syncErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          guildId: session.guildId,
          commandsSynced,
          syncError,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        },
      );
    } catch (error) {
      console.error('Error saving guild config:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save configuration.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // Handle API: POST /api/sync-commands
  if (path === '/api/sync-commands') {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const config = await loadGuildConfig(env, session.guildId);
      const registered = await syncGuildCommands(env, session.guildId, config);

      return new Response(
        JSON.stringify({
          success: true,
          guildId: session.guildId,
          count: registered.length,
          commands: registered,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        },
      );
    } catch (error) {
      console.error('Error syncing guild commands:', error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to sync commands with Discord.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  return new Response('Not Found', { status: 404 });
}
