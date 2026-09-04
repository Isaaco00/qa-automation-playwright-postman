const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test('loads successfully and shows key navigation elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Automation Exercise/);

    // Core nav elements should be visible
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/products"]')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/view_cart"]').first()).toBeVisible();
  });

  test('features items carousel/section is visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.features_items')).toBeVisible();
  });
});
