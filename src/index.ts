import { loadConfig } from './config';
import type { Env } from './env';
import { handleCloseTicketButton, runTicketClose } from './handlers/close-button';
import { handleCreateTicketButton } from './handlers/create-button';
import { handleCreateTicketModal, runTicketCreation } from './handlers/create-modal';
import { handleTicketCommand } from './handlers/command';
import { messageResponse, pongResponse } from './responses';
import { InteractionType, type APIInteraction } from './types';
import { verifyDiscordRequest } from './verify';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    if (request.method === 'GET') {
      return new Response('serverless-discord-tickets is running.', {
        status: 200,
      });
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

    const config = loadConfig(env);
    const handlerCtx = { env, config, interaction };

    try {
      switch (interaction.type) {
        case InteractionType.Ping:
          return pongResponse();

        case InteractionType.ApplicationCommand: {
          const commandName = interaction.data?.name;
          if (commandName === config.commands.ticket.name) {
            return handleTicketCommand(handlerCtx);
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
