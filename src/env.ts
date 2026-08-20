import type { BotConfig, ConfigEnv } from './config';
import type { APIInteraction } from './types';

export interface Env extends ConfigEnv {
  DISCORD_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  TICKETS_KV?: KVNamespace;
  TICKETS?: KVNamespace;
}

export function getKV(env: Env): KVNamespace | undefined {
  return env.TICKETS_KV ?? env.TICKETS;
}

export interface HandlerContext {
  env: Env;
  config: BotConfig;
  interaction: APIInteraction;
  request?: Request;
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
