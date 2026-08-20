/**
 * Register (or update) the /ticket slash command with Discord.
 *
 * Usage:
 *   npm run register-command -- YOUR_GUILD_ID
 *
 * Reads DISCORD_TOKEN, DISCORD_APPLICATION_ID, and optional config vars from the environment.
 * Loads `.dev.vars` automatically when present (same file Wrangler uses for `npm run dev`).
 */

import { loadConfig, type ConfigEnv } from '../src/config';
import { buildApplicationCommands } from '../src/discord/api';
import { loadDevVars } from './load-dev-vars';

loadDevVars();

const DISCORD_API = 'https://discord.com/api/v10';

const env: ConfigEnv = {
  TICKET_MODE: process.env.TICKET_MODE,
  TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID,
  ARCHIVE_CATEGORY_ID: process.env.ARCHIVE_CATEGORY_ID,
  THREAD_CHANNEL_ID: process.env.THREAD_CHANNEL_ID,
  STAFF_ROLE_IDS: process.env.STAFF_ROLE_IDS,
  MAX_OPEN_TICKETS_PER_USER: process.env.MAX_OPEN_TICKETS_PER_USER,
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

const commands = buildApplicationCommands(config);

async function registerCommands(): Promise<void> {
  const url = guildId
    ? `${DISCORD_API}/applications/${applicationId}/guilds/${guildId}/commands`
    : `${DISCORD_API}/applications/${applicationId}/commands`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Failed to register commands:', data);
    process.exit(1);
  }

  console.log(
    guildId
      ? `Guild commands registered in ${guildId}:`
      : 'Global commands registered (may take up to 1 hour):',
  );
  console.log(JSON.stringify(data, null, 2));
}

registerCommands().catch((error) => {
  console.error(error);
  process.exit(1);
});

