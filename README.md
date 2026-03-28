# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## E2E v24

Верификация страницы `/notes` и модуля `api.ts` — авторизация, Authorization header, обработка 401.

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

| ID     | Сценарий                              | Тип  |
|--------|---------------------------------------|------|
| SC-001 | Без токена — гейт авторизации         | mock |
| SC-002 | С токеном — список заметок            | mock |
| SC-003 | Создание + Authorization в POST       | mock |
| SC-004 | Удаление + Authorization в DELETE     | mock |
| SC-005 | Authorization: Bearer в GET           | mock |
| SC-006 | 401 — очистка токена + редирект       | mock |

> Backend не требуется — тесты используют `page.route()` для перехвата API-запросов.
