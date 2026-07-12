import { formatTemplate, sanitizeChannelName } from '../config';
import type { HandlerContext } from '../env';
import {
  createTicketChannel,
  createTicketThread,
  editInteractionFollowup,
  findOpenTicketChannelForUser,
  mapDiscordErrorToMessage,
  sendChannelMessage,
} from '../discord/api';
import { buildTicketOpenedPayload } from '../discord/components';
import { deferredResponse } from '../responses';
import type { TextInputComponent } from '../types';

function getInteractionUser(ctx: HandlerContext) {
  return ctx.interaction.member?.user ?? ctx.interaction.user;
}

function extractDescription(ctx: HandlerContext): string | undefined {
  const rows = ctx.interaction.data?.components ?? [];
  for (const row of rows) {
    for (const component of row.components as TextInputComponent[]) {
      if (component.custom_id === ctx.config.customIds.ticketDescriptionInput) {
        return component.value?.trim();
      }
    }
  }
  return undefined;
}

function buildStaffMentions(ctx: HandlerContext): string {
  return ctx.config.structural.STAFF_ROLE_IDS.map((id) => `<@&${id}>`).join(' ');
}

function buildTicketName(ctx: HandlerContext, username: string, userId: string): string {
  const template =
    ctx.config.TICKET_MODE === 'channel'
      ? ctx.config.naming.ticketChannel
      : ctx.config.naming.ticketThread;

  return sanitizeChannelName(formatTemplate(template, { username, userId }));
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

export async function handleCreateTicketModal(
  ctx: HandlerContext,
): Promise<Response> {
  const user = getInteractionUser(ctx);
  const guildId = ctx.interaction.guild_id;

  if (!user || !guildId) {
    return deferredResponse(true);
  }

  const description = extractDescription(ctx);
  if (!description) {
    void followupError(ctx, ctx.config.messages.genericError);
    return deferredResponse(true);
  }

  return deferredResponse(true);
}

export async function runTicketCreation(ctx: HandlerContext): Promise<void> {
  const user = getInteractionUser(ctx);
  const guildId = ctx.interaction.guild_id;
  if (!user || !guildId) return;

  const description = extractDescription(ctx);
  if (!description) {
    await followupError(ctx, ctx.config.messages.genericError);
    return;
  }

  const { config, env } = ctx;

  try {
    if (config.TICKET_MODE === 'channel') {
      const existing = await findOpenTicketChannelForUser(
        env,
        config,
        guildId,
        user.id,
      );
      if (existing) {
        await followupError(ctx, config.messages.ticketAlreadyOpen);
        return;
      }
    }

    const ticketName = buildTicketName(ctx, user.username, user.id);
    const userMention = `<@${user.id}>`;
    const staffMentions = buildStaffMentions(ctx);
    const messagePayload = buildTicketOpenedPayload(
      config,
      userMention,
      description,
      staffMentions,
      user.id,
    );

    let ticketLocation: string;

    if (config.TICKET_MODE === 'channel') {
      const channel = await createTicketChannel(
        env,
        config,
        guildId,
        user.id,
        ticketName,
      );
      ticketLocation = `<#${channel.id}>`;
      await sendChannelMessage(env, channel.id, messagePayload);
    } else {
      const thread = await createTicketThread(env, config, user.id, ticketName);
      ticketLocation = `<#${thread.id}>`;
      await sendChannelMessage(env, thread.id, messagePayload);
    }

    await editInteractionFollowup(
      env,
      env.DISCORD_APPLICATION_ID,
      ctx.interaction.token,
      {
        content: `${config.messages.ticketCreated} ${ticketLocation}`,
        flags: 64,
      },
    );
  } catch (error) {
    console.error('Ticket creation failed:', error);
    await followupError(ctx, mapDiscordErrorToMessage(config, error));
  }
}
