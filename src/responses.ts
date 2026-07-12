import {
  InteractionResponseType,
  type InteractionResponse,
} from './types';

export function jsonResponse(data: InteractionResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function pongResponse(): Response {
  return jsonResponse({ type: InteractionResponseType.Pong });
}

export function deferredResponse(ephemeral = true): Response {
  return jsonResponse({
    type: InteractionResponseType.DeferredChannelMessageWithSource,
    data: ephemeral ? { flags: 64 } : undefined,
  });
}

export function messageResponse(
  content: string,
  ephemeral = true,
): Response {
  return jsonResponse({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
      flags: ephemeral ? 64 : undefined,
    },
  });
}

export function modalResponse(data: Record<string, unknown>): Response {
  return jsonResponse({
    type: InteractionResponseType.Modal,
    data,
  });
}

import type { DiscordMessagePayload } from './types';

export function publicMessageResponse(payload: DiscordMessagePayload): Response {
  return jsonResponse({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: payload as Record<string, unknown>,
  });
}
