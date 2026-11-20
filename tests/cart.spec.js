const { test, expect } = require('@playwright/test');
const { openPracticePage, recoverFromQueueFull } = require('./helpers/navigation');

async function addFirstProductToCart(page) {
  await openPracticePage(page, '/products');

  const productCard = page.locator('.product-image-wrapper').first();

  await expect(productCard).toBeVisible();

  const product = await productCard.evaluate(element => ({
    name: element.querySelector('.productinfo p')?.textContent?.trim() || '',
    id: element.querySelector('[data-product-id]')?.getAttribute('data-product-id') || '',
  }));

  expect(product.name, 'The selected product must have a name.').not.toBe('');
  expect(product.id, 'The selected product must have an ID.').not.toBe('');

  await productCard.hover();
  await productCard.locator('a:has-text("Add to cart")').first().click();

  const modal = page.locator('#cartModal');

  await expect(modal).toBeVisible({ timeout: 15000 });
  await expect(modal).toContainText('Added!');
  await modal.getByText('View Cart').click();

  await expect(page).toHaveURL(url => url.pathname === '/view_cart');

  // Recover only the destination GET if the site returns its queue-full page.
  // Never repeat the Add to Cart action.
  await recoverFromQueueFull(page, '/view_cart');

  await expect(page.locator('body')).not.toContainText(
    /this website is under heavy load\s*\(queue full\)/i
  );

  return product;
}

test.describe('Shopping Cart', () => {
  test('user can add the selected product to the cart', async ({ page }) => {
    const product = await addFirstProductToCart(page);

    const cartRows = page.locator('#cart_info tbody tr');

    await expect(cartRows).toHaveCount(1);

    const productRow = cartRows.filter({
      hasText: product.name,
    });

    await expect(productRow).toHaveCount(1);

    const deleteControl = productRow.locator('.cart_quantity_delete');

    // The cart row must represent the exact product selected.
    await expect(deleteControl).toHaveAttribute(
      'data-product-id',
      product.id
    );
  });

  test('user can remove the selected product from the cart', async ({ page }) => {
    const product = await addFirstProductToCart(page);

    const cartRows = page.locator('#cart_info tbody tr');

    await expect(cartRows).toHaveCount(1);

    const productRow = cartRows.filter({
      hasText: product.name,
    });

    await expect(productRow).toHaveCount(1);

    const deleteControl = productRow.locator('.cart_quantity_delete');

    await expect(deleteControl).toHaveAttribute(
      'data-product-id',
      product.id
    );

    await deleteControl.click();

    // Verify removal of the exact product, not just a reduction in row count.
    await expect(productRow).toHaveCount(0);
    await expect(cartRows).toHaveCount(0);

    await expect(page.locator('#cart_info')).toContainText('Cart is empty!');
  });
});
