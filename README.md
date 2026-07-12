# serverless-discord-tickets

A fully customizable, open-source Discord ticket bot for **Cloudflare Workers**. Uses Discord's HTTP Interactions API (no WebSocket gateway).

**Your private UI customizations never go in Git** — they live in Cloudflare as `BOT_CONFIG_OVERRIDES`.

## How configuration works

| Layer | Where | In GitHub? |
|-------|--------|------------|
| Code defaults | `src/config.ts` | Yes (generic only) |
| Server IDs & mode | Cloudflare **Variables** | No |
| Bot credentials | Cloudflare **Secrets** | No |
| Your embeds, buttons, messages | `BOT_CONFIG_OVERRIDES` **Secret** | No |

---

## Step-by-step deploy (Option 2)

### Step 1 — Discord Developer Portal

1. Create an app at [discord.com/developers/applications](https://discord.com/developers/applications).
2. Copy **Application ID** and **Public Key** (General Information).
3. Create a **Bot** and copy the **Token**.
4. Invite the bot with `bot` + `applications.commands` scopes and these permissions:
   - Manage Channels
   - Manage Threads (if using thread mode)
   - Send Messages · Embed Links · Read Message History

### Step 2 — Prepare your Discord server

Create and copy IDs (Developer Mode → right-click → Copy ID):

- Ticket category (channel mode)
- Archive category (channel mode)
- Thread parent channel (thread mode)
- Staff role(s)

### Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/serverless-discord-tickets.git
git push -u origin main
```

The public repo only contains generic defaults — no tokens, no your UI.

### Step 4 — Connect Cloudflare Workers to GitHub

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create**.
2. Choose **Connect to Git** → select your repo.
3. Build settings:
   - **Build command:** (leave empty — Wrangler builds automatically)
   - **Deploy command:** `npx wrangler deploy`
4. Finish setup. Cloudflare deploys on every push to `main`.

### Step 5 — Set Cloudflare Secrets

In your Worker → **Settings** → **Variables and Secrets** → **Secrets**:

| Secret | Value |
|--------|--------|
| `DISCORD_TOKEN` | Bot token from Step 1 |
| `DISCORD_PUBLIC_KEY` | Public key from Step 1 |
| `DISCORD_APPLICATION_ID` | Application ID from Step 1 |

### Step 6 — Set Cloudflare Variables

Same page → **Environment Variables** (plain text, not secrets):

| Variable | Example |
|----------|---------|
| `TICKET_MODE` | `channel` or `thread` |
| `TICKET_CATEGORY_ID` | `123456789012345678` |
| `ARCHIVE_CATEGORY_ID` | `123456789012345678` |
| `THREAD_CHANNEL_ID` | `123456789012345678` |
| `STAFF_ROLE_IDS` | `111111111111111111,222222222222222222` |

Redeploy if prompted (or push any commit).

### Step 7 — Add your private UI customization

On your machine (not in Git):

```bash
cp config.overrides.example.json config.overrides.json
# Edit config.overrides.json with your embeds, buttons, messages, colors

npm run encode-config -- config.overrides.json
```

Copy the output and add it as a **Secret** named `BOT_CONFIG_OVERRIDES` in Cloudflare.

Only include fields you want to override — everything else uses code defaults.

**Embed colors** are decimal integers (`0x5865f2` → `5793266`).

Redeploy after adding the secret.

### Step 8 — Set the Interactions Endpoint

1. Copy your Worker URL (e.g. `https://serverless-discord-tickets.your-name.workers.dev`).
2. Discord Developer Portal → your app → **General Information** → **Interactions Endpoint URL** → paste the URL → **Save Changes**.
3. Discord sends a PING; the worker responds automatically. You should see a green checkmark.

### Step 9 — Register the slash command

Locally, with the same env values:

```bash
cp .dev.vars.example .dev.vars
# Fill in .dev.vars with your secrets and IDs

# Load .dev.vars in PowerShell:
Get-Content .dev.vars | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim() }
}

npm run register-command -- YOUR_GUILD_ID
```

Guild commands appear instantly. Omit the guild ID for a global command (up to ~1 hour to propagate).

### Step 10 — Test

1. Run `/ticket` in Discord (admin only) → ticket panel appears with **your** embed text.
2. Click **Create Ticket** → modal → submit → channel/thread is created.
3. Click **Close Ticket** → ticket is archived.

---

## Local development

```bash
cp .dev.vars.example .dev.vars
# Fill in values + optional BOT_CONFIG_OVERRIDES line from encode-config

npm install
npm run dev
```

Use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) to tunnel localhost and set that URL as the Interactions Endpoint while testing.

---

## Updating your customization later

1. Edit `config.overrides.json` locally.
2. Run `npm run encode-config -- config.overrides.json`.
3. Update the `BOT_CONFIG_OVERRIDES` secret in Cloudflare.
4. Redeploy (or wait for next Git push — secrets persist across deploys).

No Git commit needed. Your branding stays private.

---

## Project structure

```
src/
  config.ts              # Types, defaults, loadConfig()
  index.ts                 # Worker entry point
  handlers/                # Interaction handlers
  discord/                 # REST API + component builders
config.overrides.example.json   # Example UI overrides (safe to commit)
config.overrides.json           # YOUR overrides (gitignored)
.dev.vars.example               # Local env template
scripts/
  register-command.ts
  encode-config-overrides.ts
```

## License

MIT
