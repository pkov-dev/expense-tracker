# Expense Tracker

Монорепозиторий трекера расходов.

## Стек

| Слой      | Технологии                                              |
| --------- | ------------------------------------------------------- |
| Монорепо  | pnpm workspaces, Turborepo                              |
| Frontend  | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| Backend   | NestJS 11, `@nestjs/config`                             |
| БД / ORM  | PostgreSQL 17, Prisma 7 (`@prisma/adapter-pg`)          |
| Общий код | `@expense-tracker/shared`: Zod-схемы и типы             |
| Качество  | ESLint 9 (flat config), Prettier, TypeScript (strict)   |

## Структура

```
apps/
  web/   Next.js (порт 3000)
  api/   NestJS (порт 4000), Prisma-схема в apps/api/prisma
packages/
  shared/         общие Zod-схемы и типы
  eslint-config/  общие конфиги ESLint (base / next / nest)
```

## Первый запуск

Требуются Node 24+, pnpm 11, Docker.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

pnpm install
pnpm db:up          # PostgreSQL в Docker
pnpm db:generate    # генерация Prisma Client
pnpm db:migrate     # первая миграция
pnpm dev            # web + api + shared (watch)
```

- Web: http://localhost:3000
- API: http://localhost:4000/health, остальные роуты под префиксом `/api`

## Скрипты

| Команда            | Что делает                          |
| ------------------ | ----------------------------------- |
| `pnpm dev`         | запуск всех приложений в dev-режиме |
| `pnpm build`       | сборка всех пакетов                 |
| `pnpm lint`        | ESLint во всех пакетах              |
| `pnpm typecheck`   | проверка типов                      |
| `pnpm format`      | Prettier                            |
| `pnpm db:studio`   | Prisma Studio                       |

## shadcn/ui

`apps/web/components.json` уже настроен, компоненты добавляются так:

```bash
pnpm --filter @expense-tracker/web dlx shadcn@latest add button
```
