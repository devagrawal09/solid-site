import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../server/index';
import { assignmentCookie, encodeVisitor, newVisitor, optOutCookie } from '../server/assignment';
import { experimentId, rateInterval } from '../src/experiments/config';
import { loadAssignment } from '../src/experiments/bootstrap';
import type { Database, Env, Statement } from '../server/types';

const origin = 'https://solid.test';
function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync('drizzle/0000_yummy_rick_jones.sql', 'utf8'));
  const prepare = (query: string, values: (string | number | null)[] = []): Statement => ({
    bind: (...bound) => prepare(query, bound),
    run: async () => sqlite.prepare(query).run(...values),
    all: async <T>() => ({ results: sqlite.prepare(query).all(...values) as T[] }),
    first: async <T>() => (sqlite.prepare(query).get(...values) as T) ?? null,
  });
  const DB: Database = {
    prepare,
    batch: async (statements) => {
      sqlite.exec('BEGIN');
      try {
        for (const statement of statements) await statement.run();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const env: Env = {
    DB,
    EXPERIMENT_SIGNING_KEY: 'local-test-key-only',
    EXPERIMENT_ADMIN_EMAIL: 'owner@example.test',
    ASSETS: {
      fetch: async (request) =>
        new URL(request.url).pathname.endsWith('.js')
          ? new Response('console.log(1)', {
              headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'public, max-age=3600',
              },
            })
          : new Response('<!doctype html><html><head></head><body>Solid</body></html>', {
              headers: { 'Content-Type': 'text/html' },
            }),
    },
  };
  const call = (path: string, options: RequestInit = {}) =>
    worker.fetch(new Request(origin + path, options), env);
  const ingest = (cookieValue: string, events: string[], headers = {}) =>
    call('/api/experiments/events', {
      method: 'POST',
      headers: {
        Origin: origin,
        Cookie: cookieValue,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ events }),
    });
  const visitorCookie = async (variant: 'control' | 'speed' | 'experience' = 'control') => {
    const visitor = { ...newVisitor(), variant };
    return {
      visitor,
      cookie: `${assignmentCookie}=${await encodeVisitor(visitor, env.EXPERIMENT_SIGNING_KEY!)}`,
    };
  };
  return { sqlite, env, call, ingest, visitorCookie };
}
function assignmentFrom(html: string) {
  return JSON.parse(html.match(/window\.__HOME_EXPERIMENT__=(\{[^;]+\});/)![1]);
}

test('document assignment is stable, signed, private, and initialized before app code', async () => {
  const { call } = setup();
  const first = await call('/');
  const cookie = first.headers.get('Set-Cookie')!.split(';')[0];
  assert.match(first.headers.get('Set-Cookie')!, /Secure; HttpOnly; SameSite=Lax/);
  assert.equal(first.headers.get('Cache-Control'), 'private, no-store');
  const assignment = assignmentFrom(await first.text());
  assert.equal(assignment.mode, 'live');
  const second = await call('/', { headers: { Cookie: cookie } });
  assert.deepEqual(assignmentFrom(await second.text()), assignment);
  assert.equal(second.headers.get('Set-Cookie'), null);
  const tampered = await call('/', {
    headers: { Cookie: cookie.slice(0, -1) + (cookie.endsWith('0') ? '1' : '0') },
  });
  assert.ok(tampered.headers.get('Set-Cookie'));
  const asset = await call('/assets/app.js');
  assert.equal(await asset.text(), 'console.log(1)');
  assert.equal(asset.headers.get('Cache-Control'), 'public, max-age=3600');
});

test('all preview variants render without an experiment cookie or database exposure', async () => {
  const { call, sqlite } = setup();
  for (const variant of ['control', 'speed', 'experience']) {
    const response = await call(`/?home_variant=${variant}`);
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.deepEqual(assignmentFrom(await response.text()), {
      experiment: experimentId,
      variant,
      mode: 'preview',
    });
  }
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_exposures').get()!.count,
    0,
  );
  const invalid = await call('/?home_variant=toString');
  assert.equal(assignmentFrom(await invalid.text()).mode, 'live');
});

test('exposures and outcomes count once per browser, including retries and navigation races', async () => {
  const { ingest, visitorCookie, sqlite } = setup();
  const { cookie } = await visitorCookie();
  await ingest(cookie, ['learning_started']);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_events').get()!.count, 0);
  for (let i = 0; i < 3; i++)
    assert.equal(
      (await ingest(cookie, ['exposure', 'hero_cta', 'learning_started', 'learning_started']))
        .status,
      200,
    );
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_exposures').get()!.count,
    1,
  );
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_events').get()!.count, 2);
  const second = await visitorCookie('speed');
  await ingest(second.cookie, ['exposure', 'docs_opened']);
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_exposures').get()!.count,
    2,
  );
});

test('an exposed browser remains eligible on a fresh tutorial document, while direct tutorial arrivals do not enter the cohort', async () => {
  const { call, ingest, visitorCookie } = setup();
  const { cookie } = await visitorCookie();
  const before = assignmentFrom(
    await (await call('/tutorial/signals', { headers: { Cookie: cookie } })).text(),
  );
  assert.equal(before.eligible, false);
  await ingest(cookie, ['exposure']);
  const after = assignmentFrom(
    await (await call('/tutorial/signals', { headers: { Cookie: cookie } })).text(),
  );
  assert.equal(after.eligible, true);
  assert.equal(after.variant, before.variant);
});

test('seven-day attribution is based on the first exposure and cannot be extended by refresh', async () => {
  const { ingest, visitorCookie, sqlite } = setup();
  const { cookie } = await visitorCookie();
  await ingest(cookie, ['exposure']);
  sqlite.prepare('UPDATE experiment_exposures SET exposed_at = ?').run(Date.now() - 8 * 86_400_000);
  await ingest(cookie, ['exposure', 'learning_started']);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_events').get()!.count, 0);
});

test('privacy signals, bots, owner visits, and missing configuration fail closed', async () => {
  const { call, ingest, visitorCookie, env, sqlite } = setup();
  const { cookie } = await visitorCookie();
  for (const headers of [
    new Headers({ DNT: '1' }),
    new Headers({ 'Sec-GPC': '1' }),
    new Headers({ 'User-Agent': 'Googlebot' }),
    new Headers({ Cookie: `${optOutCookie}=1` }),
  ]) {
    const response = await call('/', { headers });
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.equal(assignmentFrom(await response.text()).mode, 'disabled');
  }
  await ingest(cookie, ['exposure'], { DNT: '1' });
  await ingest(cookie, ['exposure'], { 'oai-authenticated-user-email': 'owner@example.test' });
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_exposures').get()!.count,
    0,
  );
  const owner = await call('/', {
    headers: { 'oai-authenticated-user-email': 'owner@example.test' },
  });
  assert.equal(assignmentFrom(await owner.text()).mode, 'preview');
  env.EXPERIMENT_SIGNING_KEY = undefined;
  assert.equal(assignmentFrom(await (await call('/')).text()).mode, 'disabled');
});

test('opt-out erases this browser records and sets a durable preference', async () => {
  const { call, ingest, visitorCookie, sqlite } = setup();
  const { cookie } = await visitorCookie();
  const other = await visitorCookie();
  await ingest(cookie, ['exposure', 'learning_started']);
  await ingest(other.cookie, ['exposure']);
  const response = await call('/api/experiments/opt-out', {
    method: 'POST',
    headers: { Origin: origin, Cookie: cookie },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Set-Cookie')!, new RegExp(`${optOutCookie}=1`));
  assert.match(response.headers.get('Set-Cookie')!, /Max-Age=0/);
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_exposures').get()!.count,
    1,
  );
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_events').get()!.count, 0);
});

test('invalid, oversized, cross-origin and unsigned submissions do not record outcomes', async () => {
  const { call, ingest, visitorCookie, sqlite } = setup();
  const { cookie } = await visitorCookie();
  assert.equal(
    (await ingest(cookie, ['exposure'], { Origin: 'https://elsewhere.test' })).status,
    403,
  );
  assert.equal((await ingest(cookie, ['not_an_event'])).status, 400);
  assert.equal(
    (
      await call('/api/experiments/events', {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: 'x'.repeat(1025),
      })
    ).status,
    413,
  );
  await ingest('', ['exposure']);
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_exposures').get()!.count,
    0,
  );
});

test('private report uses unique exposed browsers as denominator, retains non-converters, and separates mature cohorts', async () => {
  const { call, ingest, visitorCookie, sqlite } = setup();
  const one = await visitorCookie();
  const two = await visitorCookie();
  await ingest(one.cookie, ['exposure', 'hero_cta', 'tutorial_opened', 'learning_started']);
  await ingest(two.cookie, ['exposure', 'docs_opened']);
  sqlite
    .prepare('UPDATE experiment_exposures SET exposed_at = ? WHERE visitor = ?')
    .run(Date.now() - 8 * 86_400_000, one.visitor.id);
  assert.equal((await call('/api/experiments/results')).status, 401);
  assert.equal(
    (
      await call('/api/experiments/results', {
        headers: { 'oai-authenticated-user-email': 'other@example.test' },
      })
    ).status,
    403,
  );
  const report = (await (
    await call('/api/experiments/results', {
      headers: { 'oai-authenticated-user-email': 'owner@example.test' },
    })
  ).json()) as { arms: Record<string, string | number>[] };
  const control = report.arms.find((arm) => arm.variant === 'control')!;
  assert.equal(control.visitors, 2);
  assert.equal(control.learning_started, 1);
  assert.equal(control.matured_visitors, 1);
  assert.equal(control.matured_conversions, 1);
  assert.equal(report.arms.length, 3);
});

test('uncertainty is wide for small samples, not a false zero-error rate', () => {
  assert.deepEqual(rateInterval(0, 0), [0, 1]);
  assert.ok(rateInterval(0, 10)[1] > 0.27);
  assert.ok(rateInterval(10, 10)[0] < 0.73);
  const [lower, upper] = rateInterval(50, 100);
  assert.ok(lower > 0.4 && lower < 0.41);
  assert.ok(upper > 0.59 && upper < 0.6);
});

test('enrollment closes after fourteen days while the final outcomes remain attributable', async () => {
  const { call, ingest, visitorCookie, sqlite } = setup();
  const first = await visitorCookie();
  await ingest(first.cookie, ['exposure']);
  sqlite
    .prepare('UPDATE experiment_exposures SET exposed_at = ?')
    .run(Date.now() - 15 * 86_400_000);
  const late = await visitorCookie('speed');
  await ingest(late.cookie, ['exposure', 'learning_started']);
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_exposures').get()!.count,
    1,
  );
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_events').get()!.count, 0);
  assert.equal(assignmentFrom(await (await call('/')).text()).mode, 'disabled');
  // An enrolled visitor from the last day can still convert after enrollment closes.
  const enrolled = await visitorCookie('experience');
  sqlite
    .prepare('INSERT INTO experiment_exposures VALUES (?, ?, ?, ?)')
    .run(experimentId, enrolled.visitor.id, 'experience', Date.now() - 2 * 86_400_000);
  await ingest(enrolled.cookie, ['learning_started']);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM experiment_events').get()!.count, 1);
});

test('storage failures preserve the homepage and report ingestion failure honestly', async () => {
  const { env, call, ingest, visitorCookie } = setup();
  const { cookie } = await visitorCookie();
  env.DB = {
    prepare() {
      throw new Error('Storage unavailable');
    },
    batch: async () => {
      throw new Error('Storage unavailable');
    },
  };
  const home = await call('/');
  assert.equal(home.status, 200);
  assert.equal(assignmentFrom(await home.text()).mode, 'disabled');
  assert.equal((await ingest(cookie, ['exposure'])).status, 503);
});

test('assets-first hosts resolve a stable assignment before rendering and preserve preview exclusions', async () => {
  let requested = '';
  const fetcher: typeof fetch = async (request) => {
    requested = String(request);
    return Response.json({ experiment: experimentId, variant: 'speed', mode: 'preview' });
  };
  const value = await loadAssignment(undefined, '?home_variant=speed', fetcher);
  assert.equal(requested, '/api/experiments/assignment?home_variant=speed');
  assert.equal(value.variant, 'speed');
  assert.equal(value.mode, 'preview');
  let called = false;
  const injected = await loadAssignment(value, '', async () => {
    called = true;
    throw new Error('Should not fetch');
  });
  assert.deepEqual(injected, value);
  assert.equal(called, false);
});

test('bootstrap failures and malformed assignments render control without recording data', async () => {
  const failures: (typeof fetch)[] = [
    async () => {
      throw new Error('Timed out');
    },
    async () => new Response('Service unavailable', { status: 503 }),
    async () => Response.json({ experiment: experimentId, variant: 'toString', mode: 'live' }),
    async () => Response.json({ experiment: 'wrong', variant: 'speed', mode: 'live' }),
  ];
  for (const fetcher of failures)
    assert.deepEqual(await loadAssignment(undefined, '', fetcher), {
      experiment: experimentId,
      variant: 'control',
      mode: 'disabled',
    });
});
