# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **bun** (`bun 1.3.11`, Node `24.14.1` — see `.tool-versions`).

- `bun install` — install dependencies
- `bun run dev` — start dev server (custom Express server at `server.mjs`, Vite middleware mode, HMR) on `http://localhost:3000`
- `bun run build` — production build (`node ./build.mjs`)
- `bun run start` — run production server (`NODE_ENV=production node ./server.mjs`)
- `bun run lint` / `bun run lint:fix` — ESLint over `app/` and `lib/`
- `bun run typecheck` — runs `react-router typegen` then `tsc`
- `bun run format` / `bun run format:check` — Prettier
- `bun run check` — format + lint + typecheck, run this before considering a change done

There is no test suite/framework configured in this repo (no `test` script, no test runner dependency).

Git hooks are managed by `lefthook` (`lefthook.yml`): on pre-commit, staged `*.{js,jsx,ts,tsx}` files are auto-fixed with ESLint and staged `*.{js,jsx,ts,tsx,json}` are formatted with Prettier.

## Architecture

Looply Portal is a **React Router v7** (framework mode, SSR enabled — `react-router.config.ts` has `ssr: true`) app served by a custom Express server (`server.mjs`), not `react-router-serve`. The server wires up `helmet` CSP (with a per-request nonce in `res.locals.cspNonce`), `compression`, `morgan` logging, and `express-rate-limit`, and delegates rendering to `@react-router/express`'s `createRequestHandler`.

### Routing

Routes are declared explicitly in `app/routes.ts` using `@react-router/dev/routes` (`route`/`index`/`layout`) — this is **not** flat-file routing despite `remix-flat-routes` being a dependency. Each resource (contacts, contact-lists, waiting-lists, contact-interactions, campaigns) follows the same nested shape under a shared `layouts/private.layout.tsx`:

```
routes/main/<resource>/
  layout.tsx           # resource-level layout/outlet
  index.tsx             # list page
  new.tsx                # create page
  edit.tsx               # edit page (:id/edit)
  detail/
    layout.tsx           # detail outlet for :id
    index.tsx             # detail overview
    overview.tsx          # sub-tab under detail
```

When adding a new resource route, mirror an existing one (e.g. `app/routes/main/contacts/`) and register it in `app/routes.ts`.

### Data layer (`app/resources/`)

Each resource has a matching pair of directories:

- `resources/queries/<resource>/` — `*.queries.ts` (raw `fetchApi` calls), `*.type.ts` (TS types + `*QueryConfig`/`*QueryParams`), `*.schema.ts` (Zod schema + default form values), `*.utils.ts`
- `resources/hooks/<resource>/` — React Query hooks (`use-<resource>.ts`) built on top of the queries: `use<Resource>s` (list), `use<Resource>Detail`, `useCreate<Resource>`, `useUpdate<Resource>`, `useDelete<Resource>`, plus a `<resource>QueryKeys` object for cache keys

Hooks follow a consistent shape: mutations invalidate/update the relevant `queryKeys` on success and fire toast notifications (`toast` from `tessera-ui/components`) on both success and error; queries require `config.token` and are `enabled` only when a token is present.

All HTTP calls go through `fetchApi(endpoint, token, node_env, options)` in `app/libraries/fetch.ts`. It:
- attaches `Authorization: Bearer <token>` when a token is given
- serializes `params`/`pagination` onto the URL
- logs an equivalent `curl` command via `curl-generator` when `node_env === 'development'`
- throws `TokenExpiredError` (401) or `UnauthorizedError` (403) as typed errors, otherwise a generic `Error` with a JSON-stringified `{ status, error }` message

Pages get `apiUrl`/`nodeEnv` from a route `loader()` reading `process.env`, and get the auth `token` from `useApp()` — imported from the shared **`tessera-ui`** package (a git dependency at `github.com/tesserahq/tessera-ui`), not a local context. List pages additionally use `ensureCanonicalPagination` (`app/utils/helpers/pagination.helper`) in their loader to normalize `page`/`size` query params.

### UI layer

- `app/modules/shadcn/ui/` — shadcn/ui components (aliased as `@shadcn/*` → `app/modules/shadcn/*`); `components.json` governs the shadcn config (neutral base color, no RSC, Lucide icons)
- `app/components/` — app-specific composed components, notably `crud-forms/` (shared create/edit form components per resource) and `data-table/` (the paginated table used by all list pages)
- `tessera-ui` (external package) supplies cross-app primitives: `useApp`, `AuthProvider`, `Toaster`/`toast`
- Path aliases (`tsconfig.json`): `@/*` → `app/*`, `@shadcn/*` → `app/modules/shadcn/*`

### Cross-cutting modules (`app/modules/`)

- `react-query/` — `QueryClient` config and `ReactQueryProvider` wrapping the app in `root.tsx`
- `i18n/` — `remix-i18next`-based i18n; `i18n.server.ts` (server-side detection) + `locales/en.ts`, `locales/es.ts`
- `shadcn/` — see above

### Auth & security

- Auth0 (OAuth2/OIDC) via `@auth0/auth0-react`, wired through `tessera-ui`'s `AuthProvider` in `root.tsx`
- CSRF protection via `remix-utils/csrf` (`AuthenticityTokenProvider` in `root.tsx`, server helper in `app/utils/cookies/csrf.server.ts`)
- CSP nonce plumbed from `server.mjs` → `useNonce()` for inline scripts/styles

### Environment variables

See `.env.example`. Key ones used in route loaders: `API_URL`, `NODE_ENV`, plus `AUTH0_DOMAIN`/`AUTH0_CLIENT_ID`/`AUTH0_AUDIENCE`/`AUTH0_ORGANIZATION_ID`, `HOST_URL`, `SESSION_SECRET`, and per-service host URLs (`IDENTIES_*`, `SENDLY_*`, `VAULTA_*`, etc.) for the wider Tessera product suite.

## Code style notes

- ESLint enforces `@typescript-eslint/no-explicit-any: error` — avoid `any` outside of narrowly-scoped, justified exceptions (e.g. `fetch.ts` has an explicit eslint-disable at the top for its header-building code)
- Imports are sorted by `@trivago/prettier-plugin-sort-imports` (see `prettier.config.mjs`) — let Prettier own import ordering rather than hand-arranging it
- Prefer React Query hooks (`resources/hooks/<resource>`) over ad-hoc `useEffect` + `fetchApi` for new pages; the direct-`fetchApi` pattern still exists in a few older detail pages but is being migrated away from
- `.cursor/rules/*.mdc` contains generator-style templates for create/list/detail pages — useful as scaffolding references, but they predate the migration off Remix (`@remix-run/react`, `@/context/AppContext`) to React Router v7 and `tessera-ui`'s `useApp`; follow the actual patterns in `app/routes/main/contacts/` over the `.mdc` examples where they conflict
