const { test, expect } = require('@playwright/test');

test.describe('Shopping Cart', () => {
  test('user can add a product to the cart from the products page', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });

    // Hover over the first product to reveal the "Add to cart" button, then click it
    const firstProduct = page.locator('.product-image-wrapper').first();
    await firstProduct.hover();
    await firstProduct.locator('a:has-text("Add to cart")').first().click();

    // Confirmation modal appears - wait for it to be fully visible before
    // interacting, then click "View Cart" scoped to the modal itself so we
    // never race against another matching link elsewhere on the page.
    const modal = page.locator('#cartModal');
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modal.getByText('Added!')).toBeVisible();
    await modal.getByText('View Cart').click();

    await expect(page).toHaveURL(/\/view_cart/);
    await expect(page.locator('#cart_info tbody tr').first()).toBeVisible();
  });

  test('user can remove a product from the cart', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });

    const firstProduct = page.locator('.product-image-wrapper').first();
    await firstProduct.hover();
    await firstProduct.locator('a:has-text("Add to cart")').first().click();

    const modal = page.locator('#cartModal');
    await expect(modal).toBeVisible({ timeout: 15000 });
    await modal.getByText('View Cart').click();

    await expect(page).toHaveURL(/\/view_cart/);

    const rowCountBefore = await page.locator('#cart_info tbody tr').count();
    expect(rowCountBefore).toBeGreaterThan(0);

    await page.click('.cart_quantity_delete');

    // Give the page a moment to update after deletion, then verify the row is gone
    await expect(page.locator('#cart_info tbody tr')).toHaveCount(
      rowCountBefore - 1
    );
  });
});
