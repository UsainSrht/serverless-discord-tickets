/**
 * Default configuration shipped with the open-source repo.
 * Customize via Cloudflare env vars + BOT_CONFIG_OVERRIDES (never commit your overrides).
 */

export type TicketMode = 'channel' | 'thread';

export interface BotConfig {
  TICKET_MODE: TicketMode;

  structural: {
    TICKET_CATEGORY_ID: string;
    ARCHIVE_CATEGORY_ID: string;
    THREAD_CHANNEL_ID: string;
    STAFF_ROLE_IDS: string[];
  };

  commands: {
    ticket: {
      name: string;
      description: string;
    };
  };

  customIds: {
    createTicketButton: string;
    closeTicketButton: string;
    deleteTicketButton: string;
    createTicketModal: string;
    ticketDescriptionInput: string;
  };

  embeds: {
    ticketPanel: {
      title: string;
      description: string;
      color: number;
    };
    ticketOpened: {
      title: string;
      descriptionTemplate: string;
      color: number;
    };
    ticketClosed: {
      title: string;
      description: string;
      color: number;
    };
  };

  buttons: {
    createTicket: {
      label: string;
      style: 1 | 2 | 3 | 4;
      emoji?: { name: string; id?: string };
    };
    closeTicket: {
      label: string;
      style: 1 | 2 | 3 | 4;
      emoji?: { name: string; id?: string };
    };
    deleteTicket: {
      label: string;
      style: 1 | 2 | 3 | 4;
      emoji?: { name: string; id?: string };
    };
  };

  modals: {
    createTicket: {
      title: string;
      descriptionInput: {
        label: string;
        placeholder: string;
        style: 1 | 2;
        minLength: number;
        maxLength: number;
        required: boolean;
      };
    };
  };

  messages: {
    ticketCreated: string;
    ticketClosed: string;
    ticketDeleted: string;
    ticketAlreadyOpen: string;
    closeNotAllowed: string;
    deleteNotAllowed: string;
    missingPermissions: string;
    rateLimited: string;
    genericError: string;
    deferredWorking: string;
  };

  naming: {
    ticketChannel: string;
    ticketThread: string;
  };
}

/** Env bindings used to build runtime config (Worker vars + secrets). */
export interface ConfigEnv {
  TICKET_MODE?: string;
  TICKET_CATEGORY_ID?: string;
  ARCHIVE_CATEGORY_ID?: string;
  THREAD_CHANNEL_ID?: string;
  STAFF_ROLE_IDS?: string;
  BOT_CONFIG_OVERRIDES?: string;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const defaultConfig: BotConfig = {
  TICKET_MODE: 'channel',

  structural: {
    TICKET_CATEGORY_ID: '',
    ARCHIVE_CATEGORY_ID: '',
    THREAD_CHANNEL_ID: '',
    STAFF_ROLE_IDS: [],
  },

  commands: {
    ticket: {
      name: 'ticket',
      description: 'Post the ticket creation panel (admin only).',
    },
  },

  customIds: {
    createTicketButton: 'btn_create_ticket',
    closeTicketButton: 'btn_close_ticket',
    deleteTicketButton: 'btn_delete_ticket',
    createTicketModal: 'modal_create_ticket',
    ticketDescriptionInput: 'input_ticket_description',
  },

  embeds: {
    ticketPanel: {
      title: '🎫 Support Tickets',
      description:
        'Need help? Click the button below to open a private support ticket.\n\n' +
        'A staff member will assist you as soon as possible.',
      color: 0x5865f2,
    },
    ticketOpened: {
      title: '🎫 New Ticket',
      descriptionTemplate:
        '{user} opened a ticket.\n\n**Reason:**\n{description}\n\n' +
        'Staff: please assist when available.',
      color: 0x57f287,
    },
    ticketClosed: {
      title: '🔒 Ticket Closed',
      description:
        'This ticket has been closed and archived. Thank you for contacting support.',
      color: 0xed4245,
    },
  },

  buttons: {
    createTicket: {
      label: 'Create Ticket',
      style: 1,
      emoji: { name: '🎫' },
    },
    closeTicket: {
      label: 'Close Ticket',
      style: 4,
      emoji: { name: '🔒' },
    },
    deleteTicket: {
      label: 'Delete Ticket',
      style: 4,
      emoji: { name: '🗑️' },
    },
  },

  modals: {
    createTicket: {
      title: 'Open a Support Ticket',
      descriptionInput: {
        label: 'Describe your issue',
        placeholder: 'Briefly explain what you need help with…',
        style: 2,
        minLength: 10,
        maxLength: 1000,
        required: true,
      },
    },
  },

  messages: {
    ticketCreated: 'Your ticket has been created! Check the new channel.',
    ticketClosed: 'Ticket closed and archived successfully.',
    ticketDeleted: 'Ticket deleted from archive.',
    ticketAlreadyOpen:
      'You already have an open ticket. Please use your existing ticket channel.',
    closeNotAllowed: 'Only the ticket owner or staff can close this ticket.',
    deleteNotAllowed: 'Only staff can delete archived tickets.',
    missingPermissions:
      'I lack permission to create or modify channels. Please check my role hierarchy and permissions.',
    rateLimited: 'Discord is rate limiting requests. Please try again in a moment.',
    genericError: 'Something went wrong while processing your request.',
    deferredWorking: 'Working on your request…',
  },

  naming: {
    ticketChannel: 'ticket-{username}',
    ticketThread: 'ticket-{username}',
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends object>(base: T, override: DeepPartial<T>): T {
  const result = structuredClone(base);

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key];
    if (overrideValue === undefined) continue;

    const baseValue = result[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(
        baseValue,
        overrideValue as DeepPartial<typeof baseValue>,
      );
    } else {
      result[key] = overrideValue as T[keyof T];
    }
  }

  return result;
}

function applyStructuralEnvVars(config: BotConfig, env: ConfigEnv): BotConfig {
  const next = structuredClone(config);

  if (env.TICKET_MODE === 'channel' || env.TICKET_MODE === 'thread') {
    next.TICKET_MODE = env.TICKET_MODE;
  }
  if (env.TICKET_CATEGORY_ID) {
    next.structural.TICKET_CATEGORY_ID = env.TICKET_CATEGORY_ID;
  }
  if (env.ARCHIVE_CATEGORY_ID) {
    next.structural.ARCHIVE_CATEGORY_ID = env.ARCHIVE_CATEGORY_ID;
  }
  if (env.THREAD_CHANNEL_ID) {
    next.structural.THREAD_CHANNEL_ID = env.THREAD_CHANNEL_ID;
  }
  if (env.STAFF_ROLE_IDS) {
    next.structural.STAFF_ROLE_IDS = env.STAFF_ROLE_IDS.split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return next;
}

function applyJsonOverrides(config: BotConfig, rawJson: string): BotConfig {
  try {
    const overrides = JSON.parse(rawJson) as DeepPartial<BotConfig>;
    return deepMerge(config, overrides);
  } catch (error) {
    console.error('Invalid BOT_CONFIG_OVERRIDES JSON:', error);
    return config;
  }
}

/** Build effective config from defaults + Cloudflare env vars + JSON overrides. */
export function loadConfig(env: ConfigEnv): BotConfig {
  let config = structuredClone(defaultConfig);
  config = applyStructuralEnvVars(config, env);

  if (env.BOT_CONFIG_OVERRIDES?.trim()) {
    config = applyJsonOverrides(config, env.BOT_CONFIG_OVERRIDES);
  }

  return config;
}

/** Replace `{key}` placeholders in a template string. */
export function formatTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
}

/** Sanitize a Discord channel/thread name (lowercase, hyphens, max 100 chars). */
export function sanitizeChannelName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}
