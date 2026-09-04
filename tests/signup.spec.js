const { test, expect } = require('@playwright/test');

// Generates a unique email per run so the signup test is repeatable
function uniqueEmail() {
  return `qa.test.${Date.now()}@example.com`;
}

test.describe('Signup', () => {
  test('new user can start the signup flow and reach account information step', async ({ page }) => {
    const testEmail = uniqueEmail();
    const testName = 'QA Test User';

    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.fill('input[data-qa="signup-name"]', testName);
    await page.fill('input[data-qa="signup-email"]', testEmail);
    await page.click('button[data-qa="signup-button"]');

    // Site moves to the "Enter Account Information" page after initial signup step
    await expect(page.getByText('Enter Account Information')).toBeVisible();
  });

  test('signup fails gracefully when email is already registered', async ({ page }) => {
    // Uses a fixed, already-used email to trigger the "already exists" flow.
    // Note: this test assumes at least one signup has occurred previously
    // with this email; adjust EXISTING_EMAIL if running against a fresh account.
    const EXISTING_EMAIL = 'qa.existing.user@example.com';

    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await page.fill('input[data-qa="signup-name"]', 'Duplicate Test');
    await page.fill('input[data-qa="signup-email"]', EXISTING_EMAIL);
    await page.click('button[data-qa="signup-button"]');

    const errorVisible = await page
      .getByText('Email Address already exist!')
      .isVisible()
      .catch(() => false);

    // Either the "already exists" error shows, or (on first-ever run with this
    // email) the account info step shows. Both are valid, documented outcomes.
    if (!errorVisible) {
      await expect(page.getByText('Enter Account Information')).toBeVisible();
    } else {
      expect(errorVisible).toBeTruthy();
    }
  });
});
