/** Minimal Discord interaction types for this bot. */

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  avatar?: string | null;
}

export interface DiscordMember {
  user?: DiscordUser;
  roles: string[];
  permissions?: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed?: boolean;
}

export interface DiscordGuild {
  id: string;
  name?: string;
  icon?: string | null;
  description?: string | null;
}

export interface DiscordApplicationCommandOption {
  name: string;
  description: string;
  type: number;
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  options?: DiscordApplicationCommandOption[];
  name_localizations?: Record<string, string>;
  description_localizations?: Record<string, string>;
}

export interface DiscordApplicationCommandPayload {
  name: string;
  description: string;
  type: number;
  default_member_permissions?: string;
  dm_permission?: boolean;
  options?: DiscordApplicationCommandOption[];
  name_localizations?: Record<string, string>;
  description_localizations?: Record<string, string>;
}

export interface ApplicationCommandInteractionDataOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: ApplicationCommandInteractionDataOption[];
}

export interface APIInteraction {
  id: string;
  application_id: string;
  type: number;
  token: string;
  version: number;
  guild_id?: string;
  channel_id?: string;
  member?: DiscordMember;
  user?: DiscordUser;
  data?: InteractionData;
  message?: {
    id: string;
  };
}

export interface InteractionData {
  id?: string;
  name?: string;
  custom_id?: string;
  component_type?: number;
  options?: ApplicationCommandInteractionDataOption[];
  components?: ModalComponentRow[];
}

export interface ModalComponentRow {
  type: number;
  components: TextInputComponent[];
}

export interface TextInputComponent {
  type: number;
  custom_id: string;
  value?: string;
}

export interface PermissionOverwrite {
  id: string;
  type: number;
  allow: string;
  deny: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string;
  position?: number;
  archived?: boolean;
  locked?: boolean;
  permission_overwrites?: PermissionOverwrite[];
}

export interface DiscordAPIErrorBody {
  message?: string;
  code?: number;
  retry_after?: number;
}

export interface InteractionResponse {
  type: number;
  data?: Record<string, unknown>;
}

export interface EmbedPayload {
  title?: string;
  description?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export interface MessageComponent {
  type: number;
  custom_id?: string;
  label?: string;
  style?: number;
  url?: string;
  disabled?: boolean;
  emoji?: { name: string; id?: string };
  components?: MessageComponent[];
}

export interface DiscordMessagePayload {
  content?: string;
  embeds?: EmbedPayload[];
  components?: Array<{ type: number; components: MessageComponent[] }>;
}

export interface ConfigSessionData {
  guildId: string;
  userId: string;
  guildName?: string;
  createdAt: number;
  expiresAt: number;
}

export enum InteractionType {
  Ping = 1,
  ApplicationCommand = 2,
  MessageComponent = 3,
  ApplicationCommandAutocomplete = 4,
  ModalSubmit = 5,
}

export enum InteractionResponseType {
  Pong = 1,
  ChannelMessageWithSource = 4,
  DeferredChannelMessageWithSource = 5,
  DeferredUpdateMessage = 6,
  Modal = 9,
}

export enum ComponentType {
  ActionRow = 1,
  Button = 2,
  TextInput = 4,
}

export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5,
}

export enum TextInputStyle {
  Short = 1,
  Paragraph = 2,
}

export enum ChannelType {
  GuildText = 0,
  GuildCategory = 4,
  PublicThread = 11,
  PrivateThread = 12,
}

export enum OverwriteType {
  Role = 0,
  Member = 1,
}
