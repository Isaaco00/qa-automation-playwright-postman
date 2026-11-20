const { test, expect } = require('@playwright/test');
const { openPracticePage } = require('./helpers/navigation');

test.describe('Product Search', () => {
  test('searching for a known product returns relevant results', async ({ page }) => {
    const query = 'Dress';

    await openPracticePage(page, '/products');

    await page.fill('#search_product', query);
    await page.locator('#submit_search').click();

    // Verify that the submitted search appears in the URL.
    await expect(page.getByText('Searched Products')).toBeVisible();

    // Inspect the actual URL after the search results have loaded.
    const searchUrl = new URL(page.url());

    expect(searchUrl.pathname).toBe('/products');
    expect(searchUrl.searchParams.get('search')).toBe(query);

    const results = page.locator(
      '.features_items .product-image-wrapper'
    );

    await expect(results.first()).toBeVisible();

    const productNames = await results
      .locator('.productinfo p')
      .allTextContents();

    expect(productNames.length).toBeGreaterThan(0);

    // At least one returned product name must match the search term.
    expect(
      productNames.some(name =>
        name.toLowerCase().includes(query.toLowerCase())
      ),
      'At least one returned product name should match the search term.'
    ).toBe(true);
  });

  test('searching for a nonexistent product returns no products', async ({ page }) => {
    const query = 'zzzznonexistentproductzzzz';

    await openPracticePage(page, '/products');

    await page.fill('#search_product', query);
    await page.locator('#submit_search').click();

    await expect(page.getByText('Searched Products')).toBeVisible();

    // Inspect the actual URL after the search results have loaded.
    const searchUrl = new URL(page.url());

    expect(searchUrl.pathname).toBe('/products');
    expect(searchUrl.searchParams.get('search')).toBe(query);

    const results = page.locator(
      '.features_items .product-image-wrapper'
    );

    await expect(results).toHaveCount(0);
  });
});
