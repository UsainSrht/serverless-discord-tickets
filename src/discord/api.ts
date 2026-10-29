import { sanitizeCommandName, type BotConfig } from '../config';
import {
  DISCORD_API_BASE,
  PermissionFlags,
  STAFF_CHANNEL_ALLOW,
  USER_CHANNEL_ALLOW,
  type Env,
} from '../env';
import {
  ChannelType,
  OverwriteType,
  type DiscordAPIErrorBody,
  type DiscordApplicationCommandOption,
  type DiscordApplicationCommandPayload,
  type DiscordChannel,
  type DiscordGuild,
  type DiscordMessagePayload,
  type DiscordRole,
} from '../types';

const MAX_RETRIES = 3;

export class DiscordAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: number,
    public readonly retryAfter?: number,
    public readonly details: DiscordErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'DiscordAPIError';
  }

  get isMissingPermissions(): boolean {
    return this.code === 50013 || this.status === 403;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isCategoryFull(): boolean {
    return this.details.some((d) => d.code === 'CHANNEL_PARENT_MAX_CHANNELS');
  }
}

interface DiscordErrorDetail {
  path: string;
  code: string;
  message: string;
}

// Discord nests validation failures as { field: { _errors: [{ code, message }] } }.
function flattenErrorDetails(
  node: unknown,
  path = '',
  out: DiscordErrorDetail[] = [],
): DiscordErrorDetail[] {
  if (typeof node !== 'object' || node === null) return out;

  for (const [key, value] of Object.entries(node)) {
    if (key === '_errors' && Array.isArray(value)) {
      for (const e of value as Array<{ code?: string; message?: string }>) {
        out.push({ path, code: e.code ?? '', message: e.message ?? '' });
      }
    } else {
      flattenErrorDetails(value, path ? `${path}.${key}` : key, out);
    }
  }
  return out;
}

async function parseErrorResponse(response: Response): Promise<DiscordAPIError> {
  let body: DiscordAPIErrorBody = {};
  try {
    body = (await response.json()) as DiscordAPIErrorBody;
  } catch {
    // ignore JSON parse failures
  }

  const retryHeader = response.headers.get('Retry-After');
  const retryAfter =
    body.retry_after ??
    (retryHeader ? parseFloat(retryHeader) : undefined);

  const details = flattenErrorDetails(body.errors);
  const detailText = details
    .map((d) => `${d.path}: ${d.message}`)
    .join('; ');
  const baseMessage = body.message ?? `Discord API error (${response.status})`;

  return new DiscordAPIError(
    detailText ? `${baseMessage} - ${detailText}` : baseMessage,
    response.status,
    body.code,
    retryAfter,
    details,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function discordFetch(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${DISCORD_API_BASE}${path}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bot ${env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const error = await parseErrorResponse(response.clone());
      const waitMs = Math.ceil((error.retryAfter ?? 1) * 1000);
      await sleep(waitMs);
      continue;
    }

    return response;
  }

  throw new DiscordAPIError('Exceeded Discord API retry limit', 429);
}

async function discordJson<T>(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await discordFetch(env, path, init);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function buildPermissionOverwrites(
  config: BotConfig,
  guildId: string,
  userId: string,
): Array<{ id: string; type: number; allow: string; deny: string }> {
  const overwrites = [
    {
      id: guildId,
      type: OverwriteType.Role,
      allow: '0',
      deny: PermissionFlags.VIEW_CHANNEL.toString(),
    },
    {
      id: userId,
      type: OverwriteType.Member,
      allow: USER_CHANNEL_ALLOW.toString(),
      deny: '0',
    },
  ];

  for (const roleId of config.structural.STAFF_ROLE_IDS) {
    overwrites.push({
      id: roleId,
      type: OverwriteType.Role,
      allow: STAFF_CHANNEL_ALLOW.toString(),
      deny: '0',
    });
  }

  return overwrites;
}

export async function createTicketChannel(
  env: Env,
  config: BotConfig,
  guildId: string,
  userId: string,
  channelName: string,
): Promise<DiscordChannel> {
  return discordJson<DiscordChannel>(env, `/guilds/${guildId}/channels`, {
    method: 'POST',
    body: JSON.stringify({
      name: channelName,
      type: ChannelType.GuildText,
      parent_id: config.structural.TICKET_CATEGORY_ID,
      permission_overwrites: buildPermissionOverwrites(config, guildId, userId),
    }),
  });
}

export async function createTicketThread(
  env: Env,
  config: BotConfig,
  userId: string,
  threadName: string,
): Promise<DiscordChannel> {
  const thread = await discordJson<DiscordChannel>(
    env,
    `/channels/${config.structural.THREAD_CHANNEL_ID}/threads`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: threadName,
        type: ChannelType.PrivateThread,
        invitable: false,
        auto_archive_duration: 10080,
      }),
    },
  );

  await addThreadMember(env, thread.id, userId);

  return thread;
}

async function addThreadMember(
  env: Env,
  threadId: string,
  userId: string,
): Promise<void> {
  const response = await discordFetch(
    env,
    `/channels/${threadId}/thread-members/${userId}`,
    { method: 'PUT' },
  );

  if (!response.ok && response.status !== 204) {
    throw await parseErrorResponse(response);
  }
}

export async function sendChannelMessage(
  env: Env,
  channelId: string,
  payload: DiscordMessagePayload,
): Promise<void> {
  await discordJson(env, `/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getChannel(
  env: Env,
  channelId: string,
): Promise<DiscordChannel> {
  return discordJson<DiscordChannel>(env, `/channels/${channelId}`);
}

export async function editChannelMessage(
  env: Env,
  channelId: string,
  messageId: string,
  payload: DiscordMessagePayload,
): Promise<void> {
  await discordJson(env, `/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTicketChannel(
  env: Env,
  channelId: string,
): Promise<void> {
  await discordJson(env, `/channels/${channelId}`, {
    method: 'DELETE',
  });
}

export async function isArchivedTicket(
  env: Env,
  config: BotConfig,
  channelId: string,
): Promise<boolean> {
  const channel = await getChannel(env, channelId);

  if (config.TICKET_MODE === 'channel') {
    return channel.parent_id === config.structural.ARCHIVE_CATEGORY_ID;
  }

  return channel.archived === true;
}

export async function archiveTicketChannel(
  env: Env,
  config: BotConfig,
  channelId: string,
  ticketOwnerId: string,
  guildId: string,
): Promise<void> {
  const overwrites = buildPermissionOverwrites(config, guildId, ticketOwnerId);

  const creatorOverwrite = overwrites.find((o) => o.id === ticketOwnerId);
  if (creatorOverwrite) {
    creatorOverwrite.allow = '0';
    creatorOverwrite.deny = PermissionFlags.VIEW_CHANNEL.toString();
  }

  await discordJson(env, `/channels/${channelId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      parent_id: config.structural.ARCHIVE_CATEGORY_ID,
      permission_overwrites: overwrites,
    }),
  });
}

export async function archiveTicketThread(
  env: Env,
  threadId: string,
): Promise<void> {
  await discordJson(env, `/channels/${threadId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      archived: true,
      locked: true,
    }),
  });
}

export async function getGuildChannels(
  env: Env,
  guildId: string,
): Promise<DiscordChannel[]> {
  return discordJson<DiscordChannel[]>(env, `/guilds/${guildId}/channels`);
}

export function findTicketOwnerFromOverwrites(
  overwrites: Array<{ id: string; type: number; allow: string }> | undefined,
  guildId: string,
): string | undefined {
  if (!overwrites) return undefined;

  return overwrites.find(
    (o) =>
      o.type === OverwriteType.Member &&
      o.id !== guildId &&
      (BigInt(o.allow) & PermissionFlags.VIEW_CHANNEL) !== 0n,
  )?.id;
}

export async function findOpenTicketChannelForUser(
  env: Env,
  config: BotConfig,
  guildId: string,
  userId: string,
): Promise<DiscordChannel | undefined> {
  const channels = await getGuildChannels(env, guildId);
  const ticketCategoryId = config.structural.TICKET_CATEGORY_ID;

  for (const channel of channels) {
    if (
      channel.parent_id !== ticketCategoryId ||
      channel.type !== ChannelType.GuildText
    ) {
      continue;
    }

    const overwrites =
      channel.permission_overwrites ??
      (await getChannel(env, channel.id)).permission_overwrites;
    const ownerId = findTicketOwnerFromOverwrites(overwrites, guildId);

    if (ownerId === userId) {
      return channel;
    }
  }

  return undefined;
}

export async function countOpenTicketsForUser(
  env: Env,
  config: BotConfig,
  guildId: string,
  userId: string,
): Promise<number> {
  if (config.TICKET_MODE === 'channel') {
    const channels = await getGuildChannels(env, guildId);
    const ticketCategoryId = config.structural.TICKET_CATEGORY_ID;
    let count = 0;

    for (const channel of channels) {
      if (
        channel.parent_id !== ticketCategoryId ||
        channel.type !== ChannelType.GuildText
      ) {
        continue;
      }

      const overwrites =
        channel.permission_overwrites ??
        (await getChannel(env, channel.id)).permission_overwrites;
      const ownerId = findTicketOwnerFromOverwrites(overwrites, guildId);

      if (ownerId === userId) {
        count++;
      }
    }

    return count;
  }

  if (config.TICKET_MODE === 'thread') {
    if (!config.structural.THREAD_CHANNEL_ID) return 0;

    try {
      const res = await discordJson<{
        threads: DiscordChannel[];
        members?: Array<{ id: string; user_id: string }>;
      }>(
        env,
        `/channels/${config.structural.THREAD_CHANNEL_ID}/threads/active`,
      );

      const activeThreads = (res.threads ?? []).filter(
        (t) => !t.archived && t.parent_id === config.structural.THREAD_CHANNEL_ID,
      );

      let count = 0;
      for (const thread of activeThreads) {
        try {
          const member = await discordJson<{ user_id?: string; id?: string }>(
            env,
            `/channels/${thread.id}/thread-members/${userId}`,
          );
          if (member) {
            count++;
          }
        } catch (err) {
          if (err instanceof DiscordAPIError && err.status === 404) {
            continue;
          }
        }
      }
      return count;
    } catch (error) {
      console.error('Failed to get active ticket threads:', error);
      return 0;
    }
  }

  return 0;
}

export function getSnowflakeTimestamp(snowflakeId: string): number {
  return Number((BigInt(snowflakeId) >> 22n) + 1420070400000n);
}

export async function getArchivedThreads(
  env: Env,
  channelId: string,
  type: 'private' | 'public' = 'private',
): Promise<DiscordChannel[]> {
  try {
    const res = await discordJson<{
      threads: DiscordChannel[];
      has_more?: boolean;
    }>(env, `/channels/${channelId}/threads/archived/${type}`);

    return res.threads ?? [];
  } catch (error) {
    console.error(`Failed to fetch archived ${type} threads for channel ${channelId}:`, error);
    return [];
  }
}

export async function editInteractionFollowup(
  env: Env,
  applicationId: string,
  interactionToken: string,
  payload: DiscordMessagePayload & { flags?: number },
): Promise<void> {
  await discordJson(
    env,
    `/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function mapDiscordErrorToMessage(
  config: BotConfig,
  error: unknown,
): string {
  if (error instanceof DiscordAPIError) {
    if (error.isRateLimited) return config.messages.rateLimited;
    if (error.isMissingPermissions) return config.messages.missingPermissions;
    if (error.isCategoryFull) return config.messages.archiveCategoryFull;
    return `${config.messages.genericError} (${error.message})`;
  }
  return config.messages.genericError;
}

export async function getGuildRoles(
  env: Env,
  guildId: string,
): Promise<DiscordRole[]> {
  return discordJson<DiscordRole[]>(env, `/guilds/${guildId}/roles`);
}

export async function getGuildDetails(
  env: Env,
  guildId: string,
): Promise<DiscordGuild> {
  return discordJson<DiscordGuild>(env, `/guilds/${guildId}`);
}

export function buildApplicationCommands(
  config: BotConfig,
): DiscordApplicationCommandPayload[] {
  const commands: DiscordApplicationCommandPayload[] = [];
  const registeredNames = new Set<string>();

  // 1. Primary ticket command
  const ticketName = sanitizeCommandName(config.commands.ticket?.name || 'ticket');
  if (ticketName) {
    registeredNames.add(ticketName);
    const cmd: DiscordApplicationCommandPayload = {
      name: ticketName,
      description:
        config.commands.ticket?.description || 'Open a support ticket',
      type: 1,
      dm_permission: false,
    };
    if (
      config.commands.ticket?.nameLocalizations &&
      Object.keys(config.commands.ticket.nameLocalizations).length > 0
    ) {
      const sanitizedLocs: Record<string, string> = {};
      for (const [loc, val] of Object.entries(
        config.commands.ticket.nameLocalizations,
      )) {
        const sanitized = sanitizeCommandName(val);
        if (sanitized) sanitizedLocs[loc] = sanitized;
      }
      if (Object.keys(sanitizedLocs).length > 0) {
        cmd.name_localizations = sanitizedLocs;
      }
    }
    if (
      config.commands.ticket?.descriptionLocalizations &&
      Object.keys(config.commands.ticket.descriptionLocalizations).length > 0
    ) {
      cmd.description_localizations =
        config.commands.ticket.descriptionLocalizations;
    }
    commands.push(cmd);
  }

  // 2. Ticket command aliases
  const ticketAliases = config.commands.ticket?.aliases || [];
  for (const rawAlias of ticketAliases) {
    const alias = sanitizeCommandName(rawAlias);
    if (!alias || registeredNames.has(alias)) continue;
    registeredNames.add(alias);
    commands.push({
      name: alias,
      description:
        config.commands.ticket?.description || 'Open a support ticket',
      type: 1,
      dm_permission: false,
    });
  }

  // 3. Primary ticket admin command
  const adminName = sanitizeCommandName(
    config.commands.ticketAdmin?.name || 'ticket-admin',
  );
  const adminOptions: DiscordApplicationCommandOption[] = [
    {
      name: 'panel',
      description: 'Post the ticket creation panel in this channel',
      type: 1,
    },
    {
      name: 'customize',
      description:
        'Generate a 10-minute link to customize bot settings in the Web UI',
      type: 1,
    },
    {
      name: 'prune',
      description: 'Prune (delete) archived tickets from the server',
      type: 1,
      options: [
        {
          name: 'limit',
          description:
            'Maximum number of archived tickets to delete (default: 50, max: 100)',
          type: 4,
          required: false,
        },
        {
          name: 'days',
          description:
            'Only delete tickets older than this many days (e.g. 7 or 30)',
          type: 4,
          required: false,
        },
        {
          name: 'dry_run',
          description:
            'Preview tickets that would be deleted without deleting them (default: false)',
          type: 5,
          required: false,
        },
      ],
    },
  ];

  if (adminName && !registeredNames.has(adminName)) {
    registeredNames.add(adminName);
    const cmd: DiscordApplicationCommandPayload = {
      name: adminName,
      description:
        config.commands.ticketAdmin?.description ||
        'Manage support tickets and customize bot settings (Admin only)',
      type: 1,
      default_member_permissions: '8',
      dm_permission: false,
      options: adminOptions,
    };
    if (
      config.commands.ticketAdmin?.nameLocalizations &&
      Object.keys(config.commands.ticketAdmin.nameLocalizations).length > 0
    ) {
      const sanitizedLocs: Record<string, string> = {};
      for (const [loc, val] of Object.entries(
        config.commands.ticketAdmin.nameLocalizations,
      )) {
        const sanitized = sanitizeCommandName(val);
        if (sanitized) sanitizedLocs[loc] = sanitized;
      }
      if (Object.keys(sanitizedLocs).length > 0) {
        cmd.name_localizations = sanitizedLocs;
      }
    }
    if (
      config.commands.ticketAdmin?.descriptionLocalizations &&
      Object.keys(config.commands.ticketAdmin.descriptionLocalizations).length > 0
    ) {
      cmd.description_localizations =
        config.commands.ticketAdmin.descriptionLocalizations;
    }
    commands.push(cmd);
  }

  // 4. Ticket admin aliases
  const adminAliases = config.commands.ticketAdmin?.aliases || [];
  for (const rawAlias of adminAliases) {
    const alias = sanitizeCommandName(rawAlias);
    if (!alias || registeredNames.has(alias)) continue;
    registeredNames.add(alias);
    commands.push({
      name: alias,
      description:
        config.commands.ticketAdmin?.description ||
        'Manage support tickets and customize bot settings (Admin only)',
      type: 1,
      default_member_permissions: '8',
      dm_permission: false,
      options: adminOptions,
    });
  }

  return commands;
}

export async function syncGuildCommands(
  env: Env,
  guildId: string,
  config: BotConfig,
): Promise<DiscordApplicationCommandPayload[]> {
  const applicationId = env.DISCORD_APPLICATION_ID?.trim();
  if (!applicationId || !env.DISCORD_TOKEN?.trim()) {
    throw new Error(
      'Missing DISCORD_APPLICATION_ID or DISCORD_TOKEN in environment.',
    );
  }

  const commands = buildApplicationCommands(config);
  return discordJson<DiscordApplicationCommandPayload[]>(
    env,
    `/applications/${applicationId}/guilds/${guildId}/commands`,
    {
      method: 'PUT',
      body: JSON.stringify(commands),
    },
  );
}

export async function registerGlobalCommands(
  env: Env,
  config: BotConfig,
): Promise<DiscordApplicationCommandPayload[]> {
  const applicationId = env.DISCORD_APPLICATION_ID?.trim();
  if (!applicationId || !env.DISCORD_TOKEN?.trim()) {
    throw new Error(
      'Missing DISCORD_APPLICATION_ID or DISCORD_TOKEN in environment.',
    );
  }

  const commands = buildApplicationCommands(config);
  return discordJson<DiscordApplicationCommandPayload[]>(
    env,
    `/applications/${applicationId}/commands`,
    {
      method: 'PUT',
      body: JSON.stringify(commands),
    },
  );
}


