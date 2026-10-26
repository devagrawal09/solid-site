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
  await expect(page.getByText(/Sources and derivations$/)).toBeVisible();
  await expect(page.getByText(/Async mutations$/)).toBeAttached();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Next step' }).click();
  await expect(page).toHaveURL(/\/tutorial\/async-errors$/);
  await page.goto('/tutorial/bindings_spreads?solved');
  await expect(page).toHaveURL(/\/tutorial\/forwarding-props\?solved$/);
  await expect(page.locator('.prose h1')).toHaveText('Forwarding props');
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

test('form ref factories validate async fields and password confirmation', async ({ page }) => {
  await page.goto('/examples/forms');
  const preview = page.frameLocator('iframe[title="Solid REPL"]');
  await expect(page.getByRole('tab', { name: 'main.jsx', exact: true })).toBeVisible();
  await page.locator('[data-repl]').getByRole('tab', { name: 'Preview', exact: true }).click();
  await preview.getByPlaceholder('Email', { exact: true }).fill('johnsmith@outlook.com');
  await preview.getByPlaceholder('Email', { exact: true }).press('Tab');
  await expect(preview.locator('.error-message').first()).toContainText('already being used');
  await preview.getByPlaceholder('Email', { exact: true }).fill('new@example.com');
  await preview.getByPlaceholder('Password', { exact: true }).fill('strong-password');
  await preview.getByPlaceholder('Confirm Password', { exact: true }).fill('different-password');
  await preview.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(preview.locator('.error-message').last()).toHaveText('Passwords must match');
  await preview.getByPlaceholder('Confirm Password', { exact: true }).fill('strong-password');
  await preview.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('Form valid — ready to submit');
});

test('an async memo recovers after an invalid input and explicit retry', async ({ page }) => {
  const preview = await lesson(page, 'async-memos');
  await expect(preview.locator('pre')).toContainText('Explorer 1');
  await preview.getByRole('textbox', { name: 'User ID' }).fill('404');
  await expect(preview.getByRole('button', { name: /User not found/ })).toBeVisible();
  await preview.getByRole('textbox', { name: 'User ID' }).fill('2');
  await preview.getByRole('button', { name: /User not found/ }).click();
  await expect(preview.locator('pre')).toContainText('Explorer 2');
});

for (const id of ['lists', 'positional-lists']) {
  test(`${id} demonstrates which row retains DOM state after reordering`, async ({ page }) => {
    const preview = await lesson(page, id);
    await preview
      .getByRole('textbox', { name: 'Note for Keyboard Cat', exact: true })
      .fill('A persistent note');
    await preview.getByRole('button', { name: 'Rotate cats', exact: true }).click();
    const retained = id === 'lists' ? 'Keyboard Cat' : 'Maru';
    await expect(
      preview.getByRole('textbox', { name: `Note for ${retained}`, exact: true }),
    ).toHaveValue('A persistent note');
  });
}

test('a ref directive follows its conditional modal owner', async ({ page }) => {
  const preview = await lesson(page, 'directives');
  for (let attempt = 0; attempt < 2; attempt++) {
    await preview.getByRole('button', { name: 'Open Modal', exact: true }).click();
    await expect(preview.getByText('Some Modal', { exact: true })).toBeVisible();
    await preview.getByText('Some Modal', { exact: true }).click();
    await expect(preview.getByText('Some Modal', { exact: true })).toBeVisible();
    await preview.locator('body').click({ position: { x: 2, y: 2 } });
    await expect(preview.getByText('Some Modal', { exact: true })).toHaveCount(0);
  }
});
