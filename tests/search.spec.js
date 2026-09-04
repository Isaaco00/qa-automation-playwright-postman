const { test, expect } = require('@playwright/test');

test.describe('Product Search', () => {
  test('searching for a known product returns matching results', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });

    await page.fill('#search_product', 'Dress');
    await page.click('#submit_search');

    await expect(page.getByText('Searched Products')).toBeVisible();

    const results = page.locator('.features_items .product-image-wrapper');
    await expect(results.first()).toBeVisible();

    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('searching for a nonsense term returns no or empty results gracefully', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });

    await page.fill('#search_product', 'zzzznonexistentproductzzzz');
    await page.click('#submit_search');

    await expect(page.getByText('Searched Products')).toBeVisible();
    // Page should not error out; it should simply show the (possibly empty) results section
    await expect(page.locator('.features_items')).toBeVisible();
  });
});
