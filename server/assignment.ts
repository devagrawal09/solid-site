import { experimentId, isVariant, variantIds, type Variant } from '../src/experiments/config';
import type { Env } from './types';

export const assignmentCookie = '__Host-solid-experiment';
export const optOutCookie = '__Host-solid-no-experiments';
const maxAge = 90 * 24 * 60 * 60;
export type Visitor = { id: string; variant: Variant; assignedAt: number };
export function cookie(request: Request, name: string): string | undefined {
  return request.headers
    .get('Cookie')
    ?.split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
export function privateResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Sec-GPC, DNT' },
  });
}
export function isAdmin(request: Request, env: Env): boolean {
  const email = request.headers.get('oai-authenticated-user-email');
  return Boolean(email && env.EXPERIMENT_ADMIN_EMAIL && email === env.EXPERIMENT_ADMIN_EMAIL);
}
export function trackingDisabled(request: Request): boolean {
  return (
    cookie(request, optOutCookie) === '1' ||
    request.headers.get('Sec-GPC') === '1' ||
    request.headers.get('DNT') === '1' ||
    /bot|crawler|spider|headless|preview|facebookexternalhit|slurp/i.test(
      request.headers.get('User-Agent') ?? '',
    )
  );
}
async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}
function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function encodeVisitor(visitor: Visitor, secret: string): Promise<string> {
  const payload = `${experimentId}.${visitor.id}.${visitor.variant}.${visitor.assignedAt}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await signingKey(secret),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${hex(signature)}`;
}
export async function readVisitor(request: Request, env: Env): Promise<Visitor | null> {
  const value = cookie(request, assignmentCookie);
  if (!value || !env.EXPERIMENT_SIGNING_KEY) return null;
  const [experiment, id, variant, timestamp, signature, extra] = value.split('.');
  const assignedAt = Number(timestamp);
  if (
    extra !== undefined ||
    experiment !== experimentId ||
    !/^[a-f0-9-]{36}$/.test(id ?? '') ||
    !isVariant(variant) ||
    !/^[a-f0-9]{64}$/.test(signature ?? '') ||
    !Number.isInteger(assignedAt) ||
    assignedAt > Date.now() ||
    Date.now() - assignedAt > maxAge * 1000
  )
    return null;
  const bytes = Uint8Array.from(signature.match(/../g)!, (pair) => parseInt(pair, 16));
  const payload = `${experiment}.${id}.${variant}.${timestamp}`;
  const valid = await crypto.subtle.verify(
    'HMAC',
    await signingKey(env.EXPERIMENT_SIGNING_KEY),
    bytes,
    new TextEncoder().encode(payload),
  );
  return valid ? { id, variant, assignedAt } : null;
}
export function newVisitor(): Visitor {
  // Rejection sampling avoids modulo bias and assigns equal probability to each arm.
  const limit = 256 - (256 % variantIds.length);
  let byte: number;
  do {
    byte = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (byte >= limit);
  return {
    id: crypto.randomUUID(),
    variant: variantIds[byte % variantIds.length],
    assignedAt: Date.now(),
  };
}
export function serializeCookie(name: string, value: string, age = maxAge): string {
  return `${name}=${value}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;
}
