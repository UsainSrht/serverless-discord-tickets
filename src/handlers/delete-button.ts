import type { HandlerContext } from '../env';
import {
  deleteTicketChannel,
  editInteractionFollowup,
  isArchivedTicket,
  mapDiscordErrorToMessage,
} from '../discord/api';
import { deferredResponse } from '../responses';

function getInteractionUserId(ctx: HandlerContext): string | undefined {
  return ctx.interaction.member?.user?.id ?? ctx.interaction.user?.id;
}

function isStaff(ctx: HandlerContext): boolean {
  const roles = ctx.interaction.member?.roles ?? [];
  return ctx.config.structural.STAFF_ROLE_IDS.some((roleId) =>
    roles.includes(roleId),
  );
}

function parseDeleteButtonChannelId(
  ctx: HandlerContext,
  customId: string | undefined,
): string | undefined {
  if (!customId) return undefined;
  const prefix = `${ctx.config.customIds.deleteTicketButton}:`;
  if (!customId.startsWith(prefix)) return undefined;
  return customId.slice(prefix.length);
}

export async function handleDeleteTicketButton(
  ctx: HandlerContext,
): Promise<{ response: Response; proceed: boolean }> {
  const userId = getInteractionUserId(ctx);
  const channelId = ctx.interaction.channel_id;

  if (!userId || !channelId) {
    return { response: deferredResponse(true), proceed: false };
  }

  if (!isStaff(ctx)) {
    void followupError(ctx, ctx.config.messages.deleteNotAllowed);
    return { response: deferredResponse(true), proceed: false };
  }

  const channelFromButton = parseDeleteButtonChannelId(
    ctx,
    ctx.interaction.data?.custom_id,
  );

  if (channelFromButton && channelFromButton !== channelId) {
    void followupError(ctx, ctx.config.messages.deleteNotAllowed);
    return { response: deferredResponse(true), proceed: false };
  }

  return { response: deferredResponse(true), proceed: true };
}

async function followupError(
  ctx: HandlerContext,
  message: string,
): Promise<void> {
  await editInteractionFollowup(
    ctx.env,
    ctx.env.DISCORD_APPLICATION_ID,
    ctx.interaction.token,
    { content: message, flags: 64 },
  );
}

export async function runTicketDelete(ctx: HandlerContext): Promise<void> {
  const channelId = ctx.interaction.channel_id;

  if (!channelId) return;

  const { config, env } = ctx;

  try {
    if (!isStaff(ctx)) {
      await followupError(ctx, config.messages.deleteNotAllowed);
      return;
    }

    const archived = await isArchivedTicket(env, config, channelId);
    if (!archived) {
      await followupError(ctx, config.messages.deleteNotAllowed);
      return;
    }

    await deleteTicketChannel(env, channelId);

    await editInteractionFollowup(
      env,
      env.DISCORD_APPLICATION_ID,
      ctx.interaction.token,
      {
        content: config.messages.ticketDeleted,
        flags: 64,
      },
    );
  } catch (error) {
    console.error('Ticket delete failed:', error);
    await followupError(ctx, mapDiscordErrorToMessage(config, error));
  }
}
