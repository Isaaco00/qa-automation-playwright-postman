const { test, expect } = require('@playwright/test');
const { openPracticePage, recoverFromQueueFull } = require('./navigation');

function makeResponse(status) {
  return { status: () => status };
}

function makeFakePage({ responses = [], bodies = [], errors = [] } = {}) {
  let attempts = 0;
  const delays = [];

  return {
    delays,

    get attempts() {
      return attempts;
    },

    async goto() {
      const index = attempts++;

      if (errors[index]) {
        throw errors[index];
      }

      return responses[index] ?? null;
    },

    locator(selector) {
      if (selector !== 'body') {
        throw new Error(`Unexpected locator: ${selector}`);
      }

      return {
        async innerText() {
          return bodies[attempts - 1] ?? '';
        },
      };
    },

    async waitForTimeout(milliseconds) {
      delays.push(milliseconds);
    },
  };
}

test.describe('Navigation resilience helper', () => {
  test('returns immediately when navigation succeeds', async () => {
    const response = makeResponse(200);
    const page = makeFakePage({ responses: [response] });

    const result = await openPracticePage(page, '/products');

    expect(result.status()).toBe(200);
    expect(page.attempts).toBe(1);
    expect(page.delays).toEqual([]);
  });

  test('retries HTTP 503 and succeeds on the next attempt', async () => {
    const page = makeFakePage({
      responses: [makeResponse(503), makeResponse(200)],
      bodies: ['Service unavailable', 'Products page'],
    });

    const result = await openPracticePage(page, '/products');

    expect(result.status()).toBe(200);
    expect(page.attempts).toBe(2);
    expect(page.delays).toEqual([1000]);
  });

  test('retries the explicit queue-full response even when HTTP is 200', async () => {
    const page = makeFakePage({
      responses: [makeResponse(200), makeResponse(200)],
      bodies: [
        'This website is under heavy load (queue full)',
        'Products page',
      ],
    });

    const result = await openPracticePage(page, '/products');

    expect(result.status()).toBe(200);
    expect(page.attempts).toBe(2);
    expect(page.delays).toEqual([1000]);
  });

  test('retries a transient connection-reset error', async () => {
    const page = makeFakePage({
      errors: [new Error('net::ERR_CONNECTION_RESET')],
      responses: [undefined, makeResponse(200)],
      bodies: ['', 'Products page'],
    });

    const result = await openPracticePage(page, '/products');

    expect(result.status()).toBe(200);
    expect(page.attempts).toBe(2);
    expect(page.delays).toEqual([1000]);
  });

  test('does not retry a permanent HTTP 404 response', async () => {
    const page = makeFakePage({
      responses: [makeResponse(404)],
      bodies: ['Not found'],
    });

    await expect(
      openPracticePage(page, '/missing')
    ).rejects.toThrow('non-retryable HTTP 404');

    expect(page.attempts).toBe(1);
    expect(page.delays).toEqual([]);
  });

  test('does not retry a certificate error', async () => {
    const page = makeFakePage({
      errors: [new Error('net::ERR_CERT_AUTHORITY_INVALID')],
    });

    await expect(
      openPracticePage(page, '/products')
    ).rejects.toThrow('Non-retryable navigation error');

    expect(page.attempts).toBe(1);
    expect(page.delays).toEqual([]);
  });

  test('reports a clear failure after all queue-full attempts are exhausted', async () => {
    const queueMessage =
      'This website is under heavy load (queue full)';

    const page = makeFakePage({
      responses: [
        makeResponse(200),
        makeResponse(200),
        makeResponse(200),
      ],
      bodies: [queueMessage, queueMessage, queueMessage],
    });

    await expect(
      openPracticePage(page, '/products')
    ).rejects.toThrow('Unable to open /products after 3 attempts');

    expect(page.attempts).toBe(3);
    expect(page.delays).toEqual([1000, 2000]);
  });
});

test.describe('Click-navigation queue-full recovery', () => {
  test('does not navigate again when the current page is healthy', async () => {
    let gotoCalls = 0;

    const page = {
      locator() {
        return {
          async innerText() {
            return 'Shopping cart';
          },
        };
      },

      async goto() {
        gotoCalls++;
        return makeResponse(200);
      },

      async waitForTimeout() {},
    };

    const recovered = await recoverFromQueueFull(
      page,
      '/view_cart'
    );

    expect(recovered).toBe(false);
    expect(gotoCalls).toBe(0);
  });

  test('reopens a click destination when it displays the queue-full page', async () => {
    let gotoCalls = 0;
    let currentBody =
      'This website is under heavy load (queue full)';

    const page = {
      locator() {
        return {
          async innerText() {
            return currentBody;
          },
        };
      },

      async goto(path) {
        gotoCalls++;

        expect(path).toBe('/view_cart');

        currentBody = 'Shopping cart';

        return makeResponse(200);
      },

      async waitForTimeout() {},
    };

    const recovered = await recoverFromQueueFull(
      page,
      '/view_cart'
    );

    expect(recovered).toBe(true);
    expect(gotoCalls).toBe(1);
    expect(currentBody).toBe('Shopping cart');
  });
});