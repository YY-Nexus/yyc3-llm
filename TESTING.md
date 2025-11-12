# Testing Strategy

## Test Types

- Unit: functions/components with isolated logic (`__tests__/components/*`).
- Integration: API routes and workflows (`app/api/*`, `__tests__/api.test.ts`).
- E2E: user flows with Playwright (`e2e/`).

## Commands

- Unit/Integration: `npm test` | watch: `npm run test:watch` | coverage: `npm run test:coverage`.
- CI-friendly: `npm run test:ci`.
- E2E: `npm run test:e2e` (UI mode: `npm run test:e2e:ui`).

## Setup

- Jest config: `jest.config.cjs`, setup file: `__tests__/setup.ts`.
- Testing libs: `@testing-library/react`, `jest-environment-jsdom`.

## E2E Best Practices

- Prefer stable queries: `data-testid`, accessible `role` + `name`.
  - Example: `page.getByTestId('refresh-models')`, `page.getByRole('button', { name: '提交' })`.
- Avoid brittle text queries; do not rely on dynamic copy.
- Page structure should expose hooks:
  - Root container: `data-testid="model-engine-page"`.
  - Tabs: `data-testid="tab-discovery|tab-favorites|tab-collector"`.
  - Content: `data-testid="content-collector"`.
  - Cards: `data-testid^="model-card-"` and action buttons inside.
- Keep tests deterministic; guard optional flows with existence checks.

## Dev Server & Port

- Local dev server runs on `http://localhost:3570`.
- E2E should `page.goto('http://localhost:3570/<route>')`.
- Update any hard-coded `3000` → `3570` in tests.

## Playwright

- Browsers are required; install once locally or in CI:
  - `npx playwright install --with-deps`.
- Headless by default in CI; UI mode for debugging: `npm run test:e2e:ui`.

## Coverage Targets (initial)

- Lines: 60%+, Functions: 60%+, Branches: 50%+.
- Adjust per module as quality matures.