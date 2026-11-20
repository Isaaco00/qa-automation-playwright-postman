const { test, expect } = require('@playwright/test');
const { openPracticePage } = require('./helpers/navigation');
const {
  cleanupDisposableAccount,
} = require('./helpers/account-cleanup');
const { randomUUID } = require('node:crypto');

// Generate unique addresses so repeated test runs do not collide.
function uniqueEmail(prefix = 'qa.test') {
  return `${prefix}.${Date.now()}.${randomUUID()}@example.com`;
}

test.describe('Signup', () => {
  test('new user can start the signup flow and reach account information step', async ({ page }) => {
    const testEmail = uniqueEmail();
    const testName = 'QA Test User';

    await openPracticePage(page, '/login');

    await page.fill('input[data-qa="signup-name"]', testName);
    await page.fill('input[data-qa="signup-email"]', testEmail);
    await page.click('button[data-qa="signup-button"]');

    await expect(
      page.getByText('Enter Account Information')
    ).toBeVisible();
  });

  test('signup rejects an email that is already registered', async ({ page, request }) => {
    // This test creates an external account and must leave enough time
    // for bounded deletion and independent verification during cleanup.
    test.setTimeout(150000);

    const email = uniqueEmail('qa.duplicate');
    const password = `Qa-${randomUUID()}!`;

    const account = {
      name: 'QA Duplicate Test',
      email,
      password,
      title: 'Mr',
      birth_date: '10',
      birth_month: '5',
      birth_year: '1995',
      firstname: 'QA',
      lastname: 'Duplicate',
      company: 'QA Automation',
      address1: '1 Test Street',
      address2: 'Suite 1',
      country: 'United States',
      zipcode: '10001',
      state: 'NY',
      city: 'New York',
      mobile_number: '1234567890',
    };

    let accountCreationAttempted = false;
    let primaryError;
    let cleanupError;

    try {
      // Set this before sending the request because a timeout can occur
      // after the server has already created the account.
      accountCreationAttempted = true;

      const creationResponse = await request.post('/api/createAccount', {
        form: account,
        timeout: 15000,
      });

      expect(
        creationResponse.ok(),
        'The disposable test account creation request should succeed.'
      ).toBeTruthy();

      const creationBody = await creationResponse.json();

      expect(creationBody).toMatchObject({
        responseCode: 201,
        message: 'User created!',
      });

      await openPracticePage(page, '/login');

      await page.fill('input[data-qa="signup-name"]', 'Duplicate Test');
      await page.fill('input[data-qa="signup-email"]', email);
      await page.click('button[data-qa="signup-button"]');

      // Advancing to account information is not an acceptable result.
      await expect(
        page.getByText('Email Address already exist!')
      ).toBeVisible();
    } catch (error) {
      primaryError = error;
    }

    // Cleanup is deliberately outside the main test try/catch so its
    // failure cannot silently replace the original test failure.
    if (accountCreationAttempted) {
      try {
        await cleanupDisposableAccount(request, { email, password });
      } catch (error) {
        cleanupError = error;
      }
    }

    if (primaryError && cleanupError) {
      throw new AggregateError(
        [primaryError, cleanupError],
        'The duplicate-signup test failed and disposable-account cleanup could not be confirmed.'
      );
    }

    if (primaryError) {
      throw primaryError;
    }

    if (cleanupError) {
      throw cleanupError;
    }
  });
});
