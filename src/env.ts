import type { BotConfig, ConfigEnv } from './config';
import type { APIInteraction } from './types';

export interface Env extends ConfigEnv {
  DISCORD_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  TICKETS?: KVNamespace;
}

export interface HandlerContext {
  env: Env;
  config: BotConfig;
  interaction: APIInteraction;
}

export type InteractionHandler = (
  ctx: HandlerContext,
) => Promise<Response>;

export const DISCORD_API_BASE = 'https://discord.com/api/v10';

export const PermissionFlags = {
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
