import { expect, test } from '@playwright/test';

async function openComponent(page, name, category = 'Interactive') {
  await page.goto('/');
  if (category !== 'Interactive') await page.getByText(category, { exact: true }).click();
  await page.locator('.component-select-card').filter({ hasText: name }).click();
  await expect(page.locator('#editor-state')).toBeVisible();
}

test('application loads without console errors and renders the catalog', async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Rise Component Builder' })).toBeVisible();
  await expect(page.locator('.component-select-card')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('sidebar storage meter reports measured browser storage usage', async ({ page }) => {
  await page.goto('/');
  const label = page.locator('#storage-usage-label');
  const bar = page.locator('.storage-bar');
  await expect(label).not.toHaveText('Calculating…');
  await expect(label).toHaveText(/^(\d+% Used|Usage unavailable)$/);
  const valueNow = Number(await bar.getAttribute('aria-valuenow'));
  expect(valueNow).toBeGreaterThanOrEqual(0);
  expect(valueNow).toBeLessThanOrEqual(100);
});

test('category switching and search filter the catalog', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Knowledge Checks', { exact: true }).click();
  await expect(page.locator('.component-select-card')).toHaveCount(3);
  await expect(page.locator('.component-select-card').filter({ hasText: 'Multiple Choice' })).toBeVisible();
  await page.locator('.nav-item[data-category="interactive"]').click();
  await page.locator('#search-components').fill('accordion');
  await expect(page.locator('.component-select-card')).toHaveCount(1);
  await expect(page.locator('.component-select-card')).toContainText('Responsive Accordion');
});

test('catalog cards are native buttons reachable and activatable by keyboard', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.component-select-card').filter({ hasText: 'Responsive Accordion' });
  await expect(card).toHaveRole('button');
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#editor-state')).toBeVisible();
  await expect(page.locator('#active-component-title')).toHaveText('Responsive Accordion');
});

test('component selection opens the editor and back returns to the catalog', async ({ page }) => {
  await openComponent(page, 'Responsive Accordion');
  await expect(page.locator('#active-component-title')).toHaveText('Responsive Accordion');
  await page.locator('#btn-back-to-catalog').click();
  await expect(page.locator('#catalog-state')).toBeVisible();
  await expect(page.locator('#editor-state')).toBeHidden();
});

test('builder light and dark interface modes remain independent', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#btn-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const viewport of [
  { width: 1440, height: 900 }, { width: 1024, height: 768 },
  { width: 768, height: 1024 }, { width: 375, height: 812 }
]) {
  test(`key catalog and editor flow works at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openComponent(page, 'Responsive Accordion');
    await expect(page.locator('#live-preview-iframe')).toBeVisible();
    await expect(page.frameLocator('#live-preview-iframe').locator('.accordion-group')).toBeVisible();
  });
}
