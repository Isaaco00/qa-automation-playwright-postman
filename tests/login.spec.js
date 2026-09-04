const { test, expect } = require('@playwright/test');

test.describe('Login', () => {
  test('login page loads with both login and signup forms', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.login-form')).toBeVisible();
    await expect(page.locator('.signup-form')).toBeVisible();
  });

  test('shows an error message when logging in with invalid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.fill('input[data-qa="login-email"]', 'not-a-real-user@example.com');
    await page.fill('input[data-qa="login-password"]', 'WrongPassword123');
    await page.click('button[data-qa="login-button"]');

    await expect(
      page.getByText('Your email or password is incorrect!')
    ).toBeVisible();
  });

  test('shows validation when submitting login form with empty fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.click('button[data-qa="login-button"]');

    // Browser-native required-field validation should block submission;
    // we confirm we're still on the login page rather than navigated away.
    await expect(page).toHaveURL(/\/login/);
  });
});
