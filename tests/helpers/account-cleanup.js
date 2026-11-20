const MAX_DELETE_ATTEMPTS = 2;
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 1000;

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Delete a disposable account and independently verify its absence.
 *
 * A DELETE timeout is ambiguous: the server may have processed the
 * deletion even though the client did not receive the response.
 * Therefore, the account state is verified after every DELETE attempt.
 */
async function cleanupDisposableAccount(request, { email, password }) {
  const diagnostics = [];

  for (let attempt = 1; attempt <= MAX_DELETE_ATTEMPTS; attempt++) {
    // DELETE is safe to retry here because the target is a uniquely
    // generated disposable test account.
    try {
      const deletionResponse = await request.delete('/api/deleteAccount', {
        form: { email, password },
        timeout: REQUEST_TIMEOUT_MS,
      });

      const deletionStatus = deletionResponse.status();
      const deletionBody = await deletionResponse.json();

      const deletionTransportAccepted =
        deletionResponse.ok() ||
        (
          deletionStatus === 404 &&
          deletionBody.responseCode === 404 &&
          deletionBody.message === 'User not found!'
        );

      if (!deletionTransportAccepted) {
        diagnostics.push(
          `DELETE attempt ${attempt}: unexpected HTTP ${deletionStatus}.`
        );
      } else if (
        deletionBody.responseCode === 200 &&
        deletionBody.message === 'Account deleted!'
      ) {
        diagnostics.push(`DELETE attempt ${attempt}: deletion acknowledged.`);
      } else if (
        deletionBody.responseCode === 404 &&
        deletionBody.message === 'User not found!'
      ) {
        diagnostics.push(`DELETE attempt ${attempt}: account was not found.`);
      } else {
        diagnostics.push(
          `DELETE attempt ${attempt}: unexpected response ` +
          `${JSON.stringify(deletionBody)}.`
        );
      }
    } catch (error) {
      diagnostics.push(
        `DELETE attempt ${attempt} failed or timed out: ${error.message}`
      );
    }

    // Do not assume that a successful DELETE response proves the
    // account is gone. Verify its actual authentication state.
    try {
      const verificationResponse = await request.post('/api/verifyLogin', {
        form: { email, password },
        timeout: REQUEST_TIMEOUT_MS,
      });

      const verificationStatus = verificationResponse.status();
      const verificationBody = await verificationResponse.json();

      const verificationTransportAccepted =
        verificationResponse.ok() ||
        (
          verificationStatus === 404 &&
          verificationBody.responseCode === 404 &&
          verificationBody.message === 'User not found!'
        );

      if (!verificationTransportAccepted) {
        diagnostics.push(
          `Verification attempt ${attempt}: unexpected HTTP ${verificationStatus}.`
        );
      } else if (
        verificationBody.responseCode === 404 &&
        verificationBody.message === 'User not found!'
      ) {
        return;
      } else if (
        verificationBody.responseCode === 200 &&
        verificationBody.message === 'User exists!'
      ) {
        diagnostics.push(
          `Verification attempt ${attempt}: account still exists.`
        );
      } else {
        diagnostics.push(
          `Verification attempt ${attempt}: unexpected response ` +
          `${JSON.stringify(verificationBody)}.`
        );
      }
    } catch (error) {
      diagnostics.push(
        `Verification attempt ${attempt} failed: ${error.message}`
      );
    }

    if (attempt < MAX_DELETE_ATTEMPTS) {
      await wait(RETRY_DELAY_MS);
    }
  }

  throw new Error(
    `[signup cleanup] Could not confirm that disposable account ${email} ` +
    `was removed after ${MAX_DELETE_ATTEMPTS} attempts. ` +
    `Manual account-state verification may be required. ` +
    `Details: ${diagnostics.join(' | ')}`
  );
}

module.exports = {
  cleanupDisposableAccount,
};