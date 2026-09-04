# QA Automation Project — Playwright + Postman + CI

An end-to-end QA automation portfolio project combining UI test automation, API testing, and continuous integration.

**Developer:** Gbadebo Oluwaseunfunmi Isaac

## Overview

This project demonstrates a full QA automation workflow across two layers of an application:

- **UI testing** with Playwright against [automationexercise.com](https://automationexercise.com), a public site built for QA practice
- **API testing** with Postman against the [Fake Store API](https://fakestoreapi.com), a public REST API for e-commerce data

Tests run automatically on every push via GitHub Actions CI.

## What's Tested

### Playwright (UI) — 8 test scenarios across 6 suites

| Suite | Scenarios |
|---|---|
| Homepage | Page load and key navigation elements, features section visibility |
| Login | Login/signup forms render, invalid credentials show error, empty-field validation |
| Signup | New user reaches account info step, duplicate email handled gracefully |
| Product Search | Search returns matching results, nonsense search handled gracefully |
| Cart | Add product to cart, remove product from cart |
| Contact Form | Valid submission succeeds, missing fields blocked by validation |

Covers positive paths, negative paths (invalid login, empty forms), and edge cases (duplicate signup, no search results) — not just the "happy path."

### Postman (API) — 7 requests covering full CRUD + auth

| Request | What's Validated |
|---|---|
| GET all products | Status 200, response is an array, required fields present |
| GET single product | Status 200, correct ID returned, full schema validated |
| GET products by category | Status 200, all results match requested category |
| POST create product | Status 200, submitted data echoed back, ID assigned |
| PUT update product | Status 200, updated fields reflected in response |
| DELETE product | Status 200, deleted resource ID confirmed |
| POST login (auth) | Status 200, auth token returned in expected format |

## Tech Stack

- **Playwright** (v1.62.1) — browser automation
- **JavaScript** — test scripting
- **Postman** — API testing and collections
- **GitHub Actions** — CI pipeline
- **Node.js / npm** — project tooling

## Project Structure

```
qa-automation-project/
├── tests/
│   ├── homepage.spec.js
│   ├── login.spec.js
│   ├── signup.spec.js
│   ├── search.spec.js
│   ├── cart.spec.js
│   └── contact-form.spec.js
├── postman/
│   └── FakeStoreAPI.postman_collection.json
├── .github/workflows/
│   └── playwright.yml
├── playwright.config.js
├── package.json
└── README.md
```

## Running the Tests

### Playwright (UI tests)

```bash
npm install
npx playwright install
npm test
```

View the HTML report after a run:

```bash
npm run test:report
```

### Postman (API tests)

1. Open Postman
2. Import `postman/FakeStoreAPI.postman_collection.json`
3. Run the collection via the Collection Runner, or use the Postman CLI:

```bash
npm install -g newman
newman run postman/FakeStoreAPI.postman_collection.json
```

## Continuous Integration

Every push to `main` (and every pull request) automatically:
1. Installs dependencies
2. Installs the Playwright browser binaries
3. Runs the full UI test suite
4. Uploads the HTML test report as a build artifact

See `.github/workflows/playwright.yml` for the full pipeline. Check the **Actions** tab on GitHub to view run history and results.

## Notes

- Tests target publicly available demo/practice sites (automationexercise.com, fakestoreapi.com) chosen specifically because they're stable and built for this kind of testing practice, so the suite won't break due to real product changes.
- The signup "duplicate email" test is written defensively to pass whether or not the test email has been previously registered, since the site's demo data isn't cleared between runs.
