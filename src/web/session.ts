import { getKV, type Env } from '../env';
import type { ConfigSessionData } from '../types';

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getSecret(env: Env): string {
  return `${env.DISCORD_PUBLIC_KEY || ''}:${env.DISCORD_TOKEN || ''}`;
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/**
 * Creates a cryptographically signed, tamper-proof session token.
 * Valid globally across all Cloudflare edge servers with 0ms replication delay.
 */
export async function createSessionToken(
  session: ConfigSessionData,
  env: Env,
): Promise<string> {
  const enc = new TextEncoder();
  const payloadStr = JSON.stringify(session);
  const payloadB64 = bufferToBase64Url(enc.encode(payloadStr));

  const secret = getSecret(env);
  const key = await getSigningKey(secret);
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(payloadB64),
  );
  const sigB64 = bufferToBase64Url(sigBuffer);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifies a session token statelessly (HMAC-SHA256 signature and expiration).
 * Falls back to checking KV for legacy UUID tokens.
 */
export async function verifySessionToken(
  token: string | null | undefined,
  env: Env,
): Promise<ConfigSessionData | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  // 1. Try stateless HMAC verification if token contains a dot delimiter
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.');
    if (parts.length === 2) {
      const [payloadB64, sigB64] = parts;
      try {
        const secret = getSecret(env);
        const key = await getSigningKey(secret);
        const enc = new TextEncoder();
        const isValid = await crypto.subtle.verify(
          'HMAC',
          key,
          base64UrlToBuffer(sigB64),
          enc.encode(payloadB64),
        );

        if (isValid) {
          const payloadJson = new TextDecoder().decode(base64UrlToBuffer(payloadB64));
          const session = JSON.parse(payloadJson) as ConfigSessionData;

          // Verify required fields & 10-minute expiration
          if (
            session &&
            typeof session.guildId === 'string' &&
            typeof session.expiresAt === 'number'
          ) {
            const now = Date.now();
            if (now < session.expiresAt) {
              return session;
            }
          }
        }
      } catch (error) {
        console.warn('Stateless session token verification failed:', error);
      }
    }
  }

  // 2. Fallback to KV lookup for legacy UUID sessions or dual-stored sessions
  const kv = getKV(env);
  if (kv) {
    try {
      const rawSession = await kv.get(`session:${trimmed}`);
      if (rawSession) {
        const session = JSON.parse(rawSession) as ConfigSessionData;
        if (
          session &&
          typeof session.guildId === 'string' &&
          typeof session.expiresAt === 'number'
        ) {
          if (Date.now() < session.expiresAt) {
            return session;
          }
        }
      }
    } catch (kvError) {
      console.warn('KV fallback lookup failed:', kvError);
    }
  }

  return null;
}
