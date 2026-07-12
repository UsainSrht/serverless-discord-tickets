import type { BotConfig } from '../config';
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
  type DiscordChannel,
  type DiscordMessagePayload,
} from '../types';

const MAX_RETRIES = 3;

export class DiscordAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: number,
    public readonly retryAfter?: number,
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

  return new DiscordAPIError(
    body.message ?? `Discord API error (${response.status})`,
    response.status,
    body.code,
    retryAfter,
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

    const full = await getChannel(env, channel.id);
    const ownerId = findTicketOwnerFromOverwrites(
      full.permission_overwrites,
      guildId,
    );

    if (ownerId === userId) {
      return channel;
    }
  }

  return undefined;
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
    return `${config.messages.genericError} (${error.message})`;
  }
  return config.messages.genericError;
}
