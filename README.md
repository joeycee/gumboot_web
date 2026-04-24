# Gumboot Web

This is the web app for Gumboot, built with Next.js.

If you are new to the project, the main thing to know is:

- `npm run dev` starts the app locally so you can use it in the browser.
- `npm run test:e2e` runs Playwright browser tests that click through the app like a real user.
- `npm run lint` checks the code for common mistakes.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Useful Commands

### Start the app

```bash
npm run dev
```

What it does in simple terms:
Starts the website on your machine so you can open it in the browser and work on it.

### Check code quality

```bash
npm run lint
```

What it does in simple terms:
Looks through the code and points out common problems like broken imports, invalid JSX, and other issues that should be cleaned up before shipping.

### Run end-to-end tests

```bash
npm run test:e2e
```

What it does in simple terms:
Starts the app in a special test mode, opens a real browser with Playwright, and checks that important user flows still work.

### Run end-to-end tests with the browser visible

```bash
npm run test:e2e:headed
```

What it does in simple terms:
Same as `npm run test:e2e`, but you can actually watch the browser clicking around. This is useful when you want to understand what the tests are doing or debug a failure.

## What The Playwright Tests Actually Do

These tests are meant to answer a simple question:

```text
Can a real user still do the most important things in the app?
```

Instead of only testing tiny pieces of code, Playwright opens the site and behaves like a person would:

- it visits pages
- fills in forms
- clicks buttons
- waits for redirects
- checks that the correct screen appears

That makes these tests very good at catching broken flows that might still pass smaller unit tests.

## Why Test Mode Exists

Normally the app expects a real OTP flow for login.

That is annoying for automated browser tests because:

- someone would need to manually read a code every time
- tests would be slower
- tests would be harder to run in CI

So `npm run test:e2e` turns on a local-only test mode that:

- skips the OTP requirement for the configured test accounts
- uses a local fake backend for the specific flows we want to test
- keeps the tests fast and repeatable

This test mode is only intended for local E2E runs and should not be relied on as a production auth path.

## The 5 Current E2E Tests

The main test file is:

[`tests/e2e/production-flows.spec.ts`](/home/josep/projects/gumboot-web/tests/e2e/production-flows.spec.ts)

Here is what each test checks, in plain English.

### 1. User can log in

What the test does:

- opens the login page
- enters the test phone number
- uses test mode to bypass OTP
- confirms the user is no longer stuck on the login/OTP screens
- confirms an auth token was stored

Why this matters:
If this breaks, most other protected parts of the app become unusable.

### 2. User can post a job

What the test does:

- logs in as the job owner
- opens the post-a-job flow
- fills in a title and description
- chooses a job type
- enters a budget
- chooses the date
- fills in an address
- submits the job
- confirms the app ends on the expected success URL

Why this matters:
Posting jobs is one of the main business flows. If this breaks, customers cannot create work.

### 3. Worker can apply for a job

What the test does:

- creates a job for the owner in the background
- logs in as a worker
- opens the apply page for that job
- enters an offer amount and a message
- sends the application
- confirms the worker is redirected back to the job page
- confirms the page shows the worker as having applied

Why this matters:
This proves workers can respond to jobs and that the apply flow still works end-to-end.

### 4. Job owner can accept application

What the test does:

- creates a job
- creates a worker application for that job
- logs in as the job owner
- opens the job details page
- clicks the accept button on the application
- confirms the app shows the application was accepted

Why this matters:
This is the handoff point where a posted job becomes accepted work.

### 5. Notification click opens correct page

What the test does:

- creates a job
- creates a worker application
- logs in as the owner
- opens notifications
- clicks the notification about that application
- confirms it opens the exact offer/application page for that job

Why this matters:
Notifications are only useful if they take the user to the correct place. This test protects that navigation flow.

## Where The Test Data Comes From

For `npm run test:e2e`, the app uses a lightweight local mock backend route instead of needing the real production backend for these flows.

That lets the test suite create things like:

- test users
- test jobs
- test applications
- test notifications

This keeps the tests isolated and predictable.

Relevant files:

- [`playwright.config.ts`](/home/josep/projects/gumboot-web/playwright.config.ts)
- [`tests/e2e/helpers.ts`](/home/josep/projects/gumboot-web/tests/e2e/helpers.ts)
- [`src/app/api/e2e-backend/[...slug]/route.ts`](/home/josep/projects/gumboot-web/src/app/api/e2e-backend/[...slug]/route.ts)
- [`src/app/api/test-login/route.ts`](/home/josep/projects/gumboot-web/src/app/api/test-login/route.ts)

## Environment Variables For E2E Tests

These are the main values the Playwright tests use:

- `PLAYWRIGHT_OWNER_PHONE`
- `PLAYWRIGHT_OWNER_TOKEN`
- `PLAYWRIGHT_WORKER_PHONE`
- `PLAYWRIGHT_WORKER_TOKEN`
- `PLAYWRIGHT_TEST_ADDRESS`
- `PLAYWRIGHT_TEST_LAT`
- `PLAYWRIGHT_TEST_LNG`
- `PLAYWRIGHT_JOB_TYPE_NAME`

In plain English:

- the `OWNER` values are for the person posting and accepting jobs
- the `WORKER` values are for the person applying to jobs
- the address values are used when the tests need to post a job with a location

The command `npm run test:e2e` already injects the local test API base URLs and enables test mode automatically.

## When To Use Which Command

Use `npm run dev` when:

- you are building UI
- you want to click around manually
- you are testing one thing by hand

Use `npm run lint` when:

- you changed code and want a quick quality check
- you want to catch obvious mistakes before committing

Use `npm run test:e2e` when:

- you changed login, jobs, notifications, or application flows
- you want confidence the key journeys still work
- you are preparing for a release or merge

Use `npm run test:e2e:headed` when:

- a test is failing and you want to watch it happen
- you want to better understand the exact browser steps

## Quick Example Workflow

If you changed the job flow, a practical check would be:

```bash
npm run lint
npm run test:e2e
```

If a browser test fails and you want to watch it:

```bash
npm run test:e2e:headed
```

## Tech Stack

- Next.js
- React
- TypeScript
- Playwright

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Playwright Documentation](https://playwright.dev/)
