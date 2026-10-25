import { test, expect } from './fixtures';

test('native links navigate without reloading, redirect, and restore history', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Reactive UI, ready for async.', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.assign(window, { navigationMarker: true });
  });
  await page.locator('nav').getByRole('link', { name: 'Ecosystem', exact: true }).click();
  await expect(page).toHaveURL(/\/ecosystem$/);
  await expect(page.getByLabel('Official Filter')).toBeVisible();
  expect(await page.evaluate(() => 'navigationMarker' in window)).toBe(true);
  await page.locator('nav').getByRole('link', { name: 'Examples', exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/counter$/);
  await expect(
    page.locator('nav').getByRole('link', { name: 'Examples', exact: true }),
  ).toHaveAttribute('data-active', '');
  await page.goBack();
  await expect(page).toHaveURL(/\/ecosystem$/);
  await page.goto('/this-page-does-not-exist');
  await expect(page).toHaveTitle('404 | SolidJS');
});

test('theme and language persist; the language menu closes with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  const trigger = page.getByRole('button', { name: 'Select Language' }).filter({ visible: true });
  await trigger.click();
  await expect(page.getByRole('button', { name: 'English', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'English', exact: true })).not.toBeVisible();
  await trigger.click();
  await page.getByRole('button', { name: 'عربي', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('div[dir="rtl"]').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('ecosystem search encodes the query and preserves other parameters', async ({ page }) => {
  await page.goto('/ecosystem?locale=en');
  const search = page.getByPlaceholder('Search').filter({ visible: true });
  await search.fill('router');
  await expect(page).toHaveURL(/locale=en.*search=router/);
  await expect(page.locator('#main-content')).toContainText('solid-router');
  await page.getByLabel('Official Filter').check();
  await expect(page.getByLabel('Official Filter')).toBeChecked();
  await search.fill('a&b');
  await expect(page).toHaveURL(/search=a%26b/);
  await search.fill('');
  await expect(page).toHaveURL(/\/ecosystem\?locale=en$/);
});

test('resource filters update draft state and can be cleared', async ({ page }) => {
  await page.goto('/resources');
  const cards = page.getByRole('list', { name: 'Resources', exact: true }).getByRole('listitem');
  await expect(cards.first()).toBeVisible();
  const allCount = await cards.count();
  const article = page.getByRole('button', { name: /^Article\s+\d+$/ }).filter({ visible: true });
  const articleCount = Number((await article.innerText()).trim().match(/\d+$/)?.[0]);
  await article.click();
  await expect(cards).toHaveCount(articleCount);
  await article.click();
  await expect(cards).toHaveCount(allCount);
});

test('blog MDX renders native tags and embedded content', async ({ page }) => {
  await page.goto('/blog/state-of-solid-july-2022');
  await expect(
    page.getByRole('heading', { name: 'The State of Solid: July 2022', exact: true }),
  ).toBeVisible();
  await expect(page.locator('article h1').first()).toBeVisible();
  await expect(page.locator('article iframe[title="YouTube video"]').first()).toBeAttached();
  await expect(page.getByRole('link', { name: 'View post on X' }).first()).toBeAttached();
  await page.getByRole('link', { name: 'Back to the SolidJS Blog' }).click();
  await expect(page).toHaveURL(/\/blog$/);
});

test('tutorial content, solved files, and next lesson update together', async ({ page }) => {
  await page.goto('/tutorial/introduction_signals');
  await expect(page).toHaveURL(/\/tutorial\/signals$/);
  await expect(page.locator('.prose')).toContainText('signal');
  await expect(page.getByRole('tab', { name: 'main.jsx' })).toBeVisible();
  await page.getByRole('link', { name: 'Solve', exact: true }).click();
  await expect(page).toHaveURL(/\?solved$/);
  await expect(page.getByRole('link', { name: 'Reset', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Next step' }).click();
  await expect(page).toHaveURL(/\/tutorial\/derived-values$/);
  await expect(page.locator('.prose')).not.toBeEmpty();
});

test('Solid 2 playground runs, updates reactively, formats, and resets', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('heading', { name: 'Change the state. Follow the result.', exact: true })
    .scrollIntoViewIfNeeded();
  const repl = page.locator('[data-repl]');
  await expect(repl.getByRole('tab', { name: 'main.tsx' })).toBeVisible();
  const preview = page.frameLocator('iframe[title="Solid REPL"]');
  await expect(preview.locator('#app')).toContainText('Doubled: 0');
  await repl.getByRole('tab', { name: 'Preview', exact: true }).click();
  await preview.getByRole('button', { name: 'Count: 0', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Count: 1', exact: true })).toBeVisible();
  await expect(preview.locator('#app')).toContainText('Doubled: 2');
  await preview.getByRole('button', { name: 'Reset count', exact: true }).click();
  await expect(preview.locator('#app')).toContainText('Doubled: 0');
  const input = repl.locator('.cm-content').filter({ visible: true }).first();
  await input.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(
    'import {createSignal} from "solid-js"; import {render} from "@solidjs/web"; function App(){ const [n,setN]=createSignal(0); return <button onClick={()=>setN(n()+1)}>Count {n()}</button> } render(()=><App/>,document.getElementById("app"));',
  );
  await expect(preview.getByRole('button', { name: 'Count 0' })).toBeVisible();
  await repl.getByRole('tab', { name: 'Preview', exact: true }).click();
  await preview.getByRole('button', { name: 'Count 0' }).click();
  await expect(preview.getByRole('button', { name: 'Count 1' })).toBeVisible();
  await input.focus();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(input).toContainText('function App()');
  page.once('dialog', (dialog) => dialog.accept());
  await repl.getByRole('button', { name: 'Reset Editor', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Count: 0', exact: true })).toBeVisible();
  await expect(preview.locator('#app')).toContainText('Doubled: 0');
});

test('published examples follow rapid navigation and load the matching source', async ({
  page,
}) => {
  await page.goto('/examples/counter');
  const repl = page.locator('[data-repl="examples"]');
  await expect(repl.getByRole('tab', { name: 'main.jsx' })).toBeVisible();
  await expect(repl.locator('.cm-content').filter({ visible: true }).first()).toContainText(
    'CountingComponent',
  );
  await page.locator('#main-content a[href="/examples/simpletodos"]').click();
  await page
    .locator('#main-content')
    .getByRole('link', { name: 'Counter', exact: false })
    .first()
    .click();
  await expect(page).toHaveURL(/\/examples\/counter$/);
  await expect(repl.getByRole('tab', { name: 'main.jsx' })).toBeVisible();
  await expect(repl.locator('.cm-content').filter({ visible: true }).first()).toContainText(
    'CountingComponent',
  );
});
