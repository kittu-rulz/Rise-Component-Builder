import { expect, test } from '@playwright/test';

async function openAccordion(page) {
  await page.goto('/');
  await page.locator('.component-select-card').filter({ hasText: 'Responsive Accordion' }).click();
  await expect(page.locator('#editor-state')).toBeVisible();
}

test.beforeEach(async ({ page }) => openAccordion(page));

test('content changes update the live preview', async ({ page }) => {
  await page.locator('#input-block-title').fill('LEARNING\nACTIVITY');
  await page.locator('#input-block-headline').fill('Updated live preview\nheadline');
  const frame = page.frameLocator('#live-preview-iframe');
  await expect(frame.locator('.block-label')).toHaveText('LEARNING\nACTIVITY');
  await expect(frame.locator('#block-headline')).toHaveText('Updated live preview\nheadline');
  await expect(frame.locator('.block-label')).toHaveCSS('white-space', 'pre-line');
  await expect(frame.locator('#block-headline')).toHaveCSS('white-space', 'pre-line');
});

test('items can be added, duplicated, deleted, moved, and collapsed', async ({ page }) => {
  const cards = page.locator('#dynamic-items-container > .dynamic-item-card:not(.component-fields-card)');
  await expect(cards).toHaveCount(3);
  await page.locator('#btn-add-item').click();
  await expect(cards).toHaveCount(4);
  await cards.first().getByRole('button', { name: 'Duplicate item' }).click();
  await expect(cards).toHaveCount(5);
  await cards.nth(1).getByRole('button', { name: 'Delete item' }).click();
  await expect(cards).toHaveCount(4);
  const secondSummary = await cards.nth(1).locator('.item-collapse-btn').textContent();
  await cards.first().getByRole('button', { name: 'Move item down' }).click();
  await expect(cards.first().locator('.item-collapse-btn')).toContainText(secondSummary.split('—').pop().trim());
  await cards.first().locator('.item-collapse-btn').click();
  await expect(cards.first()).toHaveClass(/collapsed/);
});

test('design controls update theme variables in preview', async ({ page }) => {
  await page.getByRole('button', { name: 'Design & Style' }).click();
  await page.locator('#input-color-primary-text').fill('#123456');
  await page.locator('#input-border-radius').fill('20');
  const frame = page.frameLocator('#live-preview-iframe');
  await expect.poll(() => frame.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--primary').trim())).toBe('#123456');
  await expect.poll(() => frame.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--border-radius').trim())).toBe('20px');
});

test('behavior settings update accordion single-open behavior', async ({ page }) => {
  await page.getByRole('button', { name: 'Behavior' }).click();
  await page.locator('#input-behavior-accordion-multi').uncheck();
  const triggers = page.frameLocator('#live-preview-iframe').locator('.accordion-trigger');
  await triggers.nth(0).click();
  await triggers.nth(1).click();
  await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'false');
  await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true');
});

test('required schema fields display inline errors', async ({ page }) => {
  await page.locator('#btn-back-to-catalog').click();
  await page.getByText('Knowledge Checks', { exact: true }).click();
  await page.locator('.component-select-card').filter({ hasText: 'Multiple Choice' }).click();
  const label = page.locator('#schema-0-label');
  await label.fill('');
  await expect(page.locator('#schema-0-label-error')).not.toBeEmpty();
  await expect(label).toHaveAttribute('aria-invalid', 'true');
});

test('desktop, tablet, mobile, and refresh controls update the preview shell', async ({ page }) => {
  const viewport = page.locator('#preview-viewport');
  await page.locator('[data-device="tablet"]').click();
  await expect(viewport).toHaveClass(/tablet/);
  await page.locator('[data-device="mobile"]').click();
  await expect(viewport).toHaveClass(/mobile/);
  await page.locator('[data-device="desktop"]').click();
  await expect(viewport).toHaveClass(/desktop/);
  await page.locator('#btn-preview-refresh').click();
  await expect(page.frameLocator('#live-preview-iframe').locator('.accordion-group')).toBeVisible();
});

test('pop-out preview opens where browser permissions permit', async ({ page }) => {
  const popupPromise = page.waitForEvent('popup');
  await page.locator('#btn-preview-popout').click();
  const popup = await popupPromise;
  await expect(popup.locator('.accordion-group')).toBeVisible();
  await popup.close();
});

test('flip-card custom artwork uploads per face and removal restores the built-in icon', async ({ page }) => {
  await page.locator('#btn-back-to-catalog').click();
  await page.locator('.component-select-card').filter({ hasText: '3D Flip Cards' }).click();
  const iconField = page.locator('#schema-0-iconImage').locator('xpath=ancestor::div[contains(@class,"schema-field")]');
  await expect(iconField.locator('.media-upload-guidance')).toHaveText(
    'Supported formats: JPG, JPEG, PNG, WebP, SVG, GIF. Preferred dimensions: 256 × 256 px (square). Maximum file size: 10 MB; SVG: 2 MB.'
  );
  await expect(page.locator('#schema-0-iconImage')).toHaveAttribute('aria-describedby', /schema-0-iconImage-guidance/);
  await iconField.locator('input[type="file"]').setInputFiles({
    name: 'custom-icon.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  });
  await page.locator('#schema-0-iconAltText').fill('Custom learning icon');
  const front = page.frameLocator('#live-preview-iframe').locator('.flip-card-front').first();
  await expect(front.locator('img.custom-item-icon')).toHaveAttribute('alt', 'Custom learning icon');
  await expect(iconField.locator('.media-file-metadata')).toContainText('custom-icon.png');
  await iconField.getByRole('button', { name: 'Remove file' }).click();
  await expect(front.locator('img.custom-item-icon')).toHaveCount(0);
  await expect(front.locator('.card-icon-badge svg')).toBeVisible();
});
