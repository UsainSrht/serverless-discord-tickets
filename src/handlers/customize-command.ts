import { getKV, PermissionFlags, type HandlerContext } from '../env';
import { ephemeralPayloadResponse, messageResponse } from '../responses';
import type { DiscordMessagePayload } from '../types';

export function isMemberAdmin(ctx: HandlerContext): boolean {
  const permissions = ctx.interaction.member?.permissions;
  if (!permissions) {
    return false;
  }
  const permBigInt = BigInt(permissions);
  return (
    (permBigInt & PermissionFlags.ADMINISTRATOR) !== 0n ||
    (permBigInt & PermissionFlags.MANAGE_GUILD) !== 0n
  );
}

export async function handleCustomizeCommand(
  ctx: HandlerContext,
): Promise<Response> {
  const guildId = ctx.interaction.guild_id;
  if (!guildId) {
    return messageResponse(
      'This command can only be used inside a Discord server.',
      true,
    );
  }

  // Check if member has Admin or Manage Guild permissions
  if (!isMemberAdmin(ctx)) {
    return messageResponse(
      '⛔ You need Administrator or Manage Server permissions to customize the ticket bot.',
      true,
    );
  }

  const kv = getKV(ctx.env);
  if (!kv) {
    return messageResponse(
      '⚠️ Cloudflare KV is not configured on this Worker.\n' +
        'Please bind `TICKETS_KV` in `wrangler.toml` to enable the Web UI dashboard.',
      true,
    );
  }

  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 600 * 1000;
  const userId =
    ctx.interaction.member?.user?.id ?? ctx.interaction.user?.id ?? '';

  try {
    await kv.put(
      `session:${token}`,
      JSON.stringify({
        guildId,
        userId,
        createdAt: Date.now(),
        expiresAt,
      }),
      { expirationTtl: 600 },
    );
  } catch (error) {
    console.error('Failed to create KV session token:', error);
    return messageResponse(
      'Failed to generate customization session. Please check your KV configuration.',
      true,
    );
  }

  let baseUrl = ctx.env.WORKER_URL?.trim().replace(/\/+$/, '');
  if (!baseUrl && ctx.request) {
    const url = new URL(ctx.request.url);
    baseUrl = `${url.protocol}//${url.host}`;
  }
  if (!baseUrl) {
    baseUrl = '';
  }

  const customizeUrl = `${baseUrl}/customize?token=${token}`;

  const payload: DiscordMessagePayload = {
    embeds: [
      {
        title: '⚙️ Ticket Bot Customization Dashboard',
        description:
          'Click the button below to open the Web UI dashboard and customize settings, embeds, buttons, categories, and staff roles for this server.\n\n' +
          '⏱️ **This secure link is valid for 10 minutes.**\n' +
          `🔗 [Direct Link](${customizeUrl})`,
        color: 0x5865f2,
        footer: {
          text: 'Only visible to you · Never share this link',
        },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'Open Customization Web UI',
            url: customizeUrl,
            emoji: { name: '⚙️' },
          },
        ],
      },
    ],
  };

  return ephemeralPayloadResponse(payload);
}
