import type { HandlerContext } from '../env';
import { buildCreateTicketModalPayload } from '../discord/components';
import { modalResponse } from '../responses';

export async function handleCreateTicketButton(
  ctx: HandlerContext,
): Promise<Response> {
  return modalResponse(buildCreateTicketModalPayload(ctx.config));
}
