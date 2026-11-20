const MAX_ATTEMPTS = 3;

// Bound the retry budget so navigation failures leave time for
// test assertions and cleanup.
const NAVIGATION_TIMEOUT_MS = 15000;
const BODY_INSPECTION_TIMEOUT_MS = 1500;
const RETRY_DELAYS_MS = [1000, 2000];

const QUEUE_FULL_PATTERN =
  /this website is under heavy load\s*\(queue full\)/i;

const TRANSIENT_NAVIGATION_ERROR_PATTERN =
  /net::ERR_(?:CONNECTION_RESET|CONNECTION_CLOSED|CONNECTION_TIMED_OUT|TIMED_OUT|NETWORK_CHANGED|NAME_NOT_RESOLVED|ADDRESS_UNREACHABLE|INTERNET_DISCONNECTED)|navigation timeout|timeout \d+ms exceeded/i;

function isTransientNavigationError(error) {
  return TRANSIENT_NAVIGATION_ERROR_PATTERN.test(error.message);
}

async function openPracticePage(page, path) {
  let lastFailure = 'No response received';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;
    let navigationError = false;

    try {
      response = await page.goto(path, {
        waitUntil: 'domcontentloaded',
        timeout: NAVIGATION_TIMEOUT_MS,
      });
    } catch (error) {
      if (!isTransientNavigationError(error)) {
        throw new Error(
          `[practice-site] Non-retryable navigation error for ${path}: ${error.message}`
        );
      }

      navigationError = true;
      lastFailure = `Transient navigation error: ${error.message}`;
    }

    if (response) {
      const status = response.status();
      let bodyText = '';

      try {
        bodyText = await page.locator('body').innerText({
          timeout: BODY_INSPECTION_TIMEOUT_MS,
        });
      } catch {
        // Status and response checks remain authoritative if the body
        // cannot be inspected.
      }

      const queueFull = QUEUE_FULL_PATTERN.test(bodyText);

      const transientStatus =
        [408, 425, 429].includes(status) ||
        (status >= 500 && status <= 599);

      if (!queueFull && !transientStatus) {
        if (status >= 400) {
          throw new Error(
            `[practice-site] ${path} returned non-retryable HTTP ${status}.`
          );
        }

        return response;
      }

      lastFailure = [
        `HTTP ${status}`,
        queueFull ? 'Queue-full response detected' : null,
      ].filter(Boolean).join('; ');
    } else if (!navigationError) {
      lastFailure = 'Navigation returned no HTTP response';
    }

    // Never sleep after the final attempt. This ensures the helper
    // reports exhaustion immediately instead of consuming test time.
    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_DELAYS_MS[attempt - 1];

      console.warn(
        `[practice-site] ${path}: ${lastFailure}. ` +
        `Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS}).`
      );

      await page.waitForTimeout(delay);
    }
  }

  throw new Error(
    `[practice-site] Unable to open ${path} after ${MAX_ATTEMPTS} attempts. ` +
    `Last failure: ${lastFailure}. ` +
    'The external demonstration website may be temporarily unavailable.'
  );
}

async function recoverFromQueueFull(page, path) {
  let bodyText = '';

  try {
    bodyText = await page.locator('body').innerText({
      timeout: BODY_INSPECTION_TIMEOUT_MS,
    });
  } catch {
    return false;
  }

  if (!QUEUE_FULL_PATTERN.test(bodyText)) {
    return false;
  }

  console.warn(
    `[practice-site] ${path}: click navigation landed on a queue-full page. ` +
    'Retrying the destination GET without repeating the original action.'
  );

  await openPracticePage(page, path);

  return true;
}

module.exports = {
  openPracticePage,
  recoverFromQueueFull,
};