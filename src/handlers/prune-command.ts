import {
  deleteTicketChannel,
  editInteractionFollowup,
  getArchivedThreads,
  getGuildChannels,
  getSnowflakeTimestamp,
  mapDiscordErrorToMessage,
} from '../discord/api';
import type { HandlerContext } from '../env';
import { deferredResponse, messageResponse } from '../responses';
import { ChannelType, type ApplicationCommandInteractionDataOption } from '../types';
import { isMemberAdmin } from './customize-command';

export interface PruneOptions {
  limit: number;
  days: number;
  dryRun: boolean;
}

export function extractPruneOptions(ctx: HandlerContext): PruneOptions {
  const topOptions = ctx.interaction.data?.options;
  const subcommand = topOptions?.find((o) => o.name === 'prune');
  const optionList: ApplicationCommandInteractionDataOption[] =
    subcommand?.options ?? topOptions ?? [];

  const rawLimit = optionList.find((o) => o.name === 'limit')?.value;
  const rawDays = optionList.find((o) => o.name === 'days')?.value;
  const rawDryRun = optionList.find((o) => o.name === 'dry_run')?.value;

  let limit = typeof rawLimit === 'number' ? Math.floor(rawLimit) : 50;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  let days = typeof rawDays === 'number' ? Math.floor(rawDays) : 0;
  if (days < 0) days = 0;

  const dryRun = rawDryRun === true;

  return { limit, days, dryRun };
}

export async function handlePruneCommand(
  ctx: HandlerContext,
): Promise<{ response: Response; proceed: boolean; options: PruneOptions }> {
  const defaultOptions: PruneOptions = { limit: 50, days: 0, dryRun: false };
  const guildId = ctx.interaction.guild_id;

  if (!guildId) {
    return {
      response: messageResponse(
        'This command can only be used inside a Discord server.',
        true,
      ),
      proceed: false,
      options: defaultOptions,
    };
  }

  if (!isMemberAdmin(ctx)) {
    return {
      response: messageResponse(
        '⛔ You need Administrator or Manage Server permissions to prune archived tickets.',
        true,
      ),
      proceed: false,
      options: defaultOptions,
    };
  }

  const options = extractPruneOptions(ctx);

  return {
    response: deferredResponse(true),
    proceed: true,
    options,
  };
}

export async function runTicketPrune(
  ctx: HandlerContext,
  options: PruneOptions,
): Promise<void> {
  const { env, config, interaction } = ctx;
  const guildId = interaction.guild_id;
  if (!guildId) return;

  const { limit, days, dryRun } = options;
  const now = Date.now();
  const cutoffTimestamp =
    days > 0 ? now - days * 24 * 60 * 60 * 1000 : undefined;

  try {
    const candidateTickets: Array<{
      id: string;
      name: string;
      createdAt: number;
    }> = [];

    if (config.TICKET_MODE === 'channel') {
      const archiveCategoryId = config.structural.ARCHIVE_CATEGORY_ID?.trim();
      if (!archiveCategoryId) {
        await editInteractionFollowup(
          env,
          env.DISCORD_APPLICATION_ID,
          interaction.token,
          {
            content:
              '⚠️ Archive category is not configured (`ARCHIVE_CATEGORY_ID`). Please configure it in `/ticket-admin customize` before pruning.',
            flags: 64,
          },
        );
        return;
      }

      const allChannels = await getGuildChannels(env, guildId);
      const archivedChannels = allChannels.filter(
        (c) =>
          c.parent_id === archiveCategoryId &&
          c.type === ChannelType.GuildText,
      );

      for (const ch of archivedChannels) {
        const createdAt = getSnowflakeTimestamp(ch.id);
        if (cutoffTimestamp === undefined || createdAt <= cutoffTimestamp) {
          candidateTickets.push({
            id: ch.id,
            name: ch.name,
            createdAt,
          });
        }
      }
    } else {
      // Thread mode
      const threadChannelId = config.structural.THREAD_CHANNEL_ID?.trim();
      if (!threadChannelId) {
        await editInteractionFollowup(
          env,
          env.DISCORD_APPLICATION_ID,
          interaction.token,
          {
            content:
              '⚠️ Ticket thread channel is not configured (`THREAD_CHANNEL_ID`). Please configure it in `/ticket-admin customize` before pruning.',
            flags: 64,
          },
        );
        return;
      }

      const archivedThreads = await getArchivedThreads(
        env,
        threadChannelId,
        'private',
      );
      for (const th of archivedThreads) {
        const createdAt = getSnowflakeTimestamp(th.id);
        if (cutoffTimestamp === undefined || createdAt <= cutoffTimestamp) {
          candidateTickets.push({
            id: th.id,
            name: th.name,
            createdAt,
          });
        }
      }
    }

    // Sort tickets from oldest to newest so oldest tickets are pruned first
    candidateTickets.sort((a, b) => a.createdAt - b.createdAt);

    // Apply limit
    const ticketsToPrune = candidateTickets.slice(0, limit);

    if (ticketsToPrune.length === 0) {
      const msg =
        days > 0
          ? `ℹ️ No archived tickets found older than **${days} day(s)**.`
          : 'ℹ️ No archived tickets found to prune.';

      await editInteractionFollowup(
        env,
        env.DISCORD_APPLICATION_ID,
        interaction.token,
        {
          embeds: [
            {
              title: '🧹 Ticket Prune',
              description: msg,
              color: 0x5865f2,
              footer: { text: `Ticket Mode: ${config.TICKET_MODE}` },
            },
          ],
          flags: 64,
        },
      );
      return;
    }

    if (dryRun) {
      // Preview mode - do not delete
      const sampleList = ticketsToPrune
        .slice(0, 15)
        .map((t) => {
          const daysOld = Math.floor(
            (now - t.createdAt) / (1000 * 60 * 60 * 24),
          );
          return `• **${t.name}** (<t:${Math.floor(t.createdAt / 1000)}:R>, ~${daysOld}d old)`;
        })
        .join('\n');

      const extraCount =
        ticketsToPrune.length > 15
          ? `\n*…and ${ticketsToPrune.length - 15} more.*`
          : '';

      await editInteractionFollowup(
        env,
        env.DISCORD_APPLICATION_ID,
        interaction.token,
        {
          embeds: [
            {
              title: '🔍 Prune Preview (Dry Run)',
              description:
                `Found **${ticketsToPrune.length}** archived ticket(s) matching criteria.\n\n` +
                `**Filters:** Limit: \`${limit}\` | Min Age: \`${days > 0 ? `${days} day(s)` : 'None (all)'}\`\n\n` +
                `**Matching Tickets:**\n${sampleList}${extraCount}\n\n` +
                `⚠️ *No tickets were deleted. Run without \`dry_run\` to permanently delete them.*`,
              color: 0xfee75c,
              footer: {
                text: `Ticket Mode: ${config.TICKET_MODE} · Total found: ${candidateTickets.length}`,
              },
            },
          ],
          flags: 64,
        },
      );
      return;
    }

    // Actual deletion
    let deletedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const ticket of ticketsToPrune) {
      try {
        await deleteTicketChannel(env, ticket.id);
        deletedCount++;
      } catch (err) {
        failedCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errors.length < 3) {
          errors.push(`• **${ticket.name}**: ${errMsg}`);
        }
      }
    }

    const errorDetails =
      errors.length > 0 ? `\n\n**Errors:**\n${errors.join('\n')}` : '';

    await editInteractionFollowup(
      env,
      env.DISCORD_APPLICATION_ID,
      interaction.token,
      {
        embeds: [
          {
            title: '🧹 Prune Complete',
            description:
              `Successfully deleted **${deletedCount}** archived ticket(s).\n` +
              (failedCount > 0
                ? `⚠️ Failed to delete **${failedCount}** ticket(s).\n`
                : '') +
              (candidateTickets.length > ticketsToPrune.length
                ? `*Note: ${candidateTickets.length - ticketsToPrune.length} archived ticket(s) remain (exceeded limit of ${limit}). Run prune again to delete more.*\n`
                : '') +
              errorDetails,
            color: failedCount === 0 ? 0x57f287 : 0xed4245,
            footer: { text: `Ticket Mode: ${config.TICKET_MODE}` },
            timestamp: new Date().toISOString(),
          },
        ],
        flags: 64,
      },
    );
  } catch (error) {
    console.error('Ticket prune failed:', error);
    await editInteractionFollowup(
      env,
      env.DISCORD_APPLICATION_ID,
      interaction.token,
      {
        content: mapDiscordErrorToMessage(config, error),
        flags: 64,
      },
    );
  }
}
