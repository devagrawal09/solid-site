import { test, expect } from './fixtures';

async function lesson(page: import('@playwright/test').Page, id: string) {
  await page.goto(`/tutorial/${id}?solved`);
  const preview = page.frameLocator('iframe[title="Solid REPL"]');
  await expect(page.getByRole('tab', { name: 'main.jsx', exact: true })).toBeVisible();
  await page.locator('[data-repl]').getByRole('tab', { name: 'Preview', exact: true }).click();
  return preview;
}

test('old tutorial links preserve solved state and use the redesigned directory', async ({
  page,
}) => {
  await page.goto('/tutorial/async_suspense?solved');
  await expect(page).toHaveURL(/\/tutorial\/loading\?solved$/);
  await expect(page.locator('.prose h1')).toHaveText('Initial readiness');
  await page.getByRole('button', { name: 'Initial readiness', exact: true }).click();
  await expect(page.getByText('Sources and derivations', { exact: true })).toBeVisible();
  await expect(page.getByText('Async mutations', { exact: true })).toBeAttached();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Next step' }).click();
  await expect(page).toHaveURL(/\/tutorial\/async-errors$/);
});

test('tutorial locales use the updated English curriculum with a visible notice', async ({
  page,
}) => {
  await page.goto('/tutorial/signals?locale=ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('note')).toContainText('available in English');
  await expect(page.locator('.prose h1')).toHaveText('Signals');
});

test('writable derived state resets on source changes and accepts user edits', async ({ page }) => {
  const preview = await lesson(page, 'writable-state');
  const draft = preview.getByRole('textbox', { name: 'Draft name' });
  await expect(draft).toHaveValue('Ada Lovelace');
  await draft.fill('Custom draft');
  await expect(preview.getByText('Draft: Custom draft', { exact: true })).toBeVisible();
  await preview.getByRole('combobox', { name: 'Person' }).selectOption('grace');
  await expect(draft).toHaveValue('Grace Hopper');
});

test('pending updates retain settled content and settle on the latest selection', async ({
  page,
}) => {
  const preview = await lesson(page, 'pending');
  await expect(preview.getByText('This content is for page "Uno".', { exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Dos', exact: true }).click();
  await expect(preview.locator('[aria-busy="true"]')).toBeVisible();
  await expect(preview.getByText('This content is for page "Uno".', { exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Tres', exact: true }).click();
  await expect(
    preview.getByText('This content is for page "Tres".', { exact: true }),
  ).toBeVisible();
  await expect(preview.locator('[aria-busy="false"]')).toBeVisible();
});

test('an async error retries its owned reader successfully', async ({ page }) => {
  const preview = await lesson(page, 'async-errors');
  await expect(preview.getByRole('alert')).toContainText('temporarily unavailable');
  await preview.getByRole('button', { name: 'Retry report', exact: true }).click();
  await expect(preview.getByText('Report ready', { exact: true })).toBeVisible();
});

test('actions refresh authoritative data; optimistic writes commit or roll back', async ({
  page,
}) => {
  let preview = await lesson(page, 'actions');
  await expect(preview.getByText('Server count: 0', { exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Increment server', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('Server value changing...');
  await expect(preview.getByText('Server count: 1', { exact: true })).toBeVisible();
  preview = await lesson(page, 'optimistic-state');
  await expect(preview.getByText('Displayed count: 0', { exact: true })).toBeVisible();
  await preview.getByRole('button', { name: 'Increment optimistically', exact: true }).click();
  await expect(preview.getByText('Displayed count: 1', { exact: true })).toBeVisible();
  await expect(preview.getByRole('status')).toHaveText('Up to date');
  await preview.getByRole('checkbox', { name: 'Fail next save' }).check();
  await preview.getByRole('button', { name: 'Increment optimistically', exact: true }).click();
  await expect(preview.getByText('Displayed count: 2', { exact: true })).toBeVisible();
  await expect(preview.getByRole('alert')).toContainText('rolled back');
  await expect(preview.getByText('Displayed count: 1', { exact: true })).toBeVisible();
});

for (const id of ['todos', 'simpletodos', 'simpletodoshyperscript']) {
  test(`${id} supports adding, toggling, and editing a todo`, async ({ page }) => {
    await page.goto(`/examples/${id}`);
    const preview = page.frameLocator('iframe[title="Solid REPL"]');
    await expect(page.getByRole('tab', { name: 'main.jsx', exact: true })).toBeVisible();
    await page.locator('[data-repl]').getByRole('tab', { name: 'Preview', exact: true }).click();
    await preview.getByPlaceholder('enter todo and click +').fill('Learn Solid 2');
    await preview.getByRole('button', { name: '+', exact: true }).click();
    await expect(preview.getByRole('checkbox')).toBeVisible();
    await preview.getByRole('checkbox').check();
    await expect(preview.getByRole('checkbox')).toBeChecked();
    const title = preview
      .getByRole('textbox')
      .filter({ hasNot: preview.locator('[placeholder]') })
      .last();
    await title.fill('Understand derivations');
    await title.press('Tab');
    await expect(title).toHaveValue('Understand derivations');
    await preview.getByRole('button', { name: 'x', exact: true }).click();
    await expect(preview.getByRole('checkbox')).toHaveCount(0);
  });
}
