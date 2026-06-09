# Eagle Bank

A responsive, accessible banking mock-up.

---

## Quick start

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200`. The application will hot-reload on any source file change.

**Test credentials**

```
Email:    jane@eaglebank.com
Password: Password123!
```

```
Email:    john@eaglebank.com
Password: Password123!
```

---

## Running tests

```bash
ng test --watch=false
```

The test runner is Vitest (configured via `@angular/build:unit-test`). To run in watch mode omit the flag:

```bash
ng test
```

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Angular 21 (standalone components, no NgModules) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (CSS-first configuration) |
| State | Angular Signals + `resource()` |
| Testing | Vitest via `@angular/build:unit-test` |
| Icons | Google Material Icons (font) |
| Locale | en-GB (`LOCALE_ID`, `CurrencyPipe`, `DatePipe`) |

---

## Architecture decisions

### Standalone components only
No `NgModule` declarations are used anywhere. Every component, directive and pipe is `standalone: true`. This reduces boilerplate and makes each component's dependencies explicit at a glance.

### Angular Signals and `resource()`
All reactive state — auth user, loading flags, selected items — is held in Angular Signals rather than RxJS BehaviorSubjects. Data fetching uses `resource()`, which auto-tracks signal reads inside its `loader` function so any signal change (pagination, sort order) automatically triggers a reload without manual subscription management.

### `ChangeDetectionStrategy.OnPush` everywhere
Every component declares `changeDetection: ChangeDetectionStrategy.OnPush`. Combined with Signals, Angular's change detection only runs when a signal's value actually changes, minimising unnecessary DOM diffing.

### Mock API interceptor
A single `mockApiInterceptor` (registered in `app.config.ts`) intercepts all `/api/*` requests and returns in-memory responses with a simulated 500 ms delay. This means the network layer is exercised exactly as it would be against a real API, including authentication headers and error codes. Swapping to a real backend requires only removing the interceptor.

### Interceptor order matters
`authInterceptor` must run before `mockApiInterceptor`. The auth interceptor attaches the `Authorization: Bearer` header; the mock interceptor then reads that header to authenticate the request.

### Lazy loaded routes
Every feature route uses `loadComponent` so each feature module is only downloaded when the user first navigates to it. The shell (`ShellComponent`) is the only eagerly loaded component in the authenticated section.

---

## Folder structure

```
src/app/
├── core/                  # Singleton, app-wide concerns
│   ├── auth/              # AuthService, authGuard, publicOnlyGuard, authInterceptor
│   ├── error/             # GlobalErrorHandler
│   ├── layout/            # ShellComponent (sidebar + mobile drawer)
│   └── mock/              # Mock API interceptor + seed data
│
├── features/              # One folder per page/feature
│   ├── auth/              # Login, Register, AuthLayout
│   ├── dashboard/         # Dashboard component + DashboardService
│   ├── accounts/          # Accounts list, AccountDetail, AccountsService
│   ├── transactions/      # Transactions list + TransactionsService
│   ├── profile/           # Profile view + edit modals
│   └── not-found/         # 404 fallback
│
└── shared/
    ├── components/        # Design-system primitives (see below)
    └── models/            # TypeScript interfaces (User, Account, Transaction, etc.)
```

### Shared component library

| Component | Purpose |
|---|---|
| `eb-button` | All button variants with loading spinner state |
| `eb-input` | CVA-based input with floating validation messages |
| `eb-alert` | Inline status messages (error, warning, info, success) |
| `eb-card` | Surface container with consistent padding and shadow |
| `eb-skeleton` | Animated placeholder for loading states |
| `eb-badge` | Status pill (success, error, warning, muted, info) |
| `eb-table` | Transaction table with optional clickable rows |
| `eb-modal` | Accessible modal with named `ng-content` slots |
| `app-page-header` | Page title + subtitle block |
| `eb-transaction-detail` | Reusable modal body for transaction detail |

---

## State management

Authentication state lives in `AuthService` as three signals:

- `user()` — the currently authenticated user or null
- `isLoading()` — true while session hydration is in progress
- `isAuthenticated()` — computed from `user()`

On startup, `hydrateSession()` checks `localStorage` for a token and calls `GET /api/auth/me` to restore the session. The `authGuard` waits for `isLoading()` to settle before making a routing decision, preventing a flash-redirect to `/login` on hard refresh.

Feature-level state (sort order, current page, selected transaction) lives in local component signals. There is no shared global store — features communicate only through the router or through `AuthService`.

---

## Design system

Tailwind v4's CSS-first configuration is used. All design tokens (colours, shadows, border radii, animation keyframes) are declared in a single `@theme` block in `src/styles.scss`. There is no `tailwind.config.js`. This means the token values are available as CSS custom properties throughout the application and can be read by JavaScript if needed.

Token categories:

- Brand colours (`--color-primary-*`)
- Surface colours (`--color-surface`, `--color-surface-muted`, `--color-surface-subtle`)
- Semantic status colours (`--color-success`, `--color-error`, `--color-warning`)
- Text hierarchy (`--color-text-primary`, `--color-text-secondary`, `--color-text-muted`)
- Border, shadow, border-radius, and animation tokens

---

## Performance considerations

| Technique | Where applied |
|---|---|
| Lazy route splitting | All feature routes via `loadComponent` |
| OnPush change detection | Every component |
| Angular Signals | Fine-grained reactivity without zone.js overhead |
| `resource()` reactive loader | Automatic re-fetch on signal change, no manual subscriptions |
| View Transitions API | `withViewTransitions()` for native animated route changes |
| `ChangeDetectionStrategy.OnPush` | Prevents re-renders unless signal values change |

---

## Accessibility considerations

- All interactive elements are keyboard-reachable with visible focus styles
- Icons from Material Icons are `aria-hidden="true"` throughout; meaningful labels are provided via text or `aria-label`
- Modal uses `role="dialog"`, `aria-modal="true"`, and `aria-label`; the Escape key closes it
- Form inputs use `<label>` elements with explicit `for` / `id` pairing via the CVA `eb-input` component
- Error messages are associated with their input via `aria-describedby`
- The application is registered with the `en-GB` locale for correct date, currency, and number formatting
- Semantic HTML elements are used throughout (`<nav>`, `<main>`, `<header>`, `<section>`, `<button>` vs `<div>`)

---

## Testing strategy

Tests use Vitest running inside Angular's build pipeline. The suite covers the critical paths identified in the requirements:

| File | Tests | Coverage area |
|---|---|---|
| `app.spec.ts` | 2 | App bootstrap, router-outlet |
| `auth.service.spec.ts` | 10 | login, register, logout, updateProfile, hydrateSession |
| `auth.guard.spec.ts` | 12 | sanitizeRedirect, authGuard, publicOnlyGuard |
| `mock-api.interceptor.spec.ts` | 9 | All authenticated and unauthenticated endpoint paths |
| `accounts.service.spec.ts` | 7 | getAccounts, getAccount, getTransactions with all query params |
| `login.component.spec.ts` | 6 | Render, validation, submit, server error |

**46 tests, all passing.**

Notable testing decisions:

- `fakeAsync` / `tick` are not used — Angular 21 is zoneless and this helper requires zone.js. HTTP tests are synchronous via `HttpTestingController.flush()`.
- The mock interceptor is tested by calling the interceptor function directly (no `TestBed` or `HttpClient` required). This avoids lifecycle issues caused by `provideHttpClientTesting()` interfering with RxJS `delay()` operators.
- A `StubComponent` and wildcard route (`{ path: '**', component: StubComponent }`) are provided in specs that involve router navigation to suppress unhandled navigation rejections.

---

## Known gaps and future considerations

**Not implemented**
- Quick actions section on the dashboard
- Date range filter controls in the Transactions UI (the service and mock endpoint support `from`/`to` parameters — the UI wiring was not added)
- Retry button on error alert states
- The 404 page is a placeholder component

**Intentionally omitted**
- Storybook (listed as a bonus item in the requirements; not prioritised given time)
- E2E tests

**Things that would improve the application further**
- Dark mode: the CSS token setup makes this straightforward — a second `@layer` block with overrides and a class toggle on `<html>` is all that is needed
- Toast / snackbar notification system for transient feedback (successful save, session expiry warning)
- Spending breakdown chart on the dashboard (the transaction data has `category` and `amount` fields ready to aggregate)
- Date range picker component wired to the Transactions page
- Skip-navigation link (`<a href="#main-content">`) for keyboard and screen reader users
- ARIA live regions on loading state changes
- Storybook catalogue of shared components
- Playwright E2E suite covering the full login-to-logout flow

---

## Building for production

```bash
ng build
```

Output is written to `dist/`. The build applies tree-shaking, code splitting (one chunk per lazy route), and asset optimisation by default.

