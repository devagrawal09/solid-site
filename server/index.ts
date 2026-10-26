import {
  attributionDays,
  enrollmentDays,
  experimentId,
  goals,
  isGoal,
  isVariant,
  variantIds,
  type Assignment,
} from '../src/experiments/config';
import {
  assignmentCookie,
  cookie,
  encodeVisitor,
  isAdmin,
  newVisitor,
  optOutCookie,
  privateResponse,
  readVisitor,
  serializeCookie,
  trackingDisabled,
} from './assignment';
import type { Env } from './types';

const day = 86_400_000;
function sameOrigin(request: Request): boolean {
  return (
    request.headers.get('Origin') === new URL(request.url).origin &&
    request.headers.get('Sec-Fetch-Site') !== 'cross-site'
  );
}
async function assignment(
  request: Request,
  env: Env,
): Promise<{ value: Assignment; setCookie?: string }> {
  const override = new URL(request.url).searchParams.get('home_variant');
  if (isVariant(override))
    return { value: { experiment: experimentId, variant: override, mode: 'preview' } };
  if (!env.DB || !env.EXPERIMENT_SIGNING_KEY || trackingDisabled(request)) {
    return { value: { experiment: experimentId, variant: 'control', mode: 'disabled' } };
  }
  const previous = await readVisitor(request, env);
  if (!previous) {
    const started = await env.DB.prepare(
      'SELECT started_at AS started FROM experiment_runs WHERE experiment = ?',
    )
      .bind(experimentId)
      .first<{ started: number | null }>();
    if (started?.started && Date.now() >= started.started + enrollmentDays * day)
      return { value: { experiment: experimentId, variant: 'control', mode: 'disabled' } };
  }
  const visitor = previous ?? newVisitor();
  if (isAdmin(request, env))
    return { value: { experiment: experimentId, variant: visitor.variant, mode: 'preview' } };
  const exposure = previous
    ? await env.DB.prepare(
        'SELECT exposed_at FROM experiment_exposures WHERE experiment = ? AND visitor = ?',
      )
        .bind(experimentId, visitor.id)
        .first<{ exposed_at: number }>()
    : null;
  return {
    value: {
      experiment: experimentId,
      variant: visitor.variant,
      mode: 'live',
      eligible: Boolean(exposure && Date.now() - exposure.exposed_at <= attributionDays * day),
    },
    ...(previous
      ? {}
      : {
          setCookie: serializeCookie(
            assignmentCookie,
            await encodeVisitor(visitor, env.EXPERIMENT_SIGNING_KEY),
          ),
        }),
  };
}
async function collect(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return privateResponse({ error: 'Same-origin requests only.' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json'))
    return privateResponse({ error: 'Expected JSON.' }, 415);
  if (Number(request.headers.get('Content-Length') ?? 0) > 1024)
    return privateResponse({ error: 'Payload too large.' }, 413);
  const text = await request.text();
  if (text.length > 1024) return privateResponse({ error: 'Payload too large.' }, 413);
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return privateResponse({ error: 'Invalid JSON.' }, 400);
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('events' in payload) ||
    !Array.isArray(payload.events) ||
    payload.events.length > goals.length ||
    !payload.events.every(isGoal)
  ) {
    return privateResponse({ error: 'Unknown event.' }, 400);
  }
  if (!env.DB || trackingDisabled(request) || isAdmin(request, env))
    return privateResponse({ recorded: false });
  const visitor = await readVisitor(request, env);
  if (!visitor) return privateResponse({ recorded: false });
  const now = Date.now();
  const statements = [];
  if (payload.events.includes('exposure')) {
    statements.push(
      env.DB.prepare(
        'INSERT OR IGNORE INTO experiment_runs (experiment, started_at) VALUES (?, ?)',
      ).bind(experimentId, now),
    );
    statements.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO experiment_exposures (experiment, visitor, variant, exposed_at)
      SELECT ?, ?, ?, ? WHERE ? < (SELECT started_at + ? FROM experiment_runs WHERE experiment = ?)`,
      ).bind(
        experimentId,
        visitor.id,
        visitor.variant,
        now,
        now,
        enrollmentDays * day,
        experimentId,
      ),
    );
  }
  for (const event of new Set(payload.events.filter((value) => value !== 'exposure'))) {
    statements.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO experiment_events (experiment, visitor, event, happened_at)
      SELECT experiment, visitor, ?, ? FROM experiment_exposures
      WHERE experiment = ? AND visitor = ? AND variant = ? AND exposed_at >= ? AND exposed_at <= ?`,
      ).bind(
        event,
        now,
        experimentId,
        visitor.id,
        visitor.variant,
        now - attributionDays * day,
        now,
      ),
    );
  }
  if (statements.length) await env.DB.batch(statements);
  return privateResponse({ recorded: true });
}
async function report(request: Request, env: Env): Promise<Response> {
  if (!request.headers.get('oai-authenticated-user-email'))
    return privateResponse({ error: 'Sign in to view results.' }, 401);
  if (!isAdmin(request, env))
    return privateResponse({ error: 'Only the site owner can view results.' }, 403);
  if (!env.DB || !env.EXPERIMENT_SIGNING_KEY)
    return privateResponse({ error: 'Experiment storage is not configured.' }, 503);
  const now = Date.now();
  // Bounded retention; deletion happens when the owner reads the dashboard.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM experiment_events WHERE happened_at < ?').bind(now - 90 * day),
    env.DB.prepare('DELETE FROM experiment_exposures WHERE exposed_at < ?').bind(now - 90 * day),
  ]);
  const counts = goals
    .filter((goal) => goal !== 'exposure')
    .map((goal) => `COUNT(DISTINCT CASE WHEN e.event = '${goal}' THEN x.visitor END) AS ${goal}`)
    .join(', ');
  const rows = await env.DB.prepare(
    `SELECT x.variant, COUNT(DISTINCT x.visitor) AS visitors, ${counts},
    COUNT(DISTINCT CASE WHEN x.exposed_at <= ? THEN x.visitor END) AS matured_visitors,
    COUNT(DISTINCT CASE WHEN x.exposed_at <= ? AND e.event = 'learning_started' THEN x.visitor END) AS matured_conversions,
    MIN(x.exposed_at) AS first_exposure
    FROM experiment_exposures x LEFT JOIN experiment_events e ON e.experiment = x.experiment AND e.visitor = x.visitor
    WHERE x.experiment = ? GROUP BY x.variant`,
  )
    .bind(now - attributionDays * day, now - attributionDays * day, experimentId)
    .all<Record<string, number | string>>();
  const arms = variantIds.map((variant) => ({
    variant,
    visitors: 0,
    matured_visitors: 0,
    matured_conversions: 0,
    ...Object.fromEntries(goals.filter((goal) => goal !== 'exposure').map((goal) => [goal, 0])),
    ...rows.results.find((row) => row.variant === variant),
  }));
  const run = await env.DB.prepare('SELECT started_at FROM experiment_runs WHERE experiment = ?')
    .bind(experimentId)
    .first<{ started_at: number }>();
  return privateResponse({
    experiment: experimentId,
    attributionDays,
    generatedAt: now,
    startedAt: run?.started_at ?? null,
    arms,
  });
}
async function optOut(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return privateResponse({ error: 'Same-origin requests only.' }, 403);
  const visitor = await readVisitor(request, env);
  if (visitor && env.DB)
    await env.DB.batch([
      env.DB.prepare('DELETE FROM experiment_events WHERE experiment = ? AND visitor = ?').bind(
        experimentId,
        visitor.id,
      ),
      env.DB.prepare('DELETE FROM experiment_exposures WHERE experiment = ? AND visitor = ?').bind(
        experimentId,
        visitor.id,
      ),
    ]);
  const response = privateResponse({ optedOut: true });
  response.headers.append('Set-Cookie', serializeCookie(optOutCookie, '1', 365 * 24 * 60 * 60));
  response.headers.append('Set-Cookie', serializeCookie(assignmentCookie, '', 0));
  return response;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/experiments/')) {
      try {
        switch (`${request.method} ${url.pathname}`) {
          case 'GET /api/experiments/assignment': {
            const result = await assignment(request, env);
            const response = privateResponse(result.value);
            if (result.setCookie) response.headers.append('Set-Cookie', result.setCookie);
            return response;
          }
          case 'POST /api/experiments/events':
            return await collect(request, env);
          case 'GET /api/experiments/results':
            return await report(request, env);
          case 'POST /api/experiments/opt-out':
            return await optOut(request, env);
          default:
            return privateResponse({ error: 'Not found.' }, 404);
        }
      } catch (error) {
        console.error(
          'Experiment request failed',
          error instanceof Error ? error.message : 'Unknown error',
        );
        return privateResponse({ error: 'Experiment service unavailable. Please try again.' }, 503);
      }
    }
    if (!['GET', 'HEAD'].includes(request.method))
      return new Response('Method not allowed', { status: 405 });
    let asset = await env.ASSETS.fetch(request);
    // The host may not forward Wrangler's SPA asset routing configuration.
    if (
      asset.status === 404 &&
      request.headers.get('Accept')?.includes('text/html') &&
      !url.pathname.startsWith('/assets/') &&
      !url.pathname.startsWith('/api/')
    ) {
      asset = await env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }
    if (
      !asset.headers.get('Content-Type')?.includes('text/html') ||
      request.method === 'HEAD' ||
      asset.status !== 200
    )
      return asset;
    const result = await assignment(request, env).catch(() => {
      console.error('Experiment assignment unavailable; serving the default page.');
      return {
        value: { experiment: experimentId, variant: 'control', mode: 'disabled' } as Assignment,
        setCookie: undefined,
      };
    });
    const html = (await asset.text()).replace(
      '<head>',
      `<head><script>window.__HOME_EXPERIMENT__=${JSON.stringify(result.value)};</script>`,
    );
    const headers = new Headers(asset.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('Vary', 'Cookie, Sec-GPC, DNT');
    headers.delete('ETag');
    headers.delete('Content-Length');
    if (result.value.mode === 'preview' || url.pathname === '/experiments')
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    if (result.setCookie && !cookie(request, optOutCookie))
      headers.append('Set-Cookie', result.setCookie);
    return new Response(html, { status: asset.status, headers });
  },
};
