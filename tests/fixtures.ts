import { test as base, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

export const test = base.extend({
  page: async ({ page }, use) => {
    const failures: string[] = [];
    page.on('pageerror', (error) => failures.push(error.message));
    page.on('console', (message) => {
      if (/^\[[A-Z][A-Z_]+\]/.test(message.text())) failures.push(message.text());
    });
    const runtime = await readFile('.cache/test-runtime/solid-v2.js', 'utf8');
    await page.route('https://**/*', async (route) => {
      const url = route.request().url();
      const headers = { 'Access-Control-Allow-Origin': '*' };
      if (url.includes('/chobitsu')) {
        await route.fulfill({
          contentType: 'application/javascript',
          body: 'globalThis.chobitsu = { setOnMessage() {}, sendRawMessage() {}, domain() { return null; } };',
        });
      } else if (url === 'https://solid-site-test.invalid/runtime.js') {
        await route.fulfill({ contentType: 'application/javascript', headers, body: runtime });
      } else if (url.startsWith('https://esm.sh/') && url.includes('2.0.0-rc.')) {
        await route.fulfill({
          contentType: 'application/javascript',
          headers,
          body: "export * from 'https://solid-site-test.invalid/runtime.js';",
        });
      } else {
        await route.abort();
      }
    });
    await use(page);
    await expect(
      page.getByRole('alert').filter({ hasText: 'Unable to load this page' }),
    ).toHaveCount(0);
    expect(failures, 'Uncaught errors and Solid diagnostics').toEqual([]);
  },
});
export { expect };
