# Главный экран: транзакции, категории, профиль

## Context
Авторизация и CRUD категорий в API готовы, но на вебе после входа — заглушка `app/page.tsx`. Нужен главный экран трекера: сайдбар с меню (Транзакции / Категории) и профилем пользователя, список транзакций с пагинацией по 10, сводка за месяц, фильтры. Решения пользователя: **полный CRUD транзакций**, **полный CRUD UI категорий**, сводка за месяц, фильтры (категория + период), мобильный сайдбар.

Пробелы, которые закрываем попутно:
- В API **нет модуля расходов** — делаем `ExpensesModule` (CRUD + пагинация + summary).
- На вебе **нет защиты маршрутов и refresh токена** (access живёт 15 мин) → `src/proxy.ts` (Next 16).
- Нет «авторизованного» серверного запроса к API → `authorizedRequest` в `shared/api`.

## 1. Shared — `packages/shared/src/schemas/`
- **`pagination.ts`** (новый, экспорт в `index.ts`):
  ```ts
  export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  });
  export interface PaginatedDto<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number }
  ```
- **`expense.ts`**:
  - `amount`: добавить `.max(9_999_999_999.99)` (Decimal(12,2)); `description` и `categoryId` → `.nullable().optional()` (чтобы в PATCH можно было снять категорию/описание).
  - `updateExpenseSchema = createExpenseSchema.partial().refine(non-empty)` — как `updateCategorySchema`.
  - `listExpensesQuerySchema = paginationQuerySchema.extend({ categoryId: z.uuid().optional(), from: z.iso.date().optional(), to: z.iso.date().optional() }).refine(from <= to)`.
  - `expenseSummaryQuerySchema = z.object({ from: z.iso.date(), to: z.iso.date() })`.
  - `ExpenseSummaryDto { count: number; totals: { currency; amount: string }[]; byCategory: { categoryId: string | null; currency; amount: string; count: number }[] }`.
  - Типы `ListExpensesQuery`, `ExpenseSummaryQuery` через `z.infer`.

## 2. API
### Categories — CQRS-запрос для модуля расходов
- `src/categories/cqrs/get-category-by-id.query.ts` — `GetCategoryByIdQuery(id, userId) extends Query<Category | null>`; handler в `cqrs/handlers.ts` → `CategoriesRepository.findByIdForUser`; добавить handler в providers `CategoriesModule`; экспортировать query из `src/categories/index.ts`. Образец — `src/users/cqrs/`.

### Expenses — `src/expenses/` (по образцу `src/categories/`)
- `expenses.repository.ts`: `findPageByUser(userId, filters, skip, take)` через `prisma.$transaction([findMany, count])`, `orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]`, фильтры `categoryId`, `date: { gte, lte }`; `findByIdForUser`, `create`, `update`, `delete`; `summary(userId, from, to)` — два `groupBy` (`['currency']` и `['categoryId','currency']`, `_sum.amount`, `_count`).
- `expenses.service.ts`: `list` (считает `totalPages`), `summary`, `create`/`update`/`remove`. Перед create/update, если передан `categoryId` → `queryBus.execute(new GetCategoryByIdQuery(...))`, нет → `BadRequestException('Category not found')`. update/remove чужой/несуществующей траты → 404 (как `getOwned` в `categories.service.ts`). `date` → `new Date(input.date)`.
- `expense.mapper.ts`: `toExpenseDto` — `amount.toFixed(2)`, `date.toISOString().slice(0, 10)`.
- `expenses.controller.ts` (`@Controller('expenses')`, защищён глобальным guard):
  - `GET /api/expenses` — `@Query(new ZodValidationPipe(listExpensesQuerySchema))` → `PaginatedDto<ExpenseDto>`
  - `GET /api/expenses/summary` — `@Query(new ZodValidationPipe(expenseSummaryQuerySchema))` → `ExpenseSummaryDto`
  - `POST`, `PATCH :id` (`ParseUUIDPipe`), `DELETE :id` (204)
- `expenses.module.ts` (ничего не экспортирует), `index.ts` (`toExpenseDto`), регистрация в `src/app.module.ts`.

## 3. Web — сессия и инфраструктура
- **`shared/config/session.ts`**: перенести `ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`, TTL refresh из `entities/session/model/session.ts` (shared не может импортировать entities); `entities/session` их реэкспортирует — существующие импорты не ломаются. Плюс `shared/config/currencies.ts` (`RUB`, `USD`, `EUR`, …, дефолт `RUB`).
- **`shared/api/client.ts`**: в `apiRequest` добавить опцию `query?: Record<string, string | number | undefined>` (пустые отбрасываются).
- **`shared/api/authorized-request.ts`** (`server-only`): читает access-cookie, вызывает `apiRequest`; на `ApiError` 401 → `redirect('/auth/signout')`.
- **`app/auth/signout/route.ts`** (GET): `destroySession()` + redirect `/auth/login`. Нужен, т.к. RSC не может удалять cookies, а без очистки proxy зациклит `/auth/login → /`.
- **`entities/session`**: `cookieOptions()` (вынести `base` из `createSession`), access-cookie `maxAge = ttl - 30s` (cookie исчезает раньше токена → refresh до 401); `getRefreshToken()`; `refreshTokens(refreshToken)` — чистый вызов `/api/auth/refresh` для proxy.
- **`src/proxy.ts`** (Next 16, Node runtime), matcher исключает `_next/*`, статику, `/terms`, `/privacy`, `/auth/signout`:
  - `/auth/*` + есть refresh-cookie → redirect `/`.
  - защищённый путь без обоих cookies → redirect `/auth/login`.
  - нет access, есть refresh → refresh; успех → новые cookies в `request.cookies` (для RSC этого запроса) и в `response.cookies`; ошибка → удалить cookies, redirect `/auth/login`.
  - ⚠️ Известный риск: параллельные запросы в момент истечения access могут прислать один refresh дважды → сработает reuse-detection и разлогинит. В этой задаче не решаем; при проявлении — grace-окно на API.
- **shadcn**: `sidebar` (притянет sheet, tooltip, skeleton, `use-mobile` → `shared/lib/hooks`), `avatar`, `dropdown-menu`, `table`, `pagination`, `dialog`, `alert-dialog`, `select`, `badge`. После `add` проверить импорты (известный баг с `from "cn"`).
- **`shared/lib/format.ts`**: `formatMoney(amount, currency)` (`Intl.NumberFormat('ru-RU', { style: 'currency' })`), `formatDate('YYYY-MM-DD')`.

## 4. Web — FSD-слои
**Маршруты** (route group, старый `app/page.tsx` удалить):
- `app/(main)/layout.tsx` → `<AppShell>{children}</AppShell>`
- `app/(main)/page.tsx` → `export { TransactionsPage as default } from '@/views/transactions'` + metadata
- `app/(main)/categories/page.tsx` → `CategoriesPage`

**entities**
- `user`: `getCurrentUser()` (`/api/auth/me`, обёрнут в React `cache`), `UserAvatar` (инициалы).
- `category`: `getCategories()` (cache), `CategoryBadge` (цветная точка + `DynamicIcon` из `lucide-react/dynamic` + имя), `config/icons.ts` (≈16 lucide-иконок для выбора), `config/colors.ts` (палитра пресетов).
- `expense`: `getExpenses(query)`, `getExpenseSummary(from, to)`, `lib/parse-expense-filters.ts` (searchParams → `listExpensesQuerySchema.safeParse`, при ошибке — дефолты), `lib/current-month.ts`.

**features** (Server Action + UI; после мутации `revalidatePath`; ошибки — `FormState`, тексты на русском)
- `logout`: action (`/api/auth/logout` c refresh, `destroySession`, redirect `/auth/login`) + `LogoutMenuItem`.
- `expense-form`: `ExpenseFormDialog` (mode create/edit; RHF + `zodResolver(createExpenseSchema)`; поля: сумма, валюта, дата (default сегодня), категория (select, «Без категории»), описание); экспорт `CreateExpenseButton`, `EditExpenseDialog`; actions `createExpenseAction`, `updateExpenseAction(id, input)`.
- `delete-expense`: `AlertDialog` подтверждения + action.
- `category-form`: `CategoryFormDialog` create/edit (имя, цвет — свотчи + `<input type="color">`, иконка — сетка из `entities/category/config/icons`); 409 → «Категория с таким именем уже есть».
- `delete-category`: подтверждение («траты останутся без категории») + action.
- `filter-expenses`: client-компонент — select категории, даты от/до, «Сбросить»; пишет в URL через `useRouter().replace`, сбрасывая `page`.

**widgets**
- `app-shell`: async server component — `getCurrentUser()`, `SidebarProvider` + `AppSidebar` + `SidebarInset` с header (`SidebarTrigger` для мобильных + заголовок).
- `app-sidebar`: лого, nav (`config/nav.ts`: Транзакции `/`, Категории `/categories`; активный пункт через `usePathname`), footer — `UserMenu` (аватар, имя, email, dropdown → «Выйти»). `collapsible="icon"` на десктопе, sheet на мобильных.
- `expense-summary`: карточки за текущий месяц — сумма по каждой валюте, кол-во транзакций, топ-5 категорий с цветной полосой доли.
- `expenses-table`: таблица (дата, описание, категория-бейдж, сумма справа), меню строки (Редактировать / Удалить), empty state с CTA, пагинация (`Link`'и, сохраняющие фильтры; «Страница N из M», «Показано X–Y из Z»). На мобильных — компактный список вместо таблицы.
- `categories-list`: строки с цветом/иконкой/именем, меню (Редактировать / Удалить), empty state.

**views**
- `transactions`: `TransactionsPage({ searchParams })` (Promise в Next 16) — параллельно `Promise.all` (expenses, summary, categories); если `page > totalPages` → redirect на последнюю. Композиция: заголовок + `CreateExpenseButton`, `ExpenseSummary`, `FilterExpenses`, `ExpensesTable`.
- `categories`: заголовок + создать, `CategoriesList`.

## Verification
1. `pnpm db:up && pnpm db:generate`, `pnpm --filter @expense-tracker/shared build`, `pnpm typecheck && pnpm lint`.
2. API (curl с Bearer): создать 2 категории и ~25 трат; `GET /api/expenses?page=3` → 5 items, `totalPages: 3`; фильтр `categoryId`/`from`/`to`; `pageSize=1000` → 400; чужой `categoryId` в POST → 400; PATCH/DELETE чужой траты → 404; `GET /api/expenses/summary?from=…&to=…` — суммы совпадают.
3. Web (`pnpm dev`): без cookies `/` → `/auth/login`; после входа — сайдбар, профиль, сводка, таблица по 10, пагинация сохраняет фильтры; создать/изменить/удалить трату и категорию — список и сводка обновляются; удалённая категория → трата «Без категории»; узкий экран → сайдбар в выезжающем меню; удалить `access_token` cookie в DevTools → перезагрузка не разлогинивает (proxy обновил токен); «Выйти» → `/auth/login`, `/` снова недоступна.

## Чеклист задач
- [x] 0. Скопировать план в `<repo>/.claude/plans/dashboard.md`
- [x] 1. Shared: `pagination.ts`, правки `expense.ts` (nullable, list/summary схемы, `ExpenseSummaryDto`), экспорт, сборка
- [x] 2. API: `GetCategoryByIdQuery` + handler + экспорт из `categories/index.ts`
- [x] 3. API: `ExpensesModule` (repository, service, mapper, controller, module, index), регистрация в `AppModule`
- [x] 4. API: проверка curl'ом (п. 2 Verification)
- [x] 5. Web: `shared/config/session.ts` + `currencies.ts`, `apiRequest` `query`, `authorizedRequest`, `shared/lib/format.ts`
- [x] 6. Web: `entities/session` (cookieOptions, maxAge-30s, refresh), `src/proxy.ts`, `app/auth/signout/route.ts`
- [x] 7. Web: `shadcn add` компонентов, проверка импортов
- [x] 8. Web: entities `user`, `category`, `expense`
- [x] 9. Web: features `logout`, `expense-form`, `delete-expense`, `category-form`, `delete-category`, `filter-expenses`
- [x] 10. Web: widgets `app-shell`, `app-sidebar`, `expense-summary`, `expenses-table`, `categories-list`
- [x] 11. Web: views `transactions`, `categories`; маршруты `app/(main)/…`, удалить `app/page.tsx`
- [ ] 12. `pnpm typecheck && pnpm lint`, ручная проверка в браузере (п. 3 Verification)
- [x] 13. Обновить `CLAUDE.md` (Expenses API, proxy/refresh, `authorizedRequest`)
