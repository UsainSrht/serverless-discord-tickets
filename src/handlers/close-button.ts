import type { HandlerContext } from '../env';
import {
  archiveTicketChannel,
  archiveTicketThread,
  editInteractionFollowup,
  findTicketOwnerFromOverwrites,
  getChannel,
  mapDiscordErrorToMessage,
  sendChannelMessage,
} from '../discord/api';
import { buildTicketClosedPayload } from '../discord/components';
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

function parseCloseButtonOwnerId(
  ctx: HandlerContext,
  customId: string | undefined,
): string | undefined {
  if (!customId) return undefined;
  const prefix = `${ctx.config.customIds.closeTicketButton}:`;
  if (!customId.startsWith(prefix)) return undefined;
  return customId.slice(prefix.length);
}

export async function handleCloseTicketButton(
  ctx: HandlerContext,
): Promise<{ response: Response; proceed: boolean }> {
  const userId = getInteractionUserId(ctx);
  const channelId = ctx.interaction.channel_id;
  const guildId = ctx.interaction.guild_id;
  const ownerFromButton = parseCloseButtonOwnerId(
    ctx,
    ctx.interaction.data?.custom_id,
  );

  if (!userId || !channelId || !guildId) {
    return { response: deferredResponse(true), proceed: false };
  }

  if (!isStaff(ctx) && ownerFromButton && ownerFromButton !== userId) {
    void followupError(ctx, ctx.config.messages.closeNotAllowed);
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

async function resolveTicketOwnerId(
  ctx: HandlerContext,
  channelId: string,
  guildId: string,
): Promise<string | undefined> {
  const ownerFromButton = parseCloseButtonOwnerId(
    ctx,
    ctx.interaction.data?.custom_id,
  );
  if (ownerFromButton) return ownerFromButton;

  if (ctx.config.TICKET_MODE === 'thread') {
    return undefined;
  }

  const channel = await getChannel(ctx.env, channelId);
  return findTicketOwnerFromOverwrites(channel.permission_overwrites, guildId);
}

export async function runTicketClose(ctx: HandlerContext): Promise<void> {
  const actorUserId = getInteractionUserId(ctx);
  const channelId = ctx.interaction.channel_id;
  const guildId = ctx.interaction.guild_id;

  if (!actorUserId || !channelId || !guildId) return;

  const { config, env } = ctx;

  try {
    const ticketOwnerId = await resolveTicketOwnerId(ctx, channelId, guildId);
    const staff = isStaff(ctx);

    if (!staff && ticketOwnerId !== actorUserId) {
      await followupError(ctx, config.messages.closeNotAllowed);
      return;
    }

    if (config.TICKET_MODE === 'channel') {
      const ownerId = ticketOwnerId ?? actorUserId;
      await archiveTicketChannel(env, config, channelId, ownerId, guildId);
    } else {
      await archiveTicketThread(env, channelId);
    }

    await sendChannelMessage(env, channelId, buildTicketClosedPayload(config));

    await editInteractionFollowup(
      env,
      env.DISCORD_APPLICATION_ID,
      ctx.interaction.token,
      {
        content: config.messages.ticketClosed,
        flags: 64,
      },
    );
  } catch (error) {
    console.error('Ticket close failed:', error);
    await followupError(ctx, mapDiscordErrorToMessage(config, error));
  }
}
