# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## E2E v24

Верификация страницы `/notes` и `api.ts` — авторизация, Authorization header, обработка 401.

### Предварительная настройка

1. Создать `.env.local` в корне проекта:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

2. Запустить dev-сервер:
   ```sh
   npm run dev
   # Приложение доступно на http://localhost:3000
   ```

3. Запустить тесты v24:
   ```sh
   APP_URL=http://localhost:3000 npx playwright test e2e/web-notes-auth-v24.spec.ts
   ```

### Описание тестов

| ID     | Сценарий                                    | Тип  |
|--------|---------------------------------------------|------|
| SC-001 | Без токена — гейт авторизации               | mock |
| SC-002 | С токеном — список заметок                  | mock |
| SC-003 | Создание + Authorization в POST             | mock |
| SC-004 | Удаление + Authorization в DELETE            | mock |
| SC-005 | Authorization: Bearer в GET                 | mock |
| SC-006 | 401 — очистка токена + редирект             | mock |

> Backend не требуется — тесты используют `page.route()` для перехвата API-запросов.

## E2E v25

Верификация API-интеграции web-клиента с backend v25 — авторизация, CRUD заметок, обработка ошибок.

### Переменные окружения

| Переменная | Описание | Пример |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL backend API | `http://localhost:4000` |
| `APP_URL` | URL web-приложения | `http://localhost:3000` |

### Запуск тестов

```bash
# Установка зависимостей
npm install
npx playwright install

# Запуск E2E v25 (с page.route() моками, backend не нужен)
APP_URL=http://localhost:3000 npx playwright test e2e/web-notes-auth-v25.spec.ts

# Запуск всех E2E тестов
npx playwright test
```

### Сценарии v25

| ID     | Сценарий                                    | Тип  |
|--------|---------------------------------------------|------|
| SC-001 | Без токена — гейт авторизации               | mock |
| SC-002 | С токеном — список заметок                  | mock |
| SC-003 | Создание + Authorization в POST             | mock |
| SC-004 | Удаление + Authorization в DELETE            | mock |
| SC-005 | Authorization: Bearer в GET                 | mock |
| SC-006 | 401 — очистка токена + редирект             | mock |

Файл сценариев: `e2e/scenarios/web-notes-auth-v25.md` — 6 сценариев (SC-001..SC-006)
Отчёт: `e2e/reports/web-v25.md` — PASS 6/6

> Backend не требуется — тесты используют `page.route()` для перехвата API-запросов.
