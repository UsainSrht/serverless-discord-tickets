import { loadGuildConfig, type BotConfig } from './config';
import type { Env } from './env';
import { handleCloseTicketButton, runTicketClose } from './handlers/close-button';
import { handleDeleteTicketButton, runTicketDelete } from './handlers/delete-button';
import { handleCreateTicketButton } from './handlers/create-button';
import { handleCreateTicketModal, runTicketCreation } from './handlers/create-modal';
import { handlePanelCommand, handleTicketCommand } from './handlers/command';
import { handleCustomizeCommand } from './handlers/customize-command';
import { messageResponse, pongResponse } from './responses';
import { InteractionType, type APIInteraction } from './types';
import { normalizePublicKey, verifyDiscordRequest } from './verify';
import { handleWebRequest, isWebRequest } from './web/router';

function matchesTicketCommand(name: string | undefined, config: BotConfig): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  const primary = config.commands.ticket?.name?.toLowerCase();
  const aliases = (config.commands.ticket?.aliases || []).map((a) => a.toLowerCase());
  const localizations = Object.values(config.commands.ticket?.nameLocalizations || {}).map((l) => l.toLowerCase());
  const defaults = ['ticket', 'tickets', 'destek'];

  return n === primary || aliases.includes(n) || localizations.includes(n) || defaults.includes(n);
}

function matchesTicketAdminCommand(name: string | undefined, config: BotConfig): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  const primary = config.commands.ticketAdmin?.name?.toLowerCase();
  const aliases = (config.commands.ticketAdmin?.aliases || []).map((a) => a.toLowerCase());
  const localizations = Object.values(config.commands.ticketAdmin?.nameLocalizations || {}).map((l) => l.toLowerCase());
  const defaults = ['ticket-admin', 'ticketadmin', 'destek-admin', 'destek-yonetim'];

  return n === primary || aliases.includes(n) || localizations.includes(n) || defaults.includes(n);
}

function healthResponse(env: Env): Response {
  const publicKey = normalizePublicKey(env.DISCORD_PUBLIC_KEY);

  return new Response(
    JSON.stringify({
      status: 'running',
      checks: {
        discordPublicKeySet: publicKey.length > 0,
        discordPublicKeyLength: publicKey.length,
        discordPublicKeyValidFormat: /^[0-9a-fA-F]{64}$/.test(publicKey),
        discordApplicationIdSet: Boolean(env.DISCORD_APPLICATION_ID?.trim()),
        discordTokenSet: Boolean(env.DISCORD_TOKEN?.trim()),
      },
      hint:
        'Discord verification needs discordPublicKeyValidFormat=true and a redeployed worker that rejects invalid signatures with HTTP 401.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle Web UI and API endpoints
    if (isWebRequest(url)) {
      return handleWebRequest(request, env);
    }

    if (request.method === 'GET') {
      return healthResponse(env);
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const verification = await verifyDiscordRequest(
      request,
      env.DISCORD_PUBLIC_KEY,
    );

    if (!verification.valid) {
      return verification.response;
    }

    let interaction: APIInteraction;
    try {
      interaction = JSON.parse(verification.body) as APIInteraction;
    } catch {
      return new Response('Invalid JSON body', { status: 400 });
    }

    // Discord endpoint verification sends a PING — respond immediately.
    if (interaction.type === InteractionType.Ping) {
      return pongResponse();
    }

    const config = await loadGuildConfig(env, interaction.guild_id);
    const handlerCtx = { env, config, interaction, request };

    try {
      switch (interaction.type) {

        case InteractionType.ApplicationCommand: {
          const commandName = interaction.data?.name;
          if (
            matchesTicketCommand(commandName, config) ||
            matchesTicketAdminCommand(commandName, config)
          ) {
            return handleTicketCommand(handlerCtx);
          }
          if (commandName === 'customize') {
            return handleCustomizeCommand(handlerCtx);
          }
          if (commandName === 'panel' || commandName === 'ticket-panel') {
            return handlePanelCommand(handlerCtx);
          }
          return messageResponse('Unknown command.', true);
        }

        case InteractionType.MessageComponent: {
          const customId = interaction.data?.custom_id;
          if (customId === config.customIds.createTicketButton) {
            return handleCreateTicketButton(handlerCtx);
          }
          if (customId?.startsWith(`${config.customIds.closeTicketButton}:`)) {
            const { response, proceed } = await handleCloseTicketButton(handlerCtx);
            if (proceed) {
              ctx.waitUntil(runTicketClose(handlerCtx));
            }
            return response;
          }
          if (customId?.startsWith(`${config.customIds.deleteTicketButton}:`)) {
            const { response, proceed } = await handleDeleteTicketButton(handlerCtx);
            if (proceed) {
              ctx.waitUntil(runTicketDelete(handlerCtx));
            }
            return response;
          }
          return messageResponse('Unknown component.', true);
        }

        case InteractionType.ModalSubmit: {
          const customId = interaction.data?.custom_id;
          if (customId === config.customIds.createTicketModal) {
            const response = await handleCreateTicketModal(handlerCtx);
            ctx.waitUntil(runTicketCreation(handlerCtx));
            return response;
          }
          return messageResponse('Unknown modal.', true);
        }

        default:
          return messageResponse('Unsupported interaction type.', true);
      }
    } catch (error) {
      console.error('Unhandled interaction error:', error);
      return messageResponse(config.messages.genericError, true);
    }
  },
} satisfies ExportedHandler<Env>;
