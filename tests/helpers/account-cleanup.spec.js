const { test, expect } = require('@playwright/test');
const {
  cleanupDisposableAccount,
} = require('./account-cleanup');

const ACCOUNT = {
  email: 'qa.cleanup.test@example.com',
  password: 'Qa-Cleanup-Test-Password!',
};

function absentAccount() {
  return {
    responseCode: 404,
    message: 'User not found!',
  };
}

function existingAccount() {
  return {
    responseCode: 200,
    message: 'User exists!',
  };
}

function makeMockRequest({ deletions = [], verifications = [] }) {
  const deletionSteps = [...deletions];
  const verificationSteps = [...verifications];

  const calls = {
    deletions: [],
    verifications: [],
  };

  async function resolveStep(steps, operation) {
    if (steps.length === 0) {
      throw new Error(`Unexpected ${operation} request.`);
    }

    const step = steps.shift();

    if (step instanceof Error) {
      throw step;
    }

    const mockResponse = Object.prototype.hasOwnProperty.call(step, 'body')
      ? step
      : { httpStatus: 200, body: step };

    const status = mockResponse.httpStatus ?? 200;

    return {
      status: () => status,
      ok: () => status >= 200 && status < 300,
      json: async () => mockResponse.body,
    };
  }

  const request = {
    delete: async (path, options) => {
      calls.deletions.push({ path, options });
      return resolveStep(deletionSteps, 'DELETE');
    },

    post: async (path, options) => {
      calls.verifications.push({ path, options });
      return resolveStep(verificationSteps, 'verification');
    },
  };

  return { request, calls };
}

test.describe('Disposable account cleanup helper', () => {
  test('confirms cleanup after a successful deletion', async () => {
    const { request, calls } = makeMockRequest({
      deletions: [
        {
          responseCode: 200,
          message: 'Account deleted!',
        },
      ],
      verifications: [absentAccount()],
    });

    await cleanupDisposableAccount(request, ACCOUNT);

    expect(calls.deletions).toHaveLength(1);
    expect(calls.verifications).toHaveLength(1);
    expect(calls.deletions[0].path).toBe('/api/deleteAccount');
    expect(calls.verifications[0].path).toBe('/api/verifyLogin');
  });

  test('accepts a DELETE timeout when verification confirms the account is absent', async () => {
    const { request, calls } = makeMockRequest({
      deletions: [
        new Error('apiRequestContext.delete: Timeout 8000ms exceeded'),
      ],
      verifications: [absentAccount()],
    });

    await cleanupDisposableAccount(request, ACCOUNT);

    expect(calls.deletions).toHaveLength(1);
    expect(calls.verifications).toHaveLength(1);
  });

  test('retries deletion when verification shows the account still exists', async () => {
    const { request, calls } = makeMockRequest({
      deletions: [
        {
          responseCode: 200,
          message: 'Account deleted!',
        },
        {
          responseCode: 200,
          message: 'Account deleted!',
        },
      ],
      verifications: [
        existingAccount(),
        absentAccount(),
      ],
    });

    await cleanupDisposableAccount(request, ACCOUNT);

    expect(calls.deletions).toHaveLength(2);
    expect(calls.verifications).toHaveLength(2);
  });

  test('accepts an already-absent account after independent verification', async () => {
    const { request, calls } = makeMockRequest({
      deletions: [
        {
          responseCode: 404,
          message: 'User not found!',
        },
      ],
      verifications: [absentAccount()],
    });

    await cleanupDisposableAccount(request, ACCOUNT);

    expect(calls.deletions).toHaveLength(1);
    expect(calls.verifications).toHaveLength(1);
  });

  test('fails clearly when account absence cannot be verified', async () => {
    const { request, calls } = makeMockRequest({
      deletions: [
        new Error('DELETE timed out'),
        new Error('DELETE timed out again'),
      ],
      verifications: [
        new Error('Verification timed out'),
        new Error('Verification timed out again'),
      ],
    });

    await expect(
      cleanupDisposableAccount(request, ACCOUNT)
    ).rejects.toThrow(/Could not confirm that disposable account/);

    expect(calls.deletions).toHaveLength(2);
    expect(calls.verifications).toHaveLength(2);
  });

  test('does not accept an account-not-found body from an HTTP 500 response', async () => {
    const { request, calls } = makeMockRequest({
      deletions: [
        { responseCode: 200, message: 'Account deleted!' },
        { responseCode: 200, message: 'Account deleted!' },
      ],
      verifications: [
        { httpStatus: 500, body: absentAccount() },
        { httpStatus: 500, body: absentAccount() },
      ],
    });

    await expect(
      cleanupDisposableAccount(request, ACCOUNT)
    ).rejects.toThrow(/unexpected HTTP 500/);

    expect(calls.deletions).toHaveLength(2);
    expect(calls.verifications).toHaveLength(2);
  });
});
