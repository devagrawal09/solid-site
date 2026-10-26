import { test, expect } from './fixtures';

test('the homepage leads into Solid 2 without obsolete version claims or video links', async ({
  page,
}) => {
  await page.goto('/');
  const header = page.locator('#header');
  await expect(header).toContainText('2.0.0-rc.18');
  await expect(header.getByRole('link', { name: 'Learn Solid 2', exact: true })).toHaveAttribute(
    'href',
    '/tutorial/welcome',
  );
  await expect(
    header.getByRole('link', { name: 'Coming from Solid 1?', exact: true }),
  ).toHaveAttribute('href', '/guides/migrating-from-solid-1');
  await expect(
    page.locator('a[href*="youtube.com"], a[href*="bundlephobia.com"], a[href*="version=1."]'),
  ).toHaveCount(0);
  await expect(page.locator('#main-content')).not.toContainText('Solid 1.8.15');
  await expect(page.locator('#main-content')).not.toContainText('7kb');
  await expect(
    page.getByRole('link', { name: 'Open the Solid 2 reference ↗', exact: true }),
  ).toHaveAttribute('href', 'https://v2.solidjs.com/reference');
  await header.getByRole('link', { name: 'Coming from Solid 1?', exact: true }).click();
  await expect(page).toHaveTitle('Move from Solid 1 to Solid 2 | SolidJS');
});

test('the playground link reaches the Solid 2 editor from the homepage and another page', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('nav').getByRole('link', { name: 'Playground', exact: true }).click();
  await expect(page).toHaveURL(/\/#playground$/);
  await expect(page.locator('#playground')).toBeInViewport();
  await expect(page.getByRole('tab', { name: 'main.tsx' })).toBeVisible();
  await page.locator('nav').getByRole('link', { name: 'Documentation', exact: true }).click();
  await expect(page).toHaveURL(/\/docs$/);
  await page.locator('nav').getByRole('link', { name: 'Playground', exact: true }).click();
  await expect(page).toHaveURL(/\/#playground$/);
  await expect(page.locator('#playground')).toBeInViewport();
  await expect(page.getByRole('tab', { name: 'main.tsx' })).toBeVisible();
});

test('homepage translations use the current English copy and version-safe navigation', async ({
  page,
}) => {
  await page.goto('/?locale=ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('note')).toContainText('homepage is currently available in English');
  await expect(page.locator('#main-content [lang="en"]')).toHaveAttribute('dir', 'ltr');
  await expect(
    page.getByRole('heading', { name: 'An answer can take time.', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('nav a[href="https://v2.solidjs.com/getting-started/project-shapes"]'),
  ).toBeVisible();
  await expect(page.locator('nav a[href="/#playground"]')).not.toHaveAttribute('target', '_blank');
  await expect(
    page.locator('a[href^="https://start.solidjs.com"], a[href^="https://playground.solidjs.com"]'),
  ).toHaveCount(0);
});

test('the homepage fits a phone viewport in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#header h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page
    .getByRole('button', { name: 'Dark mode', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.locator('#playground').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-home-playground] .cm-content').first()).toBeVisible();
  await page.getByTitle('Show open tabs', { exact: true }).click();
  await page.getByRole('button', { name: 'Open Preview', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Solid REPL"]');
  await preview.getByRole('button', { name: 'Count: 0', exact: true }).click();
  await expect(preview.locator('#app')).toContainText('Doubled: 2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
