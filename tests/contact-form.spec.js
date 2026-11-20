const { test, expect } = require('@playwright/test');
const { openPracticePage } = require('./helpers/navigation');
const { randomUUID } = require('node:crypto');

test.describe('Contact Us Form', () => {
  test('user can submit the contact form with valid details', async ({ page }) => {
    await openPracticePage(page, '/contact_us');

    await expect(page.getByText('Get In Touch')).toBeVisible();

    await page.fill('input[data-qa="name"]', 'QA Test User');
    await page.fill('input[data-qa="email"]', `qa.test.contact.${randomUUID()}@example.com`);
    await page.fill('input[data-qa="subject"]', 'Automated test submission');
    await page.fill(
      'textarea[data-qa="message"]',
      'This is an automated test message submitted via Playwright.'
    );

    // Site triggers a native browser confirm dialog on submit; auto-accept it
    page.once('dialog', (dialog) => dialog.accept());

    await page.click('input[data-qa="submit-button"]');

    await expect(
      page.getByText('Success! Your details have been submitted successfully.').first()
    ).toBeVisible();
  });

  test('submitting the contact form with missing required fields shows validation', async ({ page }) => {
    await openPracticePage(page, '/contact_us');

    const emailInput = page.locator('input[data-qa="email"]');

    // The live form marks email as its required field.
    await expect(emailInput).toHaveAttribute('type', 'email');
    expect(
      await emailInput.evaluate(input => input.required)
    ).toBe(true);

    const initialValidity = await emailInput.evaluate(input => ({
      valid: input.checkValidity(),
      valueMissing: input.validity.valueMissing,
    }));

    expect(initialValidity).toEqual({
      valid: false,
      valueMissing: true,
    });

    await page.click('input[data-qa="submit-button"]');

    // Native browser validation should focus the missing required field.
    await expect(emailInput).toBeFocused();
    await expect(page).toHaveURL(/\/contact_us/);
  });
});
