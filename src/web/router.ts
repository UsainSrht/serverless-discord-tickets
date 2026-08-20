import { loadGuildConfig, type BotConfig, type DeepPartial } from '../config';
import {
  getGuildChannels,
  getGuildDetails,
  getGuildRoles,
  syncGuildCommands,
} from '../discord/api';
import { getKV, type Env } from '../env';
import { renderDashboardHtml, renderExpiredHtml } from './html';
import { verifySessionToken } from './session';

const NO_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export function isWebRequest(url: URL): boolean {
  const path = url.pathname.replace(/\/+$/, '') || '/';
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
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const token = url.searchParams.get('token')?.trim();

  if (!token) {
    if (path.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Missing session token.' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...NO_CACHE_HEADERS,
          },
        },
      );
    }
    return new Response(
      renderExpiredHtml(
        'Missing session token. Please use the link provided by /ticket-admin customize in Discord.',
        'Missing Session Token',
      ),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...NO_CACHE_HEADERS,
        },
      },
    );
  }

  // Verify session statelessly via HMAC-SHA256 (0ms delay) or fallback to KV
  const session = await verifySessionToken(token, env);
  if (!session) {
    if (path.startsWith('/api/')) {
      return new Response(
        JSON.stringify({
          error:
            'This session has expired or is invalid. Please run /ticket-admin customize in Discord to generate a new 10-minute link.',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...NO_CACHE_HEADERS,
          },
        },
      );
    }
    return new Response(
      renderExpiredHtml(
        'This 10-minute link has expired or is invalid. Please run /ticket-admin customize in Discord to generate a new link.',
        'Session Expired or Invalid',
      ),
      {
        status: 401,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...NO_CACHE_HEADERS,
        },
      },
    );
  }

  // Handle Web Page: GET /customize or /config
  if (path === '/customize' || path === '/config') {
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    return new Response(renderDashboardHtml(token), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...NO_CACHE_HEADERS,
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
        getGuildDetails(env, session.guildId).catch(() => ({
          id: session.guildId,
          name: session.guildName || 'Discord Server',
        })),
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
            ...NO_CACHE_HEADERS,
          },
        },
      );
    } catch (error) {
      console.error('Error loading session data:', error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch Discord server data.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...NO_CACHE_HEADERS,
          },
        },
      );
    }
  }

  // Handle API: POST /api/config
  if (path === '/api/config') {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const kv = getKV(env);
    if (!kv) {
      return new Response(
        JSON.stringify({
          error:
            'TICKETS_KV is not configured. Please bind a KV namespace in wrangler.toml or the Cloudflare Dashboard to save settings.',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            ...NO_CACHE_HEADERS,
          },
        },
      );
    }

    try {
      const body = (await request.json()) as DeepPartial<BotConfig>;
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload.' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...NO_CACHE_HEADERS,
            },
          },
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
            ...NO_CACHE_HEADERS,
          },
        },
      );
    } catch (error) {
      console.error('Error saving guild config:', error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to save configuration.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...NO_CACHE_HEADERS,
          },
        },
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
            ...NO_CACHE_HEADERS,
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
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...NO_CACHE_HEADERS,
          },
        },
      );
    }
  }

  return new Response('Not Found', {
    status: 404,
    headers: NO_CACHE_HEADERS,
  });
}
