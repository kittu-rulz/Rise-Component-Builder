import { expect, test } from '@playwright/test';

async function openAccordion(page) {
  await page.goto('/');
  await page.locator('.component-select-card').filter({ hasText: 'Responsive Accordion' }).click();
}

async function saveNamedProject(page, name) {
  await page.locator('#btn-save').click();
  await page.locator('#save-component-name').fill(name);
  await page.locator('#btn-confirm-save').click();
  await expect(page.locator('.toast')).toContainText('Saved');
}

test('project save, reload, open, draft restore, and delete persist locally', async ({ page }) => {
  await openAccordion(page);
  await page.locator('#input-block-headline').fill('Persisted headline');
  await saveNamedProject(page, 'Persistence E2E');
  await page.reload();
  await expect(page.locator('#editor-state')).toBeVisible();
  await expect(page.locator('#input-block-headline')).toHaveValue('Persisted headline');
  await page.locator('#btn-open').click();
  const card = page.locator('.saved-component-card').filter({ hasText: 'Persistence E2E' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Load' }).click();
  await page.locator('#btn-open').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('.saved-component-card').filter({ hasText: 'Persistence E2E' }).getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.saved-component-card').filter({ hasText: 'Persistence E2E' })).toHaveCount(0);
});

test('favorites persist after browser reload', async ({ page }) => {
  await openAccordion(page);
  await page.locator('#btn-favorite-toggle').click();
  await page.reload();
  await page.getByText('Favorites', { exact: true }).click();
  await expect(page.locator('.component-select-card').filter({ hasText: 'Responsive Accordion' })).toBeVisible();
});

test('selected default component theme persists independently from UI mode', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-theme-manager').click();
  const healthcare = page.locator('.theme-card').filter({ hasText: 'Healthcare' });
  await healthcare.getByRole('button', { name: 'Apply' }).click();
  await healthcare.getByRole('button', { name: 'Set Default' }).click();
  await page.reload();
  await page.locator('#btn-theme-manager').click();
  await expect(page.locator('.theme-card').filter({ hasText: 'Healthcare' })).toContainText('Default');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('export contains selected content and theme, excludes unsafe executable markup, and downloads runnable HTML', async ({ page, context }) => {
  const errors = [];
  await openAccordion(page);
  await page.locator('#input-block-headline').fill('Exported <script>globalThis.bad=true</script> content');
  await page.locator('#btn-theme-manager').click();
  await page.locator('.theme-card').filter({ hasText: 'Healthcare' }).getByRole('button', { name: 'Apply' }).click();
  await page.locator('#modal-theme-manager .modal-close-btn').click();
  await page.locator('#btn-export').click();
  const code = page.locator('#export-html-code');
  await expect(code).toContainText('Exported');
  await expect(code).toContainText('--primary: #086F83');
  const exported = await code.textContent();
  expect(exported).not.toContain('<script>globalThis.bad=true</script>');
  await page.getByRole('button', { name: 'Option B: HTML Block Fragment' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-download-html').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.html$/);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const html = Buffer.concat(chunks).toString('utf8');
  expect(html).toContain('Exported');
  expect(html).toContain('--primary: #086F83');
  const exportedPage = await context.newPage();
  exportedPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  exportedPage.on('pageerror', error => errors.push(error.message));
  await exportedPage.setContent(html);
  await expect(exportedPage.locator('.accordion-group')).toBeVisible();
  expect(errors).toEqual([]);
});

test('export copy button copies iframe code and shows visible confirmation', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await openAccordion(page);
  await page.locator('#btn-export').click();

  const riseInstructions = page.locator('.instructions-alert').filter({ hasText: 'How to use in Articulate Rise' });
  await expect(riseInstructions).toContainText('Code');
  await expect(riseInstructions).toContainText('Add code');
  const expectedCode = await page.locator('#export-iframe-code').textContent();
  const copyButton = page.locator('#btn-copy-iframe');
  await copyButton.click();

  await expect(copyButton).toHaveText('Copied!');
  await expect(copyButton).toHaveClass(/copy-success/);
  await expect(page.locator('.toast')).toContainText('Code copied to the clipboard.');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCode);
});
