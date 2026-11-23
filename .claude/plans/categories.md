# Категории трат (Categories CRUD)

## Context
Авторизация готова (глобальный `JwtAuthGuard`, `@CurrentUser()`). Нужна сущность категории (id, name, color, icon, userId) и CRUD API для текущего пользователя. Модель `Category` уже есть в `schema.prisma` (id, name, color?, userId, `@@unique([userId, name])`), но без `icon`, и модуля в API нет. Решения: валидация — **Zod** (как во всём проекте, а не class-validator); `color` — обязательный HEX `#RRGGBB` с дефолтом, `icon` — опциональная строка (имя иконки, напр. lucide).

## 1. Prisma — `apps/api/prisma/schema.prisma`
```prisma
model Category {
  id     String  @id @default(uuid()) @db.Uuid
  name   String
  color  String  @default("#64748b") @db.Char(7)
  icon   String? @db.VarChar(50)
  ...  // userId, user, expenses, createdAt, updatedAt, @@unique([userId, name]) — без изменений
  @@index([userId])  // не нужен: покрыт @@unique([userId, name])
}
```
Миграция: `pnpm --filter @expense-tracker/api exec prisma migrate dev --name categories` (backfill существующих `color = NULL` через дефолт — в миграции добавить `UPDATE categories SET color = '#64748b' WHERE color IS NULL` перед `SET NOT NULL`, если Prisma не сделает сама), затем `pnpm db:generate`.

## 2. Shared — `packages/shared/src/schemas/category.ts` (+ экспорт в `src/index.ts`)
```ts
export const categoryColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/).transform(v => v.toLowerCase());
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: categoryColorSchema.optional(),
  icon: z.string().trim().min(1).max(50).nullable().optional(),
});
export const updateCategorySchema = createCategorySchema.partial()
  .refine(o => Object.keys(o).length > 0, 'At least one field is required');
export type CreateCategoryInput / UpdateCategoryInput = z.infer<...>;
export interface CategoryDto { id; name; color: string; icon: string | null; createdAt: string; updatedAt: string; }
```

## 3. API — `apps/api/src/categories/` (по образцу `src/users/`)
- `categories.repository.ts` — `CategoriesRepository` (инжектит `PrismaService`): `findAllByUser(userId)` (orderBy name), `findByIdForUser(id, userId)` (`findFirst`), `create(userId, data)`, `update(id, data)`, `delete(id)`.
- `categories.service.ts` — `CategoriesService`:
  - `create(userId, input)`; `findAll(userId)`; `update(userId, id, input)`; `remove(userId, id)`.
  - update/remove сначала `findByIdForUser` → `NotFoundException` если нет или чужая (не раскрываем существование чужих категорий).
  - P2002 (дубликат имени у пользователя) → `ConflictException('Category with this name already exists')` — тот же приём, что `UNIQUE_VIOLATION` в `src/users/users.service.ts`.
  - Удаление: `Expense.categoryId` уже `onDelete: SetNull` — траты остаются без категории.
- `category.mapper.ts` — `toCategoryDto(category): CategoryDto` (как `src/users/user.mapper.ts`).
- `categories.controller.ts` — `@Controller('categories')`, без `@Public()` → защищён глобальным `JwtAuthGuard`; `@CurrentUser() user: AuthUser` (`src/auth/decorators/current-user.decorator.ts`, `src/auth/types.ts`):
  - `POST /api/categories` — `@Body(new ZodValidationPipe(createCategorySchema))` → 201 `CategoryDto`
  - `GET /api/categories` → `CategoryDto[]`
  - `PATCH /api/categories/:id` — `@Param('id', ParseUUIDPipe)`, `ZodValidationPipe(updateCategorySchema)` → `CategoryDto`
  - `DELETE /api/categories/:id` — `ParseUUIDPipe`, `@HttpCode(204)`
- `categories.module.ts` — providers: repository, service; controllers: controller. Ничего не экспортирует (CQRS-правило).
- `index.ts` — публичный контракт модуля; пока экспортирует только `toCategoryDto` (CQRS-запросы, напр. `GetCategoryByIdQuery` для модуля трат, добавим, когда появится Expenses).
- Регистрация `CategoriesModule` в `src/app.module.ts`.

Импорт контроллера/сервиса — обычные (не `import type`) для Nest DI.

## 4. После утверждения
Скопировать план в `<repo>/.claude/plans/` (по сохранённому предпочтению).

## Чеклист задач
- [x] 0. Скопировать этот план в `<repo>/.claude/plans/categories.md`
- [x] 1. `schema.prisma`: `color` → `String @default("#64748b") @db.Char(7)`, добавить `icon String? @db.VarChar(50)`
- [x] 2. Миграция `categories` (+ backfill `color` при необходимости), `pnpm db:generate`
- [x] 3. `packages/shared/src/schemas/category.ts`: `createCategorySchema`, `updateCategorySchema`, типы, `CategoryDto`
- [x] 4. Экспорт из `packages/shared/src/index.ts`, сборка `shared`
- [x] 5. `categories/category.mapper.ts` — `toCategoryDto`
- [x] 6. `categories/categories.repository.ts`
- [x] 7. `categories/categories.service.ts` (404 для чужих/несуществующих, 409 на P2002)
- [x] 8. `categories/categories.controller.ts` (POST / GET / PATCH :id / DELETE :id, Zod + ParseUUIDPipe)
- [x] 9. `categories/categories.module.ts` + `categories/index.ts`
- [x] 10. Зарегистрировать `CategoriesModule` в `app.module.ts`
- [x] 11. `pnpm typecheck && pnpm lint`
- [x] 12. Ручная проверка curl-сценариев (см. Verification)
- [x] 13. Обновить CLAUDE.md (раздел Architecture: модуль Categories), если нужно

## Verification
1. `pnpm db:up && pnpm db:migrate && pnpm db:generate`
2. `pnpm typecheck && pnpm lint`
3. `pnpm --filter @expense-tracker/api dev`, затем curl:
   - register/login → взять `accessToken`
   - `GET /api/categories` без токена → 401
   - `POST` `{name:"Food",color:"#FF0000",icon:"utensils"}` → 201; повтор → 409; `{name:""}` / `color:"red"` → 400
   - `GET` → список; `PATCH /:id {name:"Groceries"}` → 200; `PATCH` с `{}` → 400; невалидный id → 400
   - от второго пользователя `PATCH/DELETE` чужой категории → 404
   - `DELETE /:id` → 204, затем `GET` — категории нет
