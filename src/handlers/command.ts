import type { HandlerContext } from '../env';
import {
  buildCreateTicketModalPayload,
  buildTicketPanelPayload,
} from '../discord/components';
import {
  modalResponse,
  publicMessageResponse,
  messageResponse,
} from '../responses';
import { handleCustomizeCommand, isMemberAdmin } from './customize-command';
import { handlePruneCommand, runTicketPrune } from './prune-command';

export async function handlePanelCommand(
  ctx: HandlerContext,
): Promise<Response> {
  const guildId = ctx.interaction.guild_id;
  if (!guildId) {
    return messageResponse(
      'This command can only be used inside a Discord server.',
      true,
    );
  }

  if (!isMemberAdmin(ctx)) {
    return messageResponse(
      '⛔ You need Administrator or Manage Server permissions to post the ticket panel.',
      true,
    );
  }

  return publicMessageResponse(buildTicketPanelPayload(ctx.config));
}

export async function handleTicketCommand(
  ctx: HandlerContext,
): Promise<Response> {
  const subcommand = ctx.interaction.data?.options?.[0]?.name;

  if (subcommand === 'customize') {
    return handleCustomizeCommand(ctx);
  }

  if (subcommand === 'panel') {
    return handlePanelCommand(ctx);
  }

  if (subcommand === 'prune') {
    const { response, proceed, options } = await handlePruneCommand(ctx);
    if (proceed) {
      if (ctx.executionCtx) {
        ctx.executionCtx.waitUntil(runTicketPrune(ctx, options));
      } else {
        void runTicketPrune(ctx, options);
      }
    }
    return response;
  }

  // /ticket (without subcommands) opens the ticket creation modal to the user
  return modalResponse(buildCreateTicketModalPayload(ctx.config));
}

