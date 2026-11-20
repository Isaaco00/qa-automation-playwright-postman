# QA Automation Project

A portfolio project demonstrating UI automation, REST API testing, and continuous integration using Playwright, Postman CLI, and GitHub Actions.

**Developer:** Gbadebo Oluwaseunfunmi Isaac

## Overview

The project tests two publicly available demonstration services:

- **UI automation:** Playwright against [Automation Exercise](https://automationexercise.com).
- **API testing:** A Postman collection against [Fake Store API](https://fakestoreapi.com).

Both test suites are configured to run through GitHub Actions.

## Playwright Test Coverage

**28 Playwright tests across 8 files: 13 browser end-to-end tests, 9 navigation-helper regression tests, and 6 disposable-account cleanup regression tests.**

| Suite | Tests | Coverage |
|---|---:|---|
| Homepage | 2 | Page loading, navigation, featured products |
| Login | 3 | Form rendering, invalid credentials, empty-field validation |
| Signup | 2 | Initial signup flow, duplicate-email rejection |
| Product Search | 2 | Matching results, unsuccessful searches |
| Shopping Cart | 2 | Adding and removing products |
| Contact Form | 2 | Valid submission, required-field validation |
| **Total** | **13** | |

The initial signup test verifies progression to the account-information step; it does not complete registration.

The duplicate-signup test creates a disposable account through the practice site's API, attempts registration with the same email through the browser, verifies the duplicate-email message, deletes the account, and verifies that it can no longer authenticate.

### Navigation-helper regression tests

Nine isolated tests cover successful navigation, temporary HTTP and network failures, queue-full recovery, permanent-error handling, retry exhaustion, and click-navigation recovery.

These tests validate the helper independently; they are not additional application end-to-end scenarios. The implementation is in `tests/helpers/navigation.js` and its tests are in `tests/helpers/navigation.spec.js`.

### Disposable-account cleanup regression tests

Six isolated tests cover successful deletion, ambiguous DELETE timeouts, deletion retries when an account still exists, already-absent accounts, and unresolved cleanup failures. These tests verify that disposable accounts are independently checked for absence after cleanup. The implementation is in `tests/helpers/account-cleanup.js` and its tests are in `tests/helpers/account-cleanup.spec.js`.

## Postman API Test Coverage

**7 requests and 17 Postman test assertions.**

| Request | Coverage |
|---|---|
| GET all products | Status, array response, required fields |
| GET single product | Status, product ID, response structure |
| GET products by category | Status and category matching |
| POST create product | Status, submitted title, assigned ID |
| PUT update product | Status and updated response fields |
| DELETE product | Status and returned product ID |
| POST login | Status and authentication token |

### API limitations

Fake Store API is a demonstration service. Its POST, PUT, and DELETE operations return simulated responses and do not establish persistent database changes. These tests therefore validate API responses, not persistent data modification.

The login endpoint currently returns `201 Created`, although `200 OK` is the expected status for successful authentication. This behaviour is recorded in [upstream issue #167](https://github.com/keikaavousi/fake-store-api/issues/167). The collection currently asserts the observed `201` response and should be revisited if the provider corrects it.

## Technology Stack

| Technology | Purpose |
|---|---|
| JavaScript | Test scripting |
| Node.js | Runtime |
| Playwright 1.62.1 | Browser automation |
| Postman | API collection authoring |
| Postman CLI 1.91.0 | API collection execution |
| GitHub Actions | Continuous integration |
| npm | Dependency management |

## Project Structure

    qa-automation-project/
    ├── tests/
    │   ├── helpers/
    │   │   ├── account-cleanup.js
    │   │   ├── account-cleanup.spec.js
    │   │   ├── navigation.js
    │   │   └── navigation.spec.js
    │   ├── homepage.spec.js
    │   ├── login.spec.js
    │   ├── signup.spec.js
    │   ├── search.spec.js
    │   ├── cart.spec.js
    │   └── contact-form.spec.js
    ├── postman/
    │   └── FakeStoreAPI.postman_collection.json
    ├── .github/
    │   └── workflows/
    │       └── playwright.yml
    ├── playwright.config.js
    ├── package.json
    ├── package-lock.json
    └── README.md

## Getting Started

### Requirements

- Node.js 22.x, 24.x, or 26.x (Playwright 1.62.1 supported versions). This project was locally verified on Node.js 24.14.0; CI uses Node.js 26.
- npm
- Internet connectivity
- Postman CLI for API tests

Clone the repository:

    git clone https://github.com/Isaaco00/qa-automation-playwright-postman.git
    cd qa-automation-playwright-postman

Install project dependencies:

    npm ci

Install the Playwright Chromium browser:

    npx playwright install chromium

## Running Tests

Run all Playwright tests:

    npm test

Run Playwright in headed mode:

    npm run test:headed

Open the Playwright HTML report:

    npm run test:report

### Postman API tests

Install the tested Postman CLI version:

    npm install --global postman-cli@1.91.0

Execute the API collection:

    npm run test:api

The command generates:

- `test-results/postman-results.xml` — JUnit report.
- `test-results/postman-api-report.html` — HTML report.

No Postman Cloud login is required for this local collection run.

### Run both suites

    npm run test:all

This executes Playwright first and Postman second.

## Continuous Integration

The workflow is located at `.github/workflows/playwright.yml`.

It is configured for:

- Pushes to `main`.
- Pull requests targeting `main`.
- Manual workflow dispatch.

The workflow installs project dependencies, installs Postman CLI and Playwright Chromium, executes both test suites, and uploads their reports as GitHub Actions artifacts.

The CI runtime is configured for Node.js 26.

## Dependency Security

Check project dependencies using:

    npm audit

The audit covers dependencies recorded in the project lockfile. Globally installed tools, including Postman CLI, are outside that audit.

## Important Limitations

- Both testing targets are public demonstration services, not production applications controlled by this project.
- Their availability and behaviour can change independently of this repository.
- Fake Store API write operations are simulated rather than persistent.
- Its login endpoint currently has a documented HTTP-status deviation.
- Successful local test runs do not establish production-system reliability or security.
