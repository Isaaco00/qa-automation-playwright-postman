const { test, expect } = require('@playwright/test');
const { openPracticePage } = require('./helpers/navigation');

test.describe('Homepage', () => {
  test('loads successfully and exposes the expected navigation links', async ({ page }) => {
    await openPracticePage(page, '/');

    await expect(page).toHaveTitle(/Automation Exercise/);

    const navigationLinks = [
      { selector: 'a[href="/"]', destination: '/' },
      { selector: 'a[href="/products"]', destination: '/products' },
      { selector: 'a[href="/login"]', destination: '/login' },
      { selector: 'a[href="/view_cart"]', destination: '/view_cart' },
      { selector: 'a[href="/contact_us"]', destination: '/contact_us' },
    ];

    for (const link of navigationLinks) {
      const locator = page.locator(link.selector).first();

      await expect(locator).toBeVisible();
      await expect(locator).toHaveAttribute('href', link.destination);
    }
  });

  test('displays a populated featured-products section', async ({ page }) => {
    await openPracticePage(page, '/');

    const featuresSection = page.locator('.features_items');

    await expect(featuresSection).toBeVisible();

    const productCards = featuresSection.locator('.product-image-wrapper');

    // The catalogue may change, so verify a non-empty product list
    // without assuming a fixed number of products.
    expect(await productCards.count()).toBeGreaterThan(0);

    const productNames = featuresSection.locator(
      '.product-image-wrapper .productinfo p'
    );

    expect(await productNames.count()).toBeGreaterThan(0);

    await expect(productNames.first()).toHaveText(/\S/);
  });
});
