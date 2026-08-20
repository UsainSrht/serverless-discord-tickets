export function renderDashboardHtml(token: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discord Tickets - Server Customization</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=gg+sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-darkest: #111214;
      --bg-darker: #1e1f22;
      --bg-dark: #2b2d31;
      --bg-card: #313338;
      --bg-card-hover: #383a40;
      --bg-input: #1e1f22;
      --bg-input-border: #3f4147;
      
      --text-primary: #f2f3f5;
      --text-secondary: #dbdee1;
      --text-muted: #949ba4;
      
      --blurple: #5865f2;
      --blurple-hover: #4752c4;
      --green: #57f287;
      --green-hover: #3ba55d;
      --red: #ed4245;
      --red-hover: #da373c;
      --yellow: #fee75c;
      --gray-btn: #4e5058;
      --gray-btn-hover: #6d6f78;
      
      --font-main: 'gg sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', Consolas, Monaco, monospace;
      --radius: 8px;
      --radius-sm: 4px;
      --radius-lg: 12px;
      --shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      --transition: all 0.15s ease-in-out;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-main);
      background-color: var(--bg-darkest);
      color: var(--text-primary);
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    /* Top Navigation Bar */
    header {
      background-color: var(--bg-darker);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .guild-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--blurple);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: #fff;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .guild-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .guild-meta h1 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .guild-meta .badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background-color: var(--blurple);
      color: #fff;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .guild-meta p {
      font-size: 12px;
      color: var(--text-muted);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .session-timer {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius);
      background-color: rgba(254, 231, 92, 0.1);
      border: 1px solid rgba(254, 231, 92, 0.3);
      color: var(--yellow);
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-mono);
    }

    .session-timer.warning {
      background-color: rgba(237, 66, 69, 0.15);
      border-color: rgba(237, 66, 69, 0.4);
      color: var(--red);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-family: var(--font-main);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: var(--transition);
      text-decoration: none;
    }

    .btn-blurple {
      background-color: var(--blurple);
      color: #fff;
    }
    .btn-blurple:hover { background-color: var(--blurple-hover); }

    .btn-green {
      background-color: var(--green);
      color: #111;
    }
    .btn-green:hover { background-color: var(--green-hover); }

    .btn-gray {
      background-color: var(--gray-btn);
      color: #fff;
    }
    .btn-gray:hover { background-color: var(--gray-btn-hover); }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Main Container */
    .app-container {
      display: grid;
      grid-template-columns: 1fr 440px;
      gap: 24px;
      max-width: 1500px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      flex: 1;
    }

    @media (max-width: 1080px) {
      .app-container {
        grid-template-columns: 1fr;
      }
    }

    /* Tabs Bar */
    .tabs-nav {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 12px;
      margin-bottom: 20px;
      overflow-x: auto;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: var(--font-main);
      font-size: 14px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      transition: var(--transition);
    }

    .tab-btn:hover {
      color: var(--text-secondary);
      background-color: rgba(255, 255, 255, 0.04);
    }

    .tab-btn.active {
      color: #fff;
      background-color: var(--bg-card);
    }

    /* Cards & Form Sections */
    .tab-pane {
      display: none;
      flex-direction: column;
      gap: 20px;
    }

    .tab-pane.active {
      display: flex;
    }

    .card {
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .form-hint {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .form-control {
      width: 100%;
      background-color: var(--bg-input);
      border: 1px solid var(--bg-input-border);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-family: var(--font-main);
      font-size: 14px;
      padding: 10px 12px;
      outline: none;
      transition: var(--transition);
    }

    .form-control:focus {
      border-color: var(--blurple);
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
    }

    /* Color Picker Component */
    .color-picker-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .color-swatch-input {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--bg-input-border);
      cursor: pointer;
      background: none;
      padding: 0;
    }

    .preset-swatches {
      display: flex;
      gap: 8px;
    }

    .preset-swatch {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: var(--transition);
    }

    .preset-swatch:hover {
      transform: scale(1.15);
      border-color: #fff;
    }

    /* Multi-select Role Badges */
    .role-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 16px;
      background-color: var(--bg-darker);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      user-select: none;
      transition: var(--transition);
    }

    .role-pill .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .role-pill.selected {
      background-color: rgba(88, 101, 242, 0.25);
      border-color: var(--blurple);
      color: #fff;
    }

    /* Discord Live Preview Column */
    .preview-column {
      position: sticky;
      top: 88px;
      height: fit-content;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .preview-header h2 {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .preview-toggle {
      display: flex;
      gap: 4px;
      background-color: var(--bg-darker);
      padding: 2px;
      border-radius: var(--radius-sm);
    }

    .preview-toggle button {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }

    .preview-toggle button.active {
      background-color: var(--bg-card);
      color: #fff;
    }

    /* Discord Message Simulator */
    .discord-chat {
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.04);
      box-shadow: var(--shadow);
    }

    .discord-msg {
      display: flex;
      gap: 14px;
    }

    .discord-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--blurple);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
      font-size: 16px;
      flex-shrink: 0;
    }

    .discord-content {
      flex: 1;
      min-width: 0;
    }

    .discord-author {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .discord-name {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
    }

    .discord-bot-tag {
      background-color: var(--blurple);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      line-height: 1.2;
    }

    .discord-time {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Discord Embed */
    .discord-embed {
      background-color: var(--bg-darker);
      border-radius: 4px;
      border-left: 4px solid var(--blurple);
      padding: 12px 16px;
      margin-top: 6px;
      max-width: 520px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: border-color 0.15s ease;
    }

    .discord-embed-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
      word-break: break-word;
    }

    .discord-embed-desc {
      font-size: 13px;
      color: var(--text-secondary);
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.4;
    }

    /* Discord Action Row Buttons */
    .discord-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .discord-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-main);
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 3px;
      cursor: default;
      user-select: none;
      transition: var(--transition);
      border: none;
      color: #fff;
    }

    .discord-btn.style-1 { background-color: var(--blurple); } /* Primary */
    .discord-btn.style-2 { background-color: var(--gray-btn); } /* Secondary */
    .discord-btn.style-3 { background-color: var(--green); color: #000; } /* Success */
    .discord-btn.style-4 { background-color: var(--red); } /* Danger */

    /* Command Aliases & Localizations */
    .alias-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
      min-height: 24px;
    }

    .alias-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      background-color: var(--bg-darker);
      border: 1px solid rgba(88, 101, 242, 0.4);
      color: var(--blurple);
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
    }

    .loc-table {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
      margin-bottom: 12px;
    }

    .loc-row {
      display: grid;
      grid-template-columns: 170px 1fr 1.5fr 36px;
      gap: 8px;
      align-items: center;
      background-color: var(--bg-darker);
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    @media (max-width: 768px) {
      .loc-row {
        grid-template-columns: 1fr;
      }
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn-icon-danger {
      width: 36px;
      height: 36px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(237, 66, 69, 0.15);
      color: var(--red);
      border: 1px solid rgba(237, 66, 69, 0.3);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 14px;
      transition: var(--transition);
    }

    .btn-icon-danger:hover {
      background-color: var(--red);
      color: #fff;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: var(--bg-dark);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 14px 20px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      box-shadow: var(--shadow);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 1000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.success { border-left: 4px solid var(--green); }
    .toast.error { border-left: 4px solid var(--red); }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background-color: var(--bg-darkest);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 999;
      transition: opacity 0.3s ease;
    }

    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(88, 101, 242, 0.2);
      border-top-color: var(--blurple);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <!-- Loading State -->
  <div id="loading" class="loading-overlay">
    <div class="spinner"></div>
    <div style="font-weight: 600; color: var(--text-secondary);">Loading server configuration…</div>
  </div>

  <!-- Header -->
  <header>
    <div class="header-left">
      <div id="guildIcon" class="guild-icon">🎫</div>
      <div class="guild-meta">
        <h1 id="guildName">Discord Tickets <span class="badge">Admin</span></h1>
        <p id="guildSubtitle">Customizing ticket panel, messages & settings</p>
      </div>
    </div>
    <div class="header-right">
      <div id="sessionTimer" class="session-timer">
        <span>⏱️</span> <span id="timerText">10:00</span>
      </div>
      <button id="saveBtn" class="btn btn-green">
        <span>💾</span> Save Changes
      </button>
    </div>
  </header>

  <!-- App Body -->
  <div class="app-container">
    
    <!-- Left Column: Form Settings -->
    <main>
      <nav class="tabs-nav">
        <button class="tab-btn active" data-tab="general">⚙️ Setup & Mode</button>
        <button class="tab-btn" data-tab="commands">⚡ Commands & Aliases</button>
        <button class="tab-btn" data-tab="categories">📂 Categories & Roles</button>
        <button class="tab-btn" data-tab="panel">🎫 Ticket Panel Embed</button>
        <button class="tab-btn" data-tab="welcome">📨 Welcome & Buttons</button>
        <button class="tab-btn" data-tab="modal">📝 Modal Form</button>
        <button class="tab-btn" data-tab="messages">💬 Bot Messages</button>
      </nav>

      <form id="configForm">

        <!-- Tab 1: Setup & Mode -->
        <section id="tab-general" class="tab-pane active">
          <div class="card">
            <h2 class="card-title">⚙️ Ticket Mode & Core Settings</h2>
            
            <div class="form-group">
              <label class="form-label" for="ticketMode">Ticket Creation Mode</label>
              <select id="ticketMode" class="form-control">
                <option value="channel">Channel Mode (Creates dedicated text channels in a category)</option>
                <option value="thread">Thread Mode (Creates private threads in a single channel)</option>
              </select>
              <div class="form-hint">Channel mode gives full category permission isolation; thread mode keeps the channel list clean.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="maxTickets">Max Open Tickets Per User</label>
              <input type="number" id="maxTickets" class="form-control" min="0" max="20" value="1">
              <div class="form-hint">Set to 1 to prevent spam, or 0 for unlimited concurrent tickets.</div>
            </div>
          </div>
        </section>

        <!-- Tab 2: Commands & Aliases -->
        <section id="tab-commands" class="tab-pane">
          <div class="card">
            <h2 class="card-title">⚡ User Ticket Slash Command</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="cmdTicketName">Primary Command Name</label>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-family: var(--font-mono); font-size: 16px; color: var(--text-muted);">/</span>
                  <input type="text" id="cmdTicketName" class="form-control" placeholder="ticket" value="ticket" style="font-family: var(--font-mono);">
                </div>
                <div class="form-hint">E.g. <code>ticket</code>, <code>destek</code>, <code>support</code> (lowercase, 1-32 chars).</div>
              </div>

              <div class="form-group">
                <label class="form-label" for="cmdTicketDesc">Command Description</label>
                <input type="text" id="cmdTicketDesc" class="form-control" placeholder="Open a support ticket" value="Open a support ticket">
                <div class="form-hint">Shown in Discord's slash command list.</div>
              </div>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label" for="cmdTicketAliases">Command Aliases (Multiple Slash Commands)</label>
              <input type="text" id="cmdTicketAliases" class="form-control" placeholder="destek, talep, support, yardım">
              <div class="form-hint">Comma-separated alias commands that open the ticket modal. Each alias is registered as a slash command in Discord.</div>
              <div id="ticketAliasBadges" class="alias-tags"></div>
            </div>

            <div class="form-group" style="margin-top: 18px;">
              <label class="form-label">🌐 Native Discord Localizations (Language-Specific Names & Descriptions)</label>
              <div class="form-hint" style="margin-bottom: 8px;">
                Discord automatically displays these localized names to users depending on their Discord app language.
              </div>
              <div id="ticketLocTable" class="loc-table"></div>
              <button type="button" class="btn btn-sm btn-gray" id="addTicketLocBtn">
                <span>➕</span> Add Language Localization
              </button>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">🛡️ Admin Slash Command</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="cmdAdminName">Primary Admin Command Name</label>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-family: var(--font-mono); font-size: 16px; color: var(--text-muted);">/</span>
                  <input type="text" id="cmdAdminName" class="form-control" placeholder="ticket-admin" value="ticket-admin" style="font-family: var(--font-mono);">
                </div>
                <div class="form-hint">E.g. <code>ticket-admin</code>, <code>destek-yonetim</code>, <code>support-admin</code>.</div>
              </div>

              <div class="form-group">
                <label class="form-label" for="cmdAdminDesc">Admin Command Description</label>
                <input type="text" id="cmdAdminDesc" class="form-control" placeholder="Manage support tickets and customize bot settings (Admin only)">
              </div>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label" for="cmdAdminAliases">Admin Command Aliases</label>
              <input type="text" id="cmdAdminAliases" class="form-control" placeholder="ticketadmin, destek-admin, destek-yonetim">
              <div class="form-hint">Comma-separated aliases for the admin command (all include <code>panel</code> and <code>customize</code> subcommands).</div>
              <div id="adminAliasBadges" class="alias-tags"></div>
            </div>

            <div class="form-group" style="margin-top: 18px;">
              <label class="form-label">🌐 Admin Command Localizations</label>
              <div id="adminLocTable" class="loc-table"></div>
              <button type="button" class="btn btn-sm btn-gray" id="addAdminLocBtn">
                <span>➕</span> Add Admin Language Localization
              </button>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">🔄 Discord Slash Command Sync</h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
              When you click <strong>Save Changes</strong>, custom commands, aliases, and localizations are automatically registered with Discord for this server. You can also sync immediately using the button below.
            </p>
            <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
              <button type="button" class="btn btn-blurple" id="syncCommandsBtn">
                <span>⚡</span> Sync Slash Commands to Discord Now
              </button>
              <div id="syncStatusMsg" style="font-size: 13px; font-weight: 500;"></div>
            </div>
          </div>
        </section>

        <!-- Tab 3: Categories & Roles -->
        <section id="tab-categories" class="tab-pane">
          <div class="card">
            <h2 class="card-title">📂 Channels & Staff Roles</h2>

            <div id="channelModeSettings">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="ticketCategory">Ticket Category</label>
                  <select id="ticketCategory" class="form-control">
                    <option value="">-- Select Category --</option>
                  </select>
                  <div class="form-hint">Category where new ticket channels will be created.</div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="archiveCategory">Archive Category</label>
                  <select id="archiveCategory" class="form-control">
                    <option value="">-- Select Category --</option>
                  </select>
                  <div class="form-hint">Category where closed tickets are moved for archival.</div>
                </div>
              </div>
            </div>

            <div id="threadModeSettings" style="display: none;">
              <div class="form-group">
                <label class="form-label" for="threadChannel">Thread Parent Channel</label>
                <select id="threadChannel" class="form-control">
                  <option value="">-- Select Channel --</option>
                </select>
                <div class="form-hint">Text channel where private ticket threads will be created.</div>
              </div>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label class="form-label">Staff Roles (Can view, close & manage tickets)</label>
              <div id="rolePills" class="role-pills">
                <!-- Populated dynamically -->
              </div>
              <div class="form-hint">Click roles to toggle access for your moderation/support team.</div>
            </div>
          </div>
        </section>

        <!-- Tab 3: Panel Embed & Button -->
        <section id="tab-panel" class="tab-pane">
          <div class="card">
            <h2 class="card-title">🎫 Ticket Panel Embed & Button</h2>

            <div class="form-group">
              <label class="form-label" for="panelTitle">Embed Title</label>
              <input type="text" id="panelTitle" class="form-control" placeholder="🎫 Support Tickets">
            </div>

            <div class="form-group">
              <label class="form-label" for="panelDesc">Embed Description</label>
              <textarea id="panelDesc" class="form-control" rows="4" placeholder="Need help? Click below to open a ticket."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Embed Accent Color</label>
              <div class="color-picker-row">
                <input type="color" id="panelColor" class="color-swatch-input" value="#5865f2">
                <input type="text" id="panelColorHex" class="form-control" style="width: 110px; font-family: var(--font-mono);" value="#5865F2">
                <div class="preset-swatches">
                  <div class="preset-swatch" style="background-color: #5865F2;" onclick="setPanelColor('#5865F2')"></div>
                  <div class="preset-swatch" style="background-color: #57F287;" onclick="setPanelColor('#57F287')"></div>
                  <div class="preset-swatch" style="background-color: #ED4245;" onclick="setPanelColor('#ED4245')"></div>
                  <div class="preset-swatch" style="background-color: #FEE75C;" onclick="setPanelColor('#FEE75C')"></div>
                  <div class="preset-swatch" style="background-color: #EB459E;" onclick="setPanelColor('#EB459E')"></div>
                  <div class="preset-swatch" style="background-color: #2B2D31;" onclick="setPanelColor('#2B2D31')"></div>
                </div>
              </div>
            </div>

            <div class="form-row" style="margin-top: 16px;">
              <div class="form-group">
                <label class="form-label" for="panelBtnLabel">Button Label</label>
                <input type="text" id="panelBtnLabel" class="form-control" value="Create Ticket">
              </div>

              <div class="form-group">
                <label class="form-label" for="panelBtnEmoji">Button Emoji</label>
                <input type="text" id="panelBtnEmoji" class="form-control" value="🎫">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="panelBtnStyle">Button Style</label>
              <select id="panelBtnStyle" class="form-control">
                <option value="1">Primary (Blurple)</option>
                <option value="2">Secondary (Gray)</option>
                <option value="3">Success (Green)</option>
                <option value="4">Danger (Red)</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Tab 4: Welcome Embed & Buttons -->
        <section id="tab-welcome" class="tab-pane">
          <div class="card">
            <h2 class="card-title">📨 Welcome Message (Inside Ticket)</h2>

            <div class="form-group">
              <label class="form-label" for="openedTitle">Welcome Embed Title</label>
              <input type="text" id="openedTitle" class="form-control" value="🎫 New Ticket">
            </div>

            <div class="form-group">
              <label class="form-label" for="openedTemplate">Welcome Description Template</label>
              <textarea id="openedTemplate" class="form-control" rows="4"></textarea>
              <div class="form-hint">Supported variables: <code>{user}</code> (user mention), <code>{description}</code> (user's reason).</div>
            </div>

            <div class="form-group">
              <label class="form-label">Welcome Embed Color</label>
              <div class="color-picker-row">
                <input type="color" id="openedColor" class="color-swatch-input" value="#57f287">
                <input type="text" id="openedColorHex" class="form-control" style="width: 110px; font-family: var(--font-mono);" value="#57F287">
              </div>
            </div>

            <div class="form-row" style="margin-top: 16px;">
              <div class="form-group">
                <label class="form-label" for="closeBtnLabel">Close Button Label</label>
                <input type="text" id="closeBtnLabel" class="form-control" value="Close Ticket">
              </div>
              <div class="form-group">
                <label class="form-label" for="closeBtnEmoji">Close Button Emoji</label>
                <input type="text" id="closeBtnEmoji" class="form-control" value="🔒">
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">🔒 Closed Ticket Embed & Archive</h2>

            <div class="form-group">
              <label class="form-label" for="closedTitle">Closed Embed Title</label>
              <input type="text" id="closedTitle" class="form-control" value="🔒 Ticket Closed">
            </div>

            <div class="form-group">
              <label class="form-label" for="closedTemplate">Closed Description Template</label>
              <textarea id="closedTemplate" class="form-control" rows="3"></textarea>
              <div class="form-hint">Supported variables: <code>{user}</code> (user who closed the ticket).</div>
            </div>

            <div class="form-group">
              <label class="form-label">Closed Embed Color</label>
              <div class="color-picker-row">
                <input type="color" id="closedColor" class="color-swatch-input" value="#ed4245">
                <input type="text" id="closedColorHex" class="form-control" style="width: 110px; font-family: var(--font-mono);" value="#ED4245">
              </div>
            </div>
          </div>
        </section>

        <!-- Tab 5: Modal Form -->
        <section id="tab-modal" class="tab-pane">
          <div class="card">
            <h2 class="card-title">📝 Ticket Creation Modal</h2>

            <div class="form-group">
              <label class="form-label" for="modalTitle">Modal Window Title</label>
              <input type="text" id="modalTitle" class="form-control" value="Open a Support Ticket">
            </div>

            <div class="form-group">
              <label class="form-label" for="modalInputLabel">Input Field Label</label>
              <input type="text" id="modalInputLabel" class="form-control" value="Describe your issue">
            </div>

            <div class="form-group">
              <label class="form-label" for="modalPlaceholder">Input Placeholder Text</label>
              <input type="text" id="modalPlaceholder" class="form-control" value="Briefly explain what you need help with…">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="modalMinLength">Min Length</label>
                <input type="number" id="modalMinLength" class="form-control" min="1" max="100" value="10">
              </div>
              <div class="form-group">
                <label class="form-label" for="modalMaxLength">Max Length</label>
                <input type="number" id="modalMaxLength" class="form-control" min="10" max="4000" value="1000">
              </div>
            </div>
          </div>
        </section>

        <!-- Tab 6: Messages & Naming -->
        <section id="tab-messages" class="tab-pane">
          <div class="card">
            <h2 class="card-title">💬 Feedback & Error Messages</h2>

            <div class="form-group">
              <label class="form-label" for="msgCreated">Ticket Created (Ephemeral Reply)</label>
              <input type="text" id="msgCreated" class="form-control">
            </div>

            <div class="form-group">
              <label class="form-label" for="msgAlreadyOpen">Already Open Ticket Notice</label>
              <input type="text" id="msgAlreadyOpen" class="form-control">
            </div>

            <div class="form-group">
              <label class="form-label" for="msgClosed">Ticket Closed Notice</label>
              <input type="text" id="msgClosed" class="form-control">
            </div>

            <div class="form-group">
              <label class="form-label" for="msgCloseNotAllowed">Close Not Allowed</label>
              <input type="text" id="msgCloseNotAllowed" class="form-control">
            </div>

            <div class="form-group">
              <label class="form-label" for="msgMissingPerms">Missing Bot Permissions</label>
              <input type="text" id="msgMissingPerms" class="form-control">
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">🏷️ Channel Naming</h2>
            <div class="form-group">
              <label class="form-label" for="namingChannel">Ticket Channel / Thread Name Format</label>
              <input type="text" id="namingChannel" class="form-control" value="ticket-{username}">
              <div class="form-hint">Variables: <code>{username}</code> (e.g. <code>ticket-john</code>). Automatically sanitized for Discord.</div>
            </div>
          </div>
        </section>

      </form>
    </main>

    <!-- Right Column: Live Discord Simulator -->
    <aside class="preview-column">
      <div class="preview-header">
        <h2>Live Discord Preview</h2>
        <div class="preview-toggle">
          <button id="viewPanelBtn" class="active" onclick="switchPreview('panel')">Panel</button>
          <button id="viewWelcomeBtn" onclick="switchPreview('welcome')">Inside Ticket</button>
        </div>
      </div>

      <div class="discord-chat">
        <!-- Panel Preview -->
        <div id="previewPanel">
          <div class="discord-msg">
            <div class="discord-avatar" id="prevBotAvatar">🎫</div>
            <div class="discord-content">
              <div class="discord-author">
                <span class="discord-name">Ticket Bot</span>
                <span class="discord-bot-tag">BOT</span>
                <span class="discord-time">Today at 12:00 PM</span>
              </div>
              <div class="discord-embed" id="prevPanelEmbed">
                <div class="discord-embed-title" id="prevPanelTitle">🎫 Support Tickets</div>
                <div class="discord-embed-desc" id="prevPanelDesc">Need help? Click the button below to open a private support ticket.</div>
              </div>
              <div class="discord-buttons">
                <button class="discord-btn style-1" id="prevPanelBtn">
                  <span id="prevPanelBtnEmoji">🎫</span>
                  <span id="prevPanelBtnText">Create Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Inside Ticket Welcome Preview -->
        <div id="previewWelcome" style="display: none;">
          <div class="discord-msg">
            <div class="discord-avatar">🎫</div>
            <div class="discord-content">
              <div class="discord-author">
                <span class="discord-name">Ticket Bot</span>
                <span class="discord-bot-tag">BOT</span>
                <span class="discord-time">Today at 12:01 PM</span>
              </div>
              <div class="discord-embed" id="prevOpenedEmbed" style="border-left-color: #57f287;">
                <div class="discord-embed-title" id="prevOpenedTitle">🎫 New Ticket</div>
                <div class="discord-embed-desc" id="prevOpenedDesc">@User opened a ticket.&#10;&#10;**Reason:**&#10;Need help with my account role.&#10;&#10;Staff: please assist when available.</div>
              </div>
              <div class="discord-buttons">
                <button class="discord-btn style-4" id="prevCloseBtn">
                  <span id="prevCloseBtnEmoji">🔒</span>
                  <span id="prevCloseBtnText">Close Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>

  </div>

  <!-- Toast -->
  <div id="toast" class="toast">
    <span id="toastIcon">✅</span>
    <span id="toastMsg">Changes saved!</span>
  </div>

  <script>
    const TOKEN = ${JSON.stringify(token)};
    let currentConfig = null;
    let selectedRoles = new Set();
    let timeLeftSeconds = 600;

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById('tab-' + tabId).classList.add('active');
      });
    });

    // Preview Toggle
    function switchPreview(mode) {
      document.getElementById('viewPanelBtn').classList.toggle('active', mode === 'panel');
      document.getElementById('viewWelcomeBtn').classList.toggle('active', mode === 'welcome');
      document.getElementById('previewPanel').style.display = mode === 'panel' ? 'block' : 'none';
      document.getElementById('previewWelcome').style.display = mode === 'welcome' ? 'block' : 'none';
    }

    // Color Helpers
    function hexToDecimal(hex) {
      return parseInt(hex.replace('#', ''), 16);
    }

    function decimalToHex(dec) {
      if (dec === undefined || dec === null) return '#5865f2';
      return '#' + Number(dec).toString(16).padStart(6, '0');
    }

    function setPanelColor(hex) {
      document.getElementById('panelColor').value = hex;
      document.getElementById('panelColorHex').value = hex.toUpperCase();
      updatePreview();
    }

    // Live Preview Updates
    function updatePreview() {
      // Panel Preview
      const panelTitle = document.getElementById('panelTitle').value || '🎫 Support Tickets';
      const panelDesc = document.getElementById('panelDesc').value || 'Need help? Click below to open a ticket.';
      const panelColor = document.getElementById('panelColor').value;
      const panelBtnLabel = document.getElementById('panelBtnLabel').value || 'Create Ticket';
      const panelBtnEmoji = document.getElementById('panelBtnEmoji').value || '🎫';
      const panelBtnStyle = document.getElementById('panelBtnStyle').value;

      document.getElementById('prevPanelTitle').textContent = panelTitle;
      document.getElementById('prevPanelDesc').textContent = panelDesc;
      document.getElementById('prevPanelEmbed').style.borderLeftColor = panelColor;
      document.getElementById('prevPanelBtnText').textContent = panelBtnLabel;
      document.getElementById('prevPanelBtnEmoji').textContent = panelBtnEmoji;
      document.getElementById('prevPanelBtn').className = 'discord-btn style-' + panelBtnStyle;

      // Welcome Preview
      const openedTitle = document.getElementById('openedTitle').value || '🎫 New Ticket';
      const openedColor = document.getElementById('openedColor').value;
      const openedTemplate = document.getElementById('openedTemplate').value || '{user} opened a ticket.\\n\\n**Reason:**\\n{description}';
      const closeBtnLabel = document.getElementById('closeBtnLabel').value || 'Close Ticket';
      const closeBtnEmoji = document.getElementById('closeBtnEmoji').value || '🔒';

      document.getElementById('prevOpenedTitle').textContent = openedTitle;
      document.getElementById('prevOpenedEmbed').style.borderLeftColor = openedColor;
      document.getElementById('prevOpenedDesc').textContent = openedTemplate
        .replace(/{user}/g, '@User')
        .replace(/{description}/g, 'Need help with my account role.');
      document.getElementById('prevCloseBtnText').textContent = closeBtnLabel;
      document.getElementById('prevCloseBtnEmoji').textContent = closeBtnEmoji;
    }

    // Bind input change listeners to live preview
    document.querySelectorAll('#configForm input, #configForm textarea, #configForm select').forEach(input => {
      input.addEventListener('input', updatePreview);
      input.addEventListener('change', updatePreview);
    });

    // Color inputs 2-way binding
    document.getElementById('panelColor').addEventListener('input', e => {
      document.getElementById('panelColorHex').value = e.target.value.toUpperCase();
      updatePreview();
    });
    document.getElementById('panelColorHex').addEventListener('input', e => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        document.getElementById('panelColor').value = e.target.value;
        updatePreview();
      }
    });

    document.getElementById('openedColor').addEventListener('input', e => {
      document.getElementById('openedColorHex').value = e.target.value.toUpperCase();
      updatePreview();
    });
    document.getElementById('openedColorHex').addEventListener('input', e => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        document.getElementById('openedColor').value = e.target.value;
        updatePreview();
      }
    });

    document.getElementById('closedColor').addEventListener('input', e => {
      document.getElementById('closedColorHex').value = e.target.value.toUpperCase();
      updatePreview();
    });
    document.getElementById('closedColorHex').addEventListener('input', e => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        document.getElementById('closedColor').value = e.target.value;
        updatePreview();
      }
    });

    // Mode Toggle
    document.getElementById('ticketMode').addEventListener('change', e => {
      const isChannel = e.target.value === 'channel';
      document.getElementById('channelModeSettings').style.display = isChannel ? 'block' : 'none';
      document.getElementById('threadModeSettings').style.display = isChannel ? 'none' : 'block';
    });

    // Supported Discord Locales
    const DISCORD_LOCALES = [
      { code: 'tr', label: 'Turkish (Türkçe)' },
      { code: 'en-US', label: 'English (US)' },
      { code: 'en-GB', label: 'English (UK)' },
      { code: 'de', label: 'German (Deutsch)' },
      { code: 'fr', label: 'French (Français)' },
      { code: 'es-ES', label: 'Spanish (Español)' },
      { code: 'pt-BR', label: 'Portuguese (Português - Brasil)' },
      { code: 'ru', label: 'Russian (Русский)' },
      { code: 'it', label: 'Italian (Italiano)' },
      { code: 'ja', label: 'Japanese (日本語)' },
      { code: 'ko', label: 'Korean (한국어)' },
      { code: 'zh-CN', label: 'Chinese (Simplified)' },
      { code: 'zh-TW', label: 'Chinese (Traditional)' },
      { code: 'nl', label: 'Dutch (Nederlands)' },
      { code: 'pl', label: 'Polish (Polski)' },
      { code: 'uk', label: 'Ukrainian (Українська)' },
    ];

    function sanitizeCommand(raw) {
      if (!raw) return '';
      return raw
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_\p{L}\p{N}]/gu, '')
        .slice(0, 32);
    }

    function parseAliases(raw) {
      if (!raw) return [];
      return raw
        .split(',')
        .map(s => sanitizeCommand(s))
        .filter(Boolean);
    }

    function renderAliasBadges(inputId, containerId) {
      const val = document.getElementById(inputId).value;
      const aliases = parseAliases(val);
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      aliases.forEach(a => {
        const badge = document.createElement('span');
        badge.className = 'alias-badge';
        badge.textContent = '/' + a;
        container.appendChild(badge);
      });
    }

    function createLocRow(container, locale = 'tr', nameVal = '', descVal = '') {
      const row = document.createElement('div');
      row.className = 'loc-row';

      const select = document.createElement('select');
      select.className = 'form-control loc-locale-select';
      DISCORD_LOCALES.forEach(l => {
        const opt = new Option(l.label, l.code);
        if (l.code === locale) opt.selected = true;
        select.add(opt);
      });

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'form-control loc-name-input';
      nameInput.placeholder = 'Localized Name (e.g. destek)';
      nameInput.value = nameVal;

      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.className = 'form-control loc-desc-input';
      descInput.placeholder = 'Localized Description';
      descInput.value = descVal;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon-danger';
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Remove localization';
      delBtn.addEventListener('click', () => row.remove());

      row.appendChild(select);
      row.appendChild(nameInput);
      row.appendChild(descInput);
      row.appendChild(delBtn);

      container.appendChild(row);
    }

    function collectLocalizations(containerId, field) {
      const container = document.getElementById(containerId);
      const res = {};
      if (!container) return res;
      container.querySelectorAll('.loc-row').forEach(row => {
        const locale = row.querySelector('.loc-locale-select').value;
        const nameVal = sanitizeCommand(row.querySelector('.loc-name-input').value);
        const descVal = row.querySelector('.loc-desc-input').value.trim();

        if (field === 'name' && nameVal) {
          res[locale] = nameVal;
        } else if (field === 'desc' && descVal) {
          res[locale] = descVal;
        }
      });
      return res;
    }

    document.getElementById('cmdTicketAliases').addEventListener('input', () => {
      renderAliasBadges('cmdTicketAliases', 'ticketAliasBadges');
    });
    document.getElementById('cmdAdminAliases').addEventListener('input', () => {
      renderAliasBadges('cmdAdminAliases', 'adminAliasBadges');
    });

    document.getElementById('addTicketLocBtn').addEventListener('click', () => {
      createLocRow(document.getElementById('ticketLocTable'));
    });
    document.getElementById('addAdminLocBtn').addEventListener('click', () => {
      createLocRow(document.getElementById('adminLocTable'));
    });

    // Toast
    function showToast(msg, isSuccess = true) {
      const toast = document.getElementById('toast');
      toast.className = 'toast show ' + (isSuccess ? 'success' : 'error');
      document.getElementById('toastIcon').textContent = isSuccess ? '✅' : '⚠️';
      document.getElementById('toastMsg').textContent = msg;
      setTimeout(() => {
        toast.className = 'toast';
      }, 4500);
    }

    // Timer Countdown
    function startTimer(seconds) {
      timeLeftSeconds = seconds;
      const timerEl = document.getElementById('sessionTimer');
      const timerText = document.getElementById('timerText');

      const interval = setInterval(() => {
        timeLeftSeconds--;
        if (timeLeftSeconds <= 0) {
          clearInterval(interval);
          timerText.textContent = 'Expired';
          timerEl.classList.add('warning');
          showToast('Session expired. Please run /ticket-admin customize again.', false);
          document.getElementById('saveBtn').disabled = true;
          return;
        }

        const mins = Math.floor(timeLeftSeconds / 60);
        const secs = timeLeftSeconds % 60;
        timerText.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

        if (timeLeftSeconds <= 60) {
          timerEl.classList.add('warning');
        }
      }, 1000);
    }

    // Populate Data into Form
    function populateForm(data) {
      const cfg = data.config;
      currentConfig = cfg;

      // Guild details
      if (data.guild) {
        document.getElementById('guildName').innerHTML = (data.guild.name || 'Discord Tickets') + ' <span class="badge">Admin</span>';
        if (data.guild.icon) {
          document.getElementById('guildIcon').innerHTML = '<img src="https://cdn.discordapp.com/icons/' + data.guild.id + '/' + data.guild.icon + '.png" alt="">';
        }
      }

      // Populate Categories & Channels dropdowns
      const ticketCat = document.getElementById('ticketCategory');
      const archiveCat = document.getElementById('archiveCategory');
      const threadChan = document.getElementById('threadChannel');

      (data.channels || []).forEach(ch => {
        if (ch.type === 4) { // Category
          const opt1 = new Option('📁 ' + ch.name, ch.id);
          const opt2 = new Option('📁 ' + ch.name, ch.id);
          ticketCat.add(opt1);
          archiveCat.add(opt2);
        } else if (ch.type === 0) { // Text Channel
          const opt = new Option('# ' + ch.name, ch.id);
          threadChan.add(opt);
        }
      });

      // Role Pills
      const roleContainer = document.getElementById('rolePills');
      roleContainer.innerHTML = '';
      selectedRoles = new Set(cfg.structural?.STAFF_ROLE_IDS || []);

      (data.roles || [])
        .filter(r => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .forEach(r => {
          const pill = document.createElement('div');
          const isSel = selectedRoles.has(r.id);
          pill.className = 'role-pill' + (isSel ? ' selected' : '');
          pill.dataset.roleId = r.id;
          
          const dotColor = r.color ? decimalToHex(r.color) : '#99aab5';
          pill.innerHTML = '<span class="dot" style="background-color: ' + dotColor + '"></span>' + r.name;

          pill.addEventListener('click', () => {
            if (selectedRoles.has(r.id)) {
              selectedRoles.delete(r.id);
              pill.classList.remove('selected');
            } else {
              selectedRoles.add(r.id);
              pill.classList.add('selected');
            }
          });

          roleContainer.appendChild(pill);
        });

      // Set General fields
      document.getElementById('ticketMode').value = cfg.TICKET_MODE || 'channel';
      document.getElementById('maxTickets').value = cfg.structural?.MAX_OPEN_TICKETS_PER_USER ?? 1;
      document.getElementById('ticketCategory').value = cfg.structural?.TICKET_CATEGORY_ID || '';
      document.getElementById('archiveCategory').value = cfg.structural?.ARCHIVE_CATEGORY_ID || '';
      document.getElementById('threadChannel').value = cfg.structural?.THREAD_CHANNEL_ID || '';

      const isChannel = (cfg.TICKET_MODE || 'channel') === 'channel';
      document.getElementById('channelModeSettings').style.display = isChannel ? 'block' : 'none';
      document.getElementById('threadModeSettings').style.display = isChannel ? 'none' : 'block';

      // Commands fields
      const ticketCmd = cfg.commands?.ticket || {};
      const adminCmd = cfg.commands?.ticketAdmin || {};

      document.getElementById('cmdTicketName').value = ticketCmd.name || 'ticket';
      document.getElementById('cmdTicketDesc').value = ticketCmd.description || 'Open a support ticket';
      document.getElementById('cmdTicketAliases').value = (ticketCmd.aliases || []).join(', ');
      renderAliasBadges('cmdTicketAliases', 'ticketAliasBadges');

      const ticketLocTable = document.getElementById('ticketLocTable');
      ticketLocTable.innerHTML = '';
      const ticketLocales = new Set([
        ...Object.keys(ticketCmd.nameLocalizations || {}),
        ...Object.keys(ticketCmd.descriptionLocalizations || {}),
      ]);
      ticketLocales.forEach(loc => {
        createLocRow(
          ticketLocTable,
          loc,
          ticketCmd.nameLocalizations?.[loc] || '',
          ticketCmd.descriptionLocalizations?.[loc] || '',
        );
      });

      document.getElementById('cmdAdminName').value = adminCmd.name || 'ticket-admin';
      document.getElementById('cmdAdminDesc').value = adminCmd.description || 'Manage support tickets and customize bot settings (Admin only)';
      document.getElementById('cmdAdminAliases').value = (adminCmd.aliases || []).join(', ');
      renderAliasBadges('cmdAdminAliases', 'adminAliasBadges');

      const adminLocTable = document.getElementById('adminLocTable');
      adminLocTable.innerHTML = '';
      const adminLocales = new Set([
        ...Object.keys(adminCmd.nameLocalizations || {}),
        ...Object.keys(adminCmd.descriptionLocalizations || {}),
      ]);
      adminLocales.forEach(loc => {
        createLocRow(
          adminLocTable,
          loc,
          adminCmd.nameLocalizations?.[loc] || '',
          adminCmd.descriptionLocalizations?.[loc] || '',
        );
      });

      // Panel fields
      document.getElementById('panelTitle').value = cfg.embeds?.ticketPanel?.title || '';
      document.getElementById('panelDesc').value = cfg.embeds?.ticketPanel?.description || '';
      setPanelColor(decimalToHex(cfg.embeds?.ticketPanel?.color));
      document.getElementById('panelBtnLabel').value = cfg.buttons?.createTicket?.label || '';
      document.getElementById('panelBtnEmoji').value = cfg.buttons?.createTicket?.emoji?.name || '';
      document.getElementById('panelBtnStyle').value = cfg.buttons?.createTicket?.style || 1;

      // Welcome fields
      document.getElementById('openedTitle').value = cfg.embeds?.ticketOpened?.title || '';
      document.getElementById('openedTemplate').value = cfg.embeds?.ticketOpened?.descriptionTemplate || '';
      const openedHex = decimalToHex(cfg.embeds?.ticketOpened?.color);
      document.getElementById('openedColor').value = openedHex;
      document.getElementById('openedColorHex').value = openedHex.toUpperCase();
      document.getElementById('closeBtnLabel').value = cfg.buttons?.closeTicket?.label || '';
      document.getElementById('closeBtnEmoji').value = cfg.buttons?.closeTicket?.emoji?.name || '';

      // Closed fields
      document.getElementById('closedTitle').value = cfg.embeds?.ticketClosed?.title || '';
      document.getElementById('closedTemplate').value = cfg.embeds?.ticketClosed?.descriptionTemplate || '';
      const closedHex = decimalToHex(cfg.embeds?.ticketClosed?.color);
      document.getElementById('closedColor').value = closedHex;
      document.getElementById('closedColorHex').value = closedHex.toUpperCase();

      // Modal fields
      document.getElementById('modalTitle').value = cfg.modals?.createTicket?.title || '';
      document.getElementById('modalInputLabel').value = cfg.modals?.createTicket?.descriptionInput?.label || '';
      document.getElementById('modalPlaceholder').value = cfg.modals?.createTicket?.descriptionInput?.placeholder || '';
      document.getElementById('modalMinLength').value = cfg.modals?.createTicket?.descriptionInput?.minLength ?? 10;
      document.getElementById('modalMaxLength').value = cfg.modals?.createTicket?.descriptionInput?.maxLength ?? 1000;

      // Messages fields
      document.getElementById('msgCreated').value = cfg.messages?.ticketCreated || '';
      document.getElementById('msgAlreadyOpen').value = cfg.messages?.ticketAlreadyOpen || '';
      document.getElementById('msgClosed').value = cfg.messages?.ticketClosed || '';
      document.getElementById('msgCloseNotAllowed').value = cfg.messages?.closeNotAllowed || '';
      document.getElementById('msgMissingPerms').value = cfg.messages?.missingPermissions || '';

      // Naming fields
      document.getElementById('namingChannel').value = cfg.naming?.ticketChannel || 'ticket-{username}';

      updatePreview();
    }

    // Fetch initial config
    async function loadData() {
      try {
        const res = await fetch('/api/session-data?token=' + encodeURIComponent(TOKEN));
        if (!res.ok) {
          const err = await res.json();
          document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;text-align:center;padding:20px;"><div><h1 style="font-size:32px;margin-bottom:12px;">⚠️ Session Expired or Invalid</h1><p style="color:#949ba4;margin-bottom:20px;">' + (err.error || 'This link has expired.') + '</p><p>Run <code>/ticket-admin customize</code> in Discord to generate a new 10-minute link.</p></div></div>';
          return;
        }

        const data = await res.json();
        populateForm(data);
        startTimer(data.expiresInSeconds || 600);
        document.getElementById('loading').style.display = 'none';
      } catch (error) {
        console.error('Failed to load session data:', error);
        showToast('Network error while loading data', false);
      }
    }

    // Save Changes
    document.getElementById('saveBtn').addEventListener('click', async () => {
      const saveBtn = document.getElementById('saveBtn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Saving…';

      const payload = {
        TICKET_MODE: document.getElementById('ticketMode').value,
        structural: {
          TICKET_CATEGORY_ID: document.getElementById('ticketCategory').value,
          ARCHIVE_CATEGORY_ID: document.getElementById('archiveCategory').value,
          THREAD_CHANNEL_ID: document.getElementById('threadChannel').value,
          STAFF_ROLE_IDS: Array.from(selectedRoles),
          MAX_OPEN_TICKETS_PER_USER: parseInt(document.getElementById('maxTickets').value, 10) || 1,
        },
        commands: {
          ticket: {
            name: sanitizeCommand(document.getElementById('cmdTicketName').value || 'ticket'),
            description: document.getElementById('cmdTicketDesc').value || 'Open a support ticket',
            aliases: parseAliases(document.getElementById('cmdTicketAliases').value),
            nameLocalizations: collectLocalizations('ticketLocTable', 'name'),
            descriptionLocalizations: collectLocalizations('ticketLocTable', 'desc'),
          },
          ticketAdmin: {
            name: sanitizeCommand(document.getElementById('cmdAdminName').value || 'ticket-admin'),
            description: document.getElementById('cmdAdminDesc').value || 'Manage support tickets and customize bot settings (Admin only)',
            aliases: parseAliases(document.getElementById('cmdAdminAliases').value),
            nameLocalizations: collectLocalizations('adminLocTable', 'name'),
            descriptionLocalizations: collectLocalizations('adminLocTable', 'desc'),
          },
        },
        embeds: {
          ticketPanel: {
            title: document.getElementById('panelTitle').value,
            description: document.getElementById('panelDesc').value,
            color: hexToDecimal(document.getElementById('panelColor').value),
          },
          ticketOpened: {
            title: document.getElementById('openedTitle').value,
            descriptionTemplate: document.getElementById('openedTemplate').value,
            color: hexToDecimal(document.getElementById('openedColor').value),
          },
          ticketClosed: {
            title: document.getElementById('closedTitle').value,
            descriptionTemplate: document.getElementById('closedTemplate').value,
            color: hexToDecimal(document.getElementById('closedColor').value),
          },
        },
        buttons: {
          createTicket: {
            label: document.getElementById('panelBtnLabel').value,
            style: parseInt(document.getElementById('panelBtnStyle').value, 10),
            emoji: { name: document.getElementById('panelBtnEmoji').value },
          },
          closeTicket: {
            label: document.getElementById('closeBtnLabel').value,
            style: 4,
            emoji: { name: document.getElementById('closeBtnEmoji').value },
          },
        },
        modals: {
          createTicket: {
            title: document.getElementById('modalTitle').value,
            descriptionInput: {
              label: document.getElementById('modalInputLabel').value,
              placeholder: document.getElementById('modalPlaceholder').value,
              style: 2,
              minLength: parseInt(document.getElementById('modalMinLength').value, 10) || 10,
              maxLength: parseInt(document.getElementById('modalMaxLength').value, 10) || 1000,
              required: true,
            },
          },
        },
        messages: {
          ticketCreated: document.getElementById('msgCreated').value,
          ticketAlreadyOpen: document.getElementById('msgAlreadyOpen').value,
          ticketClosed: document.getElementById('msgClosed').value,
          closeNotAllowed: document.getElementById('msgCloseNotAllowed').value,
          missingPermissions: document.getElementById('msgMissingPerms').value,
        },
        naming: {
          ticketChannel: document.getElementById('namingChannel').value,
          ticketThread: document.getElementById('namingChannel').value,
        },
      };

      try {
        const res = await fetch('/api/config?token=' + encodeURIComponent(TOKEN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          showToast(err.error || 'Failed to save changes', false);
        } else {
          const result = await res.json();
          if (result.commandsSynced) {
            showToast('Saved & slash commands synced with Discord!');
          } else if (result.syncError) {
            showToast('Saved (Discord sync warning: ' + result.syncError + ')', false);
          } else {
            showToast('Configuration saved successfully for this server!');
          }
        }
      } catch (error) {
        showToast('Network error while saving', false);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾</span> Save Changes';
      }
    });

    // Manual Discord Slash Command Sync Button
    document.getElementById('syncCommandsBtn').addEventListener('click', async () => {
      const syncBtn = document.getElementById('syncCommandsBtn');
      const statusMsg = document.getElementById('syncStatusMsg');
      syncBtn.disabled = true;
      syncBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Syncing with Discord…';
      statusMsg.textContent = '';

      try {
        const res = await fetch('/api/sync-commands?token=' + encodeURIComponent(TOKEN), {
          method: 'POST',
        });
        const data = await res.json();
        if (res.ok) {
          statusMsg.style.color = 'var(--green)';
          statusMsg.textContent = '✅ Synced ' + data.count + ' slash command(s) with Discord!';
          showToast('Successfully synced ' + data.count + ' slash command(s) with Discord!');
        } else {
          statusMsg.style.color = 'var(--red)';
          statusMsg.textContent = '❌ ' + (data.error || 'Failed to sync');
          showToast(data.error || 'Sync failed', false);
        }
      } catch (err) {
        statusMsg.style.color = 'var(--red)';
        statusMsg.textContent = '❌ Network error';
        showToast('Network error while syncing', false);
      } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<span>⚡</span> Sync Slash Commands to Discord Now';
      }
    });

    // Keyboard shortcut Ctrl+S
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('saveBtn').click();
      }
    });

    loadData();
  </script>
</body>
</html>`;
}

export function renderExpiredHtml(message = 'This link has expired or is invalid.'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Expired - Discord Tickets</title>
  <style>
    body {
      background-color: #111214;
      color: #f2f3f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background-color: #2b2d31;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 32px;
      max-width: 460px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 12px 0;
    }
    p {
      color: #949ba4;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }
    code {
      background-color: #1e1f22;
      padding: 3px 8px;
      border-radius: 4px;
      color: #5865f2;
      font-family: Consolas, Monaco, monospace;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⏱️</div>
    <h1>Session Expired</h1>
    <p>${message}</p>
    <p>To generate a fresh 10-minute link, run <code>/ticket-admin customize</code> inside your Discord server.</p>
  </div>
</body>
</html>`;
}
