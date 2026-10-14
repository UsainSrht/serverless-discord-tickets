import type { BotConfig, ConfigEnv } from './config';
import type { APIInteraction } from './types';

export interface Env extends ConfigEnv {
  DISCORD_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  TICKETS_KV?: KVNamespace;
  TICKETS?: KVNamespace;
  KV?: KVNamespace;
  TICKET_KV?: KVNamespace;
  DISCORD_TICKETS?: KVNamespace;
  CONFIG_KV?: KVNamespace;
  WORKER_URL?: string;
  [key: string]: unknown;
}

export function getKV(env: Env | Record<string, unknown> | undefined): KVNamespace | undefined {
  if (!env || typeof env !== 'object') {
    return undefined;
  }

  const direct =
    (env.TICKETS_KV as KVNamespace | undefined) ??
    (env.TICKETS as KVNamespace | undefined) ??
    (env.KV as KVNamespace | undefined) ??
    (env.TICKET_KV as KVNamespace | undefined) ??
    (env.DISCORD_TICKETS as KVNamespace | undefined) ??
    (env.CONFIG_KV as KVNamespace | undefined);

  if (
    direct &&
    typeof direct.get === 'function' &&
    typeof direct.put === 'function'
  ) {
    return direct;
  }

  for (const val of Object.values(env)) {
    if (
      val &&
      typeof val === 'object' &&
      typeof (val as KVNamespace).get === 'function' &&
      typeof (val as KVNamespace).put === 'function' &&
      typeof (val as KVNamespace).delete === 'function'
    ) {
      return val as KVNamespace;
    }
  }

  return undefined;
}

export interface HandlerContext {
  env: Env;
  config: BotConfig;
  interaction: APIInteraction;
  request?: Request;
  executionCtx?: ExecutionContext;
}

export type InteractionHandler = (
  ctx: HandlerContext,
) => Promise<Response>;

export const DISCORD_API_BASE = 'https://discord.com/api/v10';

export const PermissionFlags = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_GUILD: 1n << 5n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  ATTACH_FILES: 1n << 15n,
} as const;

export const STAFF_CHANNEL_ALLOW =
  PermissionFlags.VIEW_CHANNEL |
  PermissionFlags.SEND_MESSAGES |
  PermissionFlags.READ_MESSAGE_HISTORY |
  PermissionFlags.ATTACH_FILES;

export const USER_CHANNEL_ALLOW = STAFF_CHANNEL_ALLOW;
