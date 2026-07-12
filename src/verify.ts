import { verifyKey } from 'discord-interactions';

/** Normalize the Discord application public key from env/secret values. */
export function normalizePublicKey(publicKey: string | undefined): string {
  if (!publicKey) return '';

  let normalized = publicKey.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  if (normalized.startsWith('0x') || normalized.startsWith('0X')) {
    normalized = normalized.slice(2);
  }

  return normalized;
}

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

  const trimmedPublicKey = normalizePublicKey(publicKey);
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
