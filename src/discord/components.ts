import type { BotConfig } from '../config';
import {
  ComponentType,
  type DiscordMessagePayload,
  type EmbedPayload,
  type MessageComponent,
} from '../types';

export function buildCreateTicketButtonRow(
  config: BotConfig,
): Array<{ type: number; components: MessageComponent[] }> {
  const button: MessageComponent = {
    type: ComponentType.Button,
    custom_id: config.customIds.createTicketButton,
    label: config.buttons.createTicket.label,
    style: config.buttons.createTicket.style,
  };

  if (config.buttons.createTicket.emoji) {
    button.emoji = config.buttons.createTicket.emoji;
  }

  return [{ type: ComponentType.ActionRow, components: [button] }];
}

export function buildCloseTicketButtonRow(
  config: BotConfig,
  ownerUserId: string,
): Array<{ type: number; components: MessageComponent[] }> {
  const button: MessageComponent = {
    type: ComponentType.Button,
    custom_id: `${config.customIds.closeTicketButton}:${ownerUserId}`,
    label: config.buttons.closeTicket.label,
    style: config.buttons.closeTicket.style,
  };

  if (config.buttons.closeTicket.emoji) {
    button.emoji = config.buttons.closeTicket.emoji;
  }

  return [{ type: ComponentType.ActionRow, components: [button] }];
}

export function buildTicketPanelPayload(config: BotConfig): DiscordMessagePayload {
  const embed: EmbedPayload = {
    title: config.embeds.ticketPanel.title,
    description: config.embeds.ticketPanel.description,
    color: config.embeds.ticketPanel.color,
  };

  return {
    embeds: [embed],
    components: buildCreateTicketButtonRow(config),
  };
}

export function buildTicketOpenedPayload(
  config: BotConfig,
  userMention: string,
  description: string,
  staffMentions: string,
  ownerUserId: string,
): DiscordMessagePayload {
  const embed: EmbedPayload = {
    title: config.embeds.ticketOpened.title,
    description: config.embeds.ticketOpened.descriptionTemplate
      .replace('{user}', userMention)
      .replace('{description}', description),
    color: config.embeds.ticketOpened.color,
  };

  return {
    content: `${userMention} ${staffMentions}`.trim(),
    embeds: [embed],
    components: buildCloseTicketButtonRow(config, ownerUserId),
  };
}

export function buildTicketClosedPayload(config: BotConfig): DiscordMessagePayload {
  return {
    embeds: [
      {
        title: config.embeds.ticketClosed.title,
        description: config.embeds.ticketClosed.description,
        color: config.embeds.ticketClosed.color,
      },
    ],
  };
}

export function buildCreateTicketModalPayload(
  config: BotConfig,
): Record<string, unknown> {
  const input = config.modals.createTicket.descriptionInput;

  return {
    custom_id: config.customIds.createTicketModal,
    title: config.modals.createTicket.title,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            custom_id: config.customIds.ticketDescriptionInput,
            label: input.label,
            style: input.style,
            placeholder: input.placeholder,
            min_length: input.minLength,
            max_length: input.maxLength,
            required: input.required,
          },
        ],
      },
    ],
  };
}
