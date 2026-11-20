const { test, expect } = require('@playwright/test');
const { openPracticePage } = require('./helpers/navigation');

test.describe('Login', () => {
  test('login page loads with both login and signup forms', async ({ page }) => {
    await openPracticePage(page, '/login');

    await expect(page.locator('.login-form')).toBeVisible();
    await expect(page.locator('.signup-form')).toBeVisible();
  });

  test('shows an error message when logging in with invalid credentials', async ({ page }) => {
    await openPracticePage(page, '/login');

    await page.fill('input[data-qa="login-email"]', 'not-a-real-user@example.com');
    await page.fill('input[data-qa="login-password"]', 'WrongPassword123');
    await page.click('button[data-qa="login-button"]');

    await expect(
      page.getByText('Your email or password is incorrect!')
    ).toBeVisible();
  });

  test('blocks login submission when required fields are empty', async ({ page }) => {
    await openPracticePage(page, '/login');

    const emailInput = page.locator('input[data-qa="login-email"]');
    const passwordInput = page.locator('input[data-qa="login-password"]');

    // Verify both fields are required by the actual HTML form.
    expect(await emailInput.evaluate(input => input.required)).toBe(true);
    expect(await passwordInput.evaluate(input => input.required)).toBe(true);

    // Verify both fields fail native browser validation while empty.
    const emailValidity = await emailInput.evaluate(input => ({
      valid: input.checkValidity(),
      valueMissing: input.validity.valueMissing,
    }));

    const passwordValidity = await passwordInput.evaluate(input => ({
      valid: input.checkValidity(),
      valueMissing: input.validity.valueMissing,
    }));

    expect(emailValidity).toEqual({
      valid: false,
      valueMissing: true,
    });

    expect(passwordValidity).toEqual({
      valid: false,
      valueMissing: true,
    });

    await page.locator('button[data-qa="login-button"]').click();

    // The browser should focus the first invalid field and block submission.
    await expect(emailInput).toBeFocused();
    await expect(page).toHaveURL(/\/login/);
  });
});
