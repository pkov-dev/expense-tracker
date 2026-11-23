# API auth: Users module + JWT Auth module (register / login / refresh / logout)

## Context
The API (`apps/api`, NestJS 11 + Prisma 7) has no authentication yet. `User` in `schema.prisma` has only `email`/`name`. We need:
- a **Users module** holding a user repository (Prisma access) and a user service;
- an **Auth module** issuing JWTs, with **register** and **login** endpoints.

Decisions taken with the user: **access JWT + refresh token** (refresh stored hashed in DB, with `/auth/refresh` and `/auth/logout`), passwords hashed with **argon2**.

## 1. Data model — `apps/api/prisma/schema.prisma`
`User` changes:
- `name String` (now required)
- `passwordHash String @map("password_hash")`
- `lastLoginAt DateTime? @map("last_login_at")`
- relation `refreshTokens RefreshToken[]`

New model:
```prisma
model RefreshToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String    @map("token_hash")          // sha256 of the secret part
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")
  @@index([userId])
  @@map("refresh_tokens")
}
```
Migration: `pnpm db:migrate --name auth` (users table is expected to be empty in dev; required columns otherwise need a reset).

## 2. Shared schemas — `packages/shared/src/schemas/auth.ts` (+ export in `src/index.ts`)
- `registerSchema`: `name` (trim, 1–100), `email` (`z.email()`, trim + lowercase), `password` (8–128)
- `loginSchema`: `email`, `password` (min 1)
- `refreshTokenSchema`: `{ refreshToken: string }` (used by refresh & logout)
- types: `RegisterInput`, `LoginInput`, `RefreshTokenInput`
- DTOs: `UserDto { id, email, name, createdAt }`, `AuthResponseDto { accessToken, refreshToken, user: UserDto }`

## 3. Inter-module communication via CQRS (`@nestjs/cqrs`)
Modules do **not** import each other's services. `CqrsModule.forRoot()` is registered once in `AppModule`; each module exposes a public contract of commands/queries/events, and other modules talk to it only through `CommandBus` / `QueryBus` / `EventBus`.

- Contract classes live in the owning module under `<module>/cqrs/` and are re-exported from `<module>/index.ts` — the only file other modules may import from.
- Handlers (`@CommandHandler`, `@QueryHandler`, `@EventsHandler`) are registered as providers in the owning module and delegate to its service.
- Typing: commands/queries extend `Command<TResult>` / `Query<TResult>` (cqrs v11), so `commandBus.execute(new X())` returns the typed result.

Users contract (`apps/api/src/users/cqrs/`):
| Kind | Class | Result |
|---|---|---|
| Command | `CreateUserCommand(name, email, password)` | `User` (with hash — internal to API) |
| Query | `GetUserByEmailQuery(email)` | `User \| null` |
| Query | `GetUserByIdQuery(id)` | `User \| null` |

Auth events (`apps/api/src/common/events/`), consumed by Users:
| Event | Handler (in Users) |
|---|---|
| `UserLoggedInEvent(userId, at)` | `UpdateLastLoginHandler` → `usersService.updateLastLogin` |
| `UserRegisteredEvent(userId, email)` | published for future subscribers (no handler yet) |

To avoid a circular import, the events are defined in a neutral place: `apps/api/src/common/events/` (Auth publishes, Users subscribes; neither imports the other).

## 4. Users module — `apps/api/src/users/`
- `users.repository.ts` — `@Injectable()` wrapper over `PrismaService.user` (`findById`, `findByEmail`, `create`, `updateLastLogin`). Only place touching `prisma.user`.
- `users.service.ts` — business layer: `create({name,email,password})` hashes with `argon2.hash`, throws `ConflictException` on existing email (pre-check + catch Prisma `P2002`); `findByEmail`, `findById`, `updateLastLogin`, `toDto(user)` (never exposes `passwordHash`).
- `cqrs/` — commands, queries, their handlers, `UpdateLastLoginHandler` event handler.
- `users.module.ts` — provides repository, service and all handlers; **exports nothing** (access only through the buses).
- `index.ts` — re-exports the command/query classes and `toUserDto` mapper (pure function).

## 5. Auth module — `apps/api/src/auth/`
- `auth.module.ts` — does **not** import `UsersModule`; imports `JwtModule.registerAsync` (secret/TTL from `ConfigService`); registers `JwtAuthGuard` as global `APP_GUARD`. `AuthService` injects `CommandBus`, `QueryBus`, `EventBus`.
- `refresh-tokens.repository.ts` — Prisma access for `refreshToken` (create, findById, revoke, revokeAllForUser).
- `auth.service.ts`
  - `register(input)` → `commandBus.execute(new CreateUserCommand(...))` → publish `UserRegisteredEvent` → `issueTokens`
  - `login(input)` → `queryBus.execute(new GetUserByEmailQuery(email))`, `argon2.verify`; generic `UnauthorizedException('Invalid credentials')` for both unknown email and wrong password; publishes `UserLoggedInEvent` (Users updates `lastLoginAt`)
  - `me(userId)` → `GetUserByIdQuery` → `toUserDto`
  - `refresh(token)` → parse `"<id>.<secret>"`, load row, compare sha256 (`crypto.timingSafeEqual`), check not expired/revoked; **rotate** (revoke old, issue new). If a *revoked* token is presented → revoke all user's tokens (reuse detection) and 401.
  - `logout(token)` → revoke that refresh token (idempotent, 204).
  - `issueTokens(user)` → access JWT `{ sub: user.id, email }` via `JwtService.signAsync`; refresh = `${row.id}.${randomBytes(32).toString('base64url')}`, store sha256 of secret with `expiresAt`.
- `jwt-auth.guard.ts` — reads `Authorization: Bearer`, `JwtService.verifyAsync`, puts `{ id, email }` on `request.user`; skips routes marked `@Public()`. (No passport — just `@nestjs/jwt`.)
- `decorators/public.decorator.ts` (`SetMetadata`), `decorators/current-user.decorator.ts` (`createParamDecorator`), `types.ts` (`JwtPayload`, `AuthUser`).
- `auth.controller.ts` (`/api/auth`, all `@Public()` except `me`), bodies validated with existing `ZodValidationPipe` (`apps/api/src/common/zod-validation.pipe.ts`):
  - `POST /register` → 201 `AuthResponseDto`
  - `POST /login` → 200 `AuthResponseDto`
  - `POST /refresh` → 200 `AuthResponseDto`
  - `POST /logout` → 204
  - `GET /me` → `UserDto` (protected; demonstrates the guard)

Also: mark `HealthController` (`apps/api/src/health/health.controller.ts`) `@Public()`; add `CqrsModule.forRoot()`, `UsersModule`, `AuthModule` to `apps/api/src/app.module.ts`.

## 6. Config / deps
- `apps/api/.env.example` (+ local `.env`): `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL=15m`, `REFRESH_TOKEN_TTL_DAYS=30`.
- `pnpm --filter @expense-tracker/api add @nestjs/jwt @nestjs/cqrs argon2`
- `pnpm-workspace.yaml` → `allowBuilds: argon2: true`.
- Keep runtime class imports for DI in `apps/api` (no `import type` in constructors, per CLAUDE.md).
- Update CLAUDE.md architecture notes briefly: auth/global guard/`@Public`, new env vars, and the **CQRS rule** (modules communicate only via Command/Query/Event buses; import only from another module's `index.ts`).

## Verification
1. `pnpm db:up && pnpm db:migrate && pnpm db:generate`
2. `pnpm typecheck && pnpm lint`
3. `pnpm --filter @expense-tracker/api dev`, then curl:
   - `POST /api/auth/register` → 201 with tokens; repeat → 409; invalid body → 400
   - `POST /api/auth/login` correct → 200 and `users.last_login_at` set (event handler fired); wrong password → 401
   - `GET /api/auth/me` with Bearer → 200; without → 401
   - `POST /api/auth/refresh` → new pair; reuse the old refresh token → 401 and the new one is revoked too
   - `POST /api/auth/logout` → 204; refresh with it afterwards → 401
   - `GET /health` still 200 without token
