# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## E2E v24

Верификация страницы `/notes` — рендеринг, добавление/удаление заметок, поиск, счётчик.

### Запуск тестов

1. Запустить dev-сервер:
   ```sh
   npm run dev
   ```

2. Запустить тесты v24:
   ```sh
   npx playwright test e2e/web-notes-auth-v24.spec.ts
   ```

### Описание тестов

| ID     | Сценарий                                    |
|--------|---------------------------------------------|
| SC-001 | /notes page renders initial state correctly |
| SC-002 | Adding note via Enter key submits form      |
| SC-003 | Input field clears after adding a note      |
| SC-004 | Delete specific note preserves other notes  |
| SC-005 | Search + delete interaction updates counter |
| SC-006 | Delete button aria-label verification       |
