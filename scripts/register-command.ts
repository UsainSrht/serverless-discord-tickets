/**
 * Register (or update) the /ticket slash command with Discord.
 *
 * Usage:
 *   npm run register-command -- YOUR_GUILD_ID
 *
 * Reads DISCORD_TOKEN, DISCORD_APPLICATION_ID, and optional config vars from the environment.
 * For local dev, values come from .dev.vars when using wrangler, or export them manually.
 */

import { loadConfig, type ConfigEnv } from '../src/config';

const DISCORD_API = 'https://discord.com/api/v10';

const env: ConfigEnv = {
  TICKET_MODE: process.env.TICKET_MODE,
  TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID,
  ARCHIVE_CATEGORY_ID: process.env.ARCHIVE_CATEGORY_ID,
  THREAD_CHANNEL_ID: process.env.THREAD_CHANNEL_ID,
  STAFF_ROLE_IDS: process.env.STAFF_ROLE_IDS,
  BOT_CONFIG_OVERRIDES: process.env.BOT_CONFIG_OVERRIDES,
};

const config = loadConfig(env);

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.argv[2];

if (!token || !applicationId) {
  console.error(
    'Missing DISCORD_TOKEN or DISCORD_APPLICATION_ID.\n' +
      'Set them in .dev.vars or export them before running this script.',
  );
  process.exit(1);
}

const commandBody = {
  name: config.commands.ticket.name,
  description: config.commands.ticket.description,
  type: 1,
  default_member_permissions: '8',
  dm_permission: false,
};

async function registerCommand(): Promise<void> {
  const url = guildId
    ? `${DISCORD_API}/applications/${applicationId}/guilds/${guildId}/commands`
    : `${DISCORD_API}/applications/${applicationId}/commands`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commandBody),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Failed to register command:', data);
    process.exit(1);
  }

  console.log(
    guildId
      ? `Guild command registered in ${guildId}:`
      : 'Global command registered (may take up to 1 hour):',
  );
  console.log(JSON.stringify(data, null, 2));
}

registerCommand().catch((error) => {
  console.error(error);
  process.exit(1);
});
