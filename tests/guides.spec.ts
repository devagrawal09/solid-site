import { test, expect } from './fixtures';

test('documentation navigation connects the hub, setup, and migration without a reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => Object.assign(window, { documentationNavigation: true }));
  await page.locator('nav').getByRole('link', { name: 'Documentation', exact: true }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByRole('heading', { name: 'Learn Solid 2', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /^API reference ↗/ })).toHaveAttribute(
    'href',
    'https://v2.solidjs.com/reference',
  );
  await expect(
    page.getByRole('link', { name: 'Solid 1 documentation', exact: true }),
  ).toHaveAttribute('href', 'https://docs.solidjs.com');
  await page.getByRole('link', { name: /^Start a Solid 2 project/ }).click();
  await expect(page).toHaveURL(/\/guides\/getting-started$/);
  await expect(page.locator('article')).toContainText('@solidjs/vite-plugin@3.0.0-next.51');
  await expect(page.locator('article')).toContainText('jsxImportSource');
  await page
    .getByRole('navigation', { name: 'Solid 2 guides' })
    .getByRole('link', { name: 'Move from Solid 1 to Solid 2', exact: true })
    .click();
  await expect(page).toHaveTitle('Move from Solid 1 to Solid 2 | SolidJS');
  await expect(page.locator('article')).toContainText('Treat an async read as a derived answer');
  await expect(page.locator('article')).not.toContainText('Create the project');
  expect(await page.evaluate(() => 'documentationNavigation' in window)).toBe(true);
  await page.goBack();
  await expect(page.locator('article')).toContainText('Create the project');
});

test('published guide topics retain their queries and lead to current learning material', async ({
  page,
}) => {
  const destinations = {
    reactivity: '/tutorial/signals',
    rendering: '/tutorial/jsx',
    server: '/docs#server-rendering',
    typescript: '/docs#typescript',
    testing: '/docs#testing',
    comparison: '/docs#mental-model',
    faq: '/docs#reference',
  };
  for (const [id, destination] of Object.entries(destinations)) {
    await page.goto(`/guides/${id}?locale=en&from=old-guide`);
    const [path, hash] = destination.split('#');
    await expect(page).toHaveURL(
      `${test.info().project.use.baseURL}${path}?locale=en&from=old-guide${hash ? `#${hash}` : ''}`,
    );
    if (hash) await expect(page.locator(`#${hash}`)).toBeInViewport();
  }
  await page.goto('/guides?locale=en');
  await expect(page).toHaveURL(/\/guides\/getting-started\?locale=en$/);
  await expect(page.locator('article')).toContainText('Render a small app');
  await page.goto('/docs/latest/api');
  await expect(page.getByRole('heading', { name: 'Learn Solid 2', exact: true })).toBeVisible();
  await page.goto('/guides/a-missing-guide');
  await expect(page).toHaveTitle('404 | SolidJS');
  await page.goto('/guides/toString');
  await expect(page).toHaveTitle('404 | SolidJS');
});

test('English guide content keeps its direction inside translated navigation', async ({ page }) => {
  await page.goto('/docs?locale=ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('note')).toContainText('currently available in English');
  await expect(page.locator('#main-content [lang="en"]')).toHaveAttribute('dir', 'ltr');
  await page.getByRole('link', { name: /^Move from Solid 1 to Solid 2/ }).click();
  await expect(page.getByRole('note')).toBeVisible();
  await expect(page.locator('#main-content article')).toContainText(
    'Write structured state through drafts',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('the learning hub and migration guide fit a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: 'Learn Solid 2', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /^Move from Solid 1 to Solid 2/ }).click();
  await expect(page.locator('article table').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('link', { name: 'Back to learning paths', exact: true }).click();
  await expect(page).toHaveURL(/\/docs$/);
});
