# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expense tracker monorepo: pnpm workspaces + Turborepo. Node >= 24, pnpm 11 (`engine-strict`).

- `apps/web` — Next.js 16 (App Router, `src/`), React 19, Tailwind CSS 4, shadcn/ui, structured per Feature-Sliced Design (see below). Port 3000.
- `apps/api` — NestJS 11 + Prisma 7 + PostgreSQL. Port 4000.
- `packages/shared` — Zod 4 schemas and DTO types used by both apps.
- `packages/eslint-config` — flat ESLint configs: `base`, `next`, `nest`.

## Commands

Run from the repo root (Turbo orchestrates per-package scripts):

```bash
pnpm dev | build | lint | typecheck | test   # all packages
pnpm format                              # Prettier (with tailwind plugin)
pnpm db:up / db:down                     # Postgres via docker-compose
pnpm db:generate                         # prisma generate (required before api build/typecheck)
pnpm db:migrate                          # prisma migrate dev
pnpm db:studio
```

Single package: `pnpm --filter @expense-tracker/<web|api|shared> <script>` or `pnpm turbo run <task> --filter=<pkg>`.
Add a shadcn component: `pnpm --filter @expense-tracker/web dlx shadcn@latest add <name>`.

Tests: Vitest in `shared`, `web` and `api` (`pnpm test`; `pnpm --filter @expense-tracker/<pkg> exec vitest` to watch). Test files are `*.test.ts` next to the code they cover and are excluded from the `shared`/`api` builds. The web config aliases `@/` and stubs `server-only` (it throws outside the react-server condition). Fix a bug → add the regression test first.

## Git workflow

One branch per feature or fix (`feat/…`, `fix/…`, `refactor/…`), never commit to `main` directly; work is merged through a pull request (GitHub CLI `gh` is installed). Commits follow Conventional Commits (`type(scope): subject`), are written in English, one logical change per commit. The remote uses SSH, which may not be set up on every machine; `gh auth setup-git` makes HTTPS pushes work.

## Architecture notes

- **Web architecture — Feature-Sliced Design (FSD)**: `apps/web/src` is organised in layers, top to bottom: `app` → `views` → `widgets` → `features` → `entities` → `shared`. A layer may import only from layers *below* it; slices of the same layer never import each other. Each slice is split into segments (`ui`, `model`, `api`, `lib`, `config`) and exposes a public API only through its `index.ts` — import from `@/features/login`, never from `@/features/login/ui/...`. `shared` has no slices, only segments (`shared/ui`, `shared/lib`, `shared/api`, `shared/config`).
  - `app` is Next's App Router and stays thin: `page.tsx` only re-exports a page from `views` (`export { LoginPage as default } from '@/views/login'`) plus `metadata`/layouts. The FSD "pages" layer is named `views` because `src/pages` is reserved by Next.
  - `views/<name>` composes a whole screen; `widgets/` — large reusable UI blocks; `features/<name>` — one user action (e.g. `login`, `register`: form `ui` + Server Action in `api`); `entities/<name>` — business objects and their state (e.g. `session`: httpOnly auth cookies).
  - shadcn/ui components live in `shared/ui` (`components.json` aliases: `ui`/`components` → `@/shared/ui`, `utils` → `@/shared/lib/utils`). After `shadcn add`, check generated imports (it once emitted `from "cn"` and added a bogus `cn` dependency).
  - **Auth on the web**: forms use react-hook-form + `zodResolver` with schemas from `@expense-tracker/shared`; submit goes to a Server Action that calls the API via `shared/api` `apiRequest`, then `createSession` (entities/session) stores `access_token`/`refresh_token` in httpOnly cookies and redirects to `/`. UI copy is Russian.
  - **Server data in FSD slices**: a slice's `index.ts` must stay client-safe (client components import it). Code that reads cookies (`server-only`) is exported from a separate `<slice>/server.ts` (`import { getCategories } from '@/entities/category/server'`), never from `index.ts`. The same holds outside entities: `authorizedRequest` is `@/shared/api/server`, and `entities/session` is server-only as a whole, so it has only `@/entities/session/server` and no `index.ts`. Don't deep-import into a slice (`…/model/…`); add it to the slice's entry point instead.
  - **Authenticated app shell**: routes live in `app/(main)/` (layout renders `widgets/app-shell`: sidebar with menu + user menu, mobile drawer). `/` = transactions (`views/transactions`: month summary, URL-driven filters `categoryId`/`from`/`to`/`page`, table with 10 rows per page), `/categories` = categories CRUD. Mutations are Server Actions in `features/*/api` calling `authorizedRequest` and then `revalidatePath`; they return `FormState` (`undefined` = success). Don't wrap `authorizedRequest` in a `catch` that swallows non-`ApiError` errors — a dead session throws a Next `redirect`.
  - **Route protection & token refresh**: `src/proxy.ts` (Next 16 replacement for middleware). No cookies → `/auth/login`; `/auth/*` with a refresh cookie → `/`; access cookie missing (it expires 30 s before the JWT) but refresh cookie present → proxy calls `/api/auth/refresh` and rewrites both cookies for the current request and the browser. Only a 400/401/403 answer ends the session (cookies cleared + `/auth/login`); an unreachable API, a timeout or a 5xx yields a bare `503` + `Retry-After` and leaves the cookies alone. Server Components can't delete cookies, so a 401 from the API redirects to the `GET /auth/signout` route handler; it revokes the refresh token in the API (`endSession`) and refuses requests whose `Sec-Fetch-Site` is not `same-origin`/`none`. `apiRequest` has a 10 s timeout and reports network failures as `ApiError` 503/504. Paths come from `ROUTES` (`shared/config`); don't hardcode them in entities/features.
  - **UI building blocks**: `shared/ui/confirm-delete-dialog` (delete confirmation), `shared/ui/row-actions-menu` (⋯ Edit/Delete), `toFormError` in `shared/api` (maps `ApiError` status → message, rethrows everything else). The expenses table owns *one* edit and *one* delete dialog (`ExpenseActionsProvider`) — don't mount dialogs per row.
  - shadcn files in `shared/ui` were edited locally: `pagination.tsx` uses `next/link` and Russian labels; `use-mobile.ts` uses `useSyncExternalStore`; `SidebarMenuSkeleton` has a fixed width (React Compiler lint rules reject the generated versions). Re-check these after `shadcn add --overwrite`. `shadcn add` also adds `from "cn"` imports and a `cn` dependency every time — always fix them (see above).
- **Env files are per-app**: root `.env` only feeds docker-compose; `apps/api/.env` holds `DATABASE_URL`, `API_PORT`, `WEB_ORIGIN`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `REFRESH_TOKEN_TTL_DAYS`; `apps/web/.env.local` holds `NEXT_PUBLIC_API_URL`. Copy from the `.env.example` next to each.
- **Prisma 7 specifics**: the DB URL lives in `apps/api/prisma.config.ts` (not in `schema.prisma`). The client is generated with the `prisma-client` generator (CJS) into `apps/api/src/generated/prisma` (gitignored) and imported from `../generated/prisma/client`. `PrismaService` extends it and connects via `@prisma/adapter-pg`. `PrismaModule` is `@Global`, so inject `PrismaService` anywhere without importing the module.
- **API routing**: global prefix `/api` for all routes except `GET /health` (pings the DB). CORS allows `WEB_ORIGIN`.
- **Auth**: `AuthModule` (`/api/auth/{register,login,refresh,logout,me}`) issues an access JWT (`@nestjs/jwt`) plus a rotating refresh token (`<id>.<secret>`, sha256 of the secret stored in `refresh_tokens`; reuse of a revoked token revokes all of the user's tokens). Parallel refreshes are tolerated: a token that was *rotated* (`rotated_at`, not logged out) may be replayed for 10 s (`REFRESH_REUSE_GRACE_MS`) and is answered with a fresh pair; after that, or after logout, a replay is theft. Killing the family also clears `rotated_at`, so the grace check can't revive it. Passwords are hashed with argon2. `JwtAuthGuard` is a global `APP_GUARD`: every route requires a Bearer token unless marked `@Public()`; use `@CurrentUser()` to get `{ id, email }`.
- **CQRS between modules**: modules never import each other's services or modules. They talk only through `CommandBus` / `QueryBus` / `EventBus` (`@nestjs/cqrs`, `CqrsModule.forRoot()` in `AppModule`). A module's public contract (commands/queries + pure helpers) is re-exported from its `index.ts` (e.g. `src/users/index.ts`); other modules may import only from there. Events shared by several modules live in `src/common/events/`. Handlers are providers of the owning module.
- **Categories**: `CategoriesModule` (`/api/categories`: `POST`, `GET`, `PATCH :id`, `DELETE :id`) is scoped to the current user; foreign or missing ids return 404, a duplicate name per user returns 409. `Category` has `name`, `color` (HEX `#rrggbb`, default `#64748b`), optional `icon` (one of `CATEGORY_ICON_NAMES` from `shared` — the API validates against it and the web icon map `Record<CategoryIconName, LucideIcon>` must have an entry for each; never index an icon map with a raw string); deleting a category sets `Expense.categoryId` to null. Public contract (`src/categories/index.ts`) exposes `GetCategoryByIdQuery(id, userId)`, which `ExpensesModule` uses to verify that a category belongs to the user.
- **Expenses**: `ExpensesModule` (`/api/expenses`: `GET` paginated list, `GET summary`, `POST`, `PATCH :id`, `DELETE :id`) is scoped to the current user; foreign or missing ids → 404, foreign `categoryId` on create/update → 400. List query (`listExpensesQuerySchema`): `page` (default 1), `pageSize` (default 10, max 100), `categoryId`, `from`/`to` (inclusive `YYYY-MM-DD`), ordered by `date desc, createdAt desc`; response is `PaginatedDto<ExpenseDto>` (`items`, `total`, `page`, `pageSize`, `totalPages`, always ≥ 1). `GET /summary?from&to` returns `ExpenseSummaryDto` (count, per-currency totals, per-category+currency sums) — amounts are always `"123.00"` strings, never summed across currencies. `description`/`categoryId` are nullable so PATCH can clear them. `amount` is a JSON number or a plain decimal string (no `z.coerce`), `currency` is three letters. Repositories scope `update`/`delete` by `userId` in the `where`, not only by a prior lookup.
- **Validation**: request bodies are validated with Zod schemas from `@expense-tracker/shared` via `ZodValidationPipe` (`apps/api/src/common/zod-validation.pipe.ts`), e.g. `@Body(new ZodValidationPipe(createExpenseSchema))`. Not class-validator. Define new request schemas in `shared`, not in the API.
- **`shared` package wiring**: `exports.types` points at `src/` (types resolve without a build), but runtime `default` is `dist/` (CJS, compiled by `tsc`). Turbo makes `dev`/`build`/`lint`/`typecheck` depend on `^build`, so `shared` is built first. Next also lists it in `transpilePackages`.
- **Data model** (`apps/api/prisma/schema.prisma`): `User` → `Category`, `Expense`. Money is `Decimal(12,2)` + `Char(3)` currency; `date` is a `@db.Date` (in DTOs: `amount` is a string, `date` is `YYYY-MM-DD`). Tables/columns use snake_case via `@@map`/`@map`.
- **TypeScript**: shared strict base in `tsconfig.base.json` (incl. `noUncheckedIndexedAccess`). API uses `NodeNext` + decorators; web uses `bundler` resolution with `@/*` → `src/*`.
- **ESLint**: `consistent-type-imports` is on everywhere except the Nest config — Nest DI needs runtime class imports in constructors, so don't convert them to `import type` in `apps/api`.
- **pnpm build scripts**: pnpm 11 blocks dependency install scripts; allowed packages are listed under `allowBuilds` in `pnpm-workspace.yaml` — add new ones there if install warns.
