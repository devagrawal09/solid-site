import { readFile, readdir } from 'node:fs/promises';
import { test, expect } from './fixtures';

interface SourceFile {
  name: string;
  type?: string;
  content: string | string[];
}
interface Job {
  label: string;
  run: boolean;
  files: SourceFile[];
}

test('every exercise compiles and every solution and example runs on Solid 2', async ({ page }) => {
  test.setTimeout(180_000);
  const jobs: Job[] = [];
  for (const name of (await readdir('src/content/tutorials')).filter(
    (name) => name.endsWith('.json') && !['directory.json', 'aliases.json'].includes(name),
  )) {
    const source = JSON.parse(await readFile(`src/content/tutorials/${name}`, 'utf8'));
    for (const variant of ['lesson', 'solved'])
      jobs.push({
        label: `${name.slice(0, -5)}/${variant}`,
        run: variant === 'solved',
        files: source[variant].files,
      });
  }
  for (const name of (await readdir('public/examples')).filter((name) => name.endsWith('.json'))) {
    const source = JSON.parse(await readFile(`public/examples/${name}`, 'utf8'));
    jobs.push({ label: `example/${name.slice(0, -5)}`, run: true, files: source.files });
  }
  expect(jobs).toHaveLength(99);
  await page.goto('/');
  const results = await page.evaluate(async (jobs) => {
    const { compiler } = await import('/src/components/setupRepl.ts' as string);
    const results: { label: string; compiled: Record<string, string> }[] = [];
    for (const [index, job] of jobs.entries()) {
      const id = `content-check-${index}`;
      const result = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error(`Compiler timed out: ${job.label}`)),
          30_000,
        );
        const listener = (event: MessageEvent) => {
          if (event.data.id !== id) return;
          compiler.removeEventListener('message', listener);
          clearTimeout(timeout);
          if (event.data.event === 'ERROR')
            reject(new Error(`${job.label}: ${JSON.stringify(event.data.error)}`));
          else resolve(event.data);
        };
        compiler.addEventListener('message', listener);
        compiler.postMessage({
          event: 'ROLLUP',
          id,
          version: '2.0.0-rc.18',
          tabs: job.files
            .filter((file) => file.name !== 'import_map')
            .map((file) => ({
              name: `${file.name}.${file.type || 'jsx'}`,
              source: Array.isArray(file.content) ? file.content.join('\n') : file.content,
            })),
        });
      });
      results.push({ label: job.label, compiled: result.compiled });
    }
    return results;
  }, jobs);
  expect(results).toHaveLength(jobs.length);
  await page.evaluate(() => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Curriculum check';
    iframe.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;z-index:1000;background:white';
    iframe.srcdoc = `<!doctype html><head><script type="importmap">${JSON.stringify({
      imports: {
        'solid-js': 'https://solid-site-test.invalid/runtime.js',
        'solid-js/internal': 'https://solid-site-test.invalid/runtime.js',
        '@solidjs/web': 'https://solid-site-test.invalid/runtime.js',
        '@solidjs/html': 'https://solid-site-test.invalid/html.js',
        '@solidjs/h': 'https://solid-site-test.invalid/h.js',
      },
    })}<\/script></head><body><div id="app"></div></body>`;
    document.body.append(iframe);
  });
  const frame = page.frameLocator('iframe[title="Curriculum check"]');
  const app = frame.locator('#app');
  const expected: Record<string, string> = {
    'async-memos': 'Explorer 1',
    loading: 'Hi, Jake',
    lazy: 'Hi, Jake',
    pending: 'This content is for page "Uno"',
    reveal: 'Ringo Starr',
    'async-errors': 'temporarily unavailable',
    actions: 'Server count: 0',
    'optimistic-state': 'Displayed count: 0',
    'example/asyncresource': 'Explorer 1',
    'example/suspensetabs': 'This content is for page "Uno"',
  };
  for (const job of jobs.filter((job) => job.run)) {
    await test.step(job.label, async () => {
      const compiled = results.find((result) => result.label === job.label)!.compiled;
      await app.evaluate(async (app, sources) => {
        const state = window as typeof window & { dispose?: () => void; urls?: string[] };
        state.dispose?.();
        state.dispose = undefined;
        state.urls?.forEach((url) => URL.revokeObjectURL(url));
        state.urls = [];
        document.querySelectorAll('style').forEach((element) => element.remove());
        app.replaceChildren();
        localStorage.clear();
        const cache = new Map<string, string>();
        function build(name: string): string {
          if (cache.has(name)) return cache.get(name)!;
          if (!sources[name]) throw new Error(`Missing example module ${name}`);
          const code = sources[name].replace(
            /(['"])solidrepl:([^'"]+)\1/g,
            (_match, quote, path) => quote + build(path) + quote,
          );
          const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
          state.urls!.push(url);
          cache.set(name, url);
          return url;
        }
        await import(/* @vite-ignore */ build('./main'));
      }, compiled);
      const id = job.label.replace('/solved', '');
      if (expected[id]) await expect(app).toContainText(expected[id]);
      else await expect(app.locator(':scope > *').first()).toBeAttached();
    });
  }
});
