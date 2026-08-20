# serverless-discord-tickets

A fully customizable, open-source Discord ticket bot for **Cloudflare Workers**. Uses Discord's HTTP Interactions API (no WebSocket gateway).

**Customize everything via a Web UI dashboard directly from Discord** using `/ticket-admin customize`.

## How configuration works

| Layer | Where | In GitHub? |
|-------|--------|------------|
| Code defaults | `src/config.ts` | Yes (generic only) |
| Web UI customizations | Cloudflare **KV** (`TICKETS_KV`) | No (per-server) |
| Bot credentials | Cloudflare **Secrets** | No |
| Fallback / Global overrides | `BOT_CONFIG_OVERRIDES` **Secret** | No |

---

## Web UI Customization Dashboard (`/ticket-admin customize`)

1. In your Discord server, run `/ticket-admin customize` (Admin only).
2. The bot generates an ephemeral **10-minute secure link**.
3. Open the link to customize:
   - **Ticket Mode & Categories**: Dropdowns with your server's actual Discord categories and channels.
   - **Staff Roles**: Clickable role pills populated from your Discord server.
   - **Embeds & Buttons**: Live interactive Discord embed preview with real-time color pickers and emoji pickers.
   - **Feedback Messages & Naming**: Custom channel format (`ticket-{username}`).
4. Click **Save Changes** — settings take effect immediately with zero redeploy needed!

---

## Step-by-step deploy

### Step 1 — Discord Developer Portal

1. Create an app at [discord.com/developers/applications](https://discord.com/developers/applications).
2. Copy **Application ID** and **Public Key** (General Information).
3. Create a **Bot** and copy the **Token**.
4. Invite the bot with `bot` + `applications.commands` scopes and these permissions:
   - Manage Channels
   - Manage Threads (if using thread mode)
   - Send Messages · Embed Links · Read Message History

### Step 2 — Create Cloudflare KV Namespace

In Cloudflare Dashboard → **Workers & Pages** → **KV** → **Create Namespace**:
- Name: `TICKETS_KV`
- Bind it in `wrangler.toml`:
  ```toml
  [[kv_namespaces]]
  binding = "TICKETS_KV"
  id = "YOUR_KV_NAMESPACE_ID"
  ```

### Step 3 — Push to GitHub & Connect to Cloudflare Workers

1. Push your repository to GitHub.
2. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Connect to Git**.
3. Set Deploy command: `npx wrangler deploy --keep-vars`.

### Step 4 — Set Cloudflare Secrets

In your Worker → **Settings** → **Variables and Secrets** → **Secrets**:

| Secret | Value |
|--------|--------|
| `DISCORD_TOKEN` | Bot token from Step 1 |
| `DISCORD_PUBLIC_KEY` | Public key from Step 1 |
| `DISCORD_APPLICATION_ID` | Application ID from Step 1 |

### Step 5 — Set the Interactions Endpoint

1. Copy your Worker URL (e.g. `https://serverless-discord-tickets.your-name.workers.dev`).
2. Discord Developer Portal → your app → **General Information** → **Interactions Endpoint URL** → paste the URL → **Save Changes**.

### Step 6 — Register slash commands

Locally, with `.dev.vars` configured:

```bash
npm run register-command -- YOUR_GUILD_ID
```

This registers the slash commands:
- `/ticket` — Opens the ticket creation modal directly (accessible by all server members).
- `/ticket-admin panel` — Posts the ticket creation panel and button in the channel (Admin only).
- `/ticket-admin customize` — Generates a 10-minute Web UI customization link (Admin only).

---

## Local development

```bash
cp .dev.vars.example .dev.vars
# Fill in values

npm install
npm run dev
```

---

## Project structure

```
src/
  config.ts              # Types, defaults, loadGuildConfig()
  index.ts               # Worker entry point & routing
  handlers/              # Interaction handlers (/ticket, /ticket-admin, buttons, modals)
  web/
    html.ts              # Web UI Dashboard single-page app & live embed preview
    router.ts            # Web UI & REST API router
  discord/               # REST API client + component builders
scripts/
  register-command.ts    # Register /ticket and /ticket-admin slash commands
```

## License

MIT
