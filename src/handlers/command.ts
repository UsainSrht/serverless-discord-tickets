import type { HandlerContext } from '../env';
import { buildTicketPanelPayload } from '../discord/components';
import { publicMessageResponse } from '../responses';

export async function handleTicketCommand(
  ctx: HandlerContext,
): Promise<Response> {
  return publicMessageResponse(buildTicketPanelPayload(ctx.config));
}
