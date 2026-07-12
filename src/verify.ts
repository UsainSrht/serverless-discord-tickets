import { verifyKey } from 'discord-interactions';

/**
 * Verify the Ed25519 signature on incoming Discord interaction requests.
 * Returns the raw body text when valid so it can be parsed once.
 */
export async function verifyDiscordRequest(
  request: Request,
  publicKey: string,
): Promise<{ valid: true; body: string } | { valid: false; response: Response }> {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return {
      valid: false,
      response: new Response('Missing signature headers', { status: 401 }),
    };
  }

  const trimmedPublicKey = publicKey?.trim();
  if (!trimmedPublicKey) {
    return {
      valid: false,
      response: new Response(
        'DISCORD_PUBLIC_KEY is not configured in Cloudflare Secrets',
        { status: 500 },
      ),
    };
  }

  const body = await request.text();

  const isValid = await verifyKey(body, signature, timestamp, trimmedPublicKey);
  if (!isValid) {
    return {
      valid: false,
      response: new Response('Invalid request signature', { status: 401 }),
    };
  }

  return { valid: true, body };
}
