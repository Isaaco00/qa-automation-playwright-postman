const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Contact Us Form', () => {
  test('user can submit the contact form with valid details', async ({ page }) => {
    await page.goto('/contact_us', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Get In Touch')).toBeVisible();

    await page.fill('input[data-qa="name"]', 'QA Test User');
    await page.fill('input[data-qa="email"]', 'qa.test.contact@example.com');
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
    await page.goto('/contact_us', { waitUntil: 'domcontentloaded' });

    await page.click('input[data-qa="submit-button"]');

    // Should remain on the contact page since required fields are empty
    await expect(page).toHaveURL(/\/contact_us/);
  });
});
