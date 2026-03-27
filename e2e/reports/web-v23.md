# E2E Report: Web v23 — /notes и авторизация

**Дата:** 2026-03-27
**Версия:** v23
**Окружение:** Next.js 15.1.0, Playwright 1.52.0, Chromium headless
**APP_PORT:** 3000 (Next.js dev)
**API_PORT:** 4000 (backend v23, мокается через Playwright route interception)

---

## Результаты прогона

| Сценарий | Описание | Результат |
|----------|----------|-----------|
| SC-v23-01 | Без токена — показ требования авторизации | PASS |
| SC-v23-02 | С токеном — список, форма и счётчик отображаются | PASS |
| SC-v23-03 | Создание заметки увеличивает счётчик | PASS |
| SC-v23-04 | Удаление заметки уменьшает счётчик | PASS |
| SC-v23-05 | api.ts добавляет Authorization: Bearer заголовок | PASS |
| SC-v23-06 | api.ts корректно обрабатывает 401 (удаляет токен, показывает auth gate) | PASS |

**Итого:** 6/6 PASS

---

## Регрессионная проверка (существующие тесты)

| Сценарий | Описание | Результат |
|----------|----------|-----------|
| SC-001 | Home page displays heading, welcome text, and link | PASS |
| SC-002 | Navigate from home to /notes via link | PASS |
| SC-003 | Adding notes increments the counter | PASS |
| SC-004 | Deleting notes decrements the counter | PASS |
| SC-005 | Empty or whitespace input does not add a note | PASS |
| SC-006 | Search filters notes by title | PASS |
| SC-007 | Clearing search shows all notes | PASS |
| SC-008 | Search with no results shows empty list | PASS |
| SC-009 | Search is case-insensitive | PASS |

**Итого:** 9/9 PASS

---

## Конфигурационные изменения

- `playwright.config.ts`: `baseURL` = `http://localhost:3000` (Next.js)
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000` (описан в README, в .gitignore)
- `src/lib/api.ts`: создан — API-клиент с `Authorization: Bearer <token>` и обработкой 401
- `src/app/notes/page.tsx`: добавлен auth gate (проверка токена в localStorage)

## Примечания

- Auth gate проверяет наличие токена в localStorage при монтировании страницы.
- При отсутствии токена отображается «Необходима авторизация» со ссылкой «Войти».
- При наличии токена выполняется запрос `fetchNotes()` с заголовком `Authorization: Bearer <token>`.
- При получении 401 от API токен удаляется из localStorage, отображается auth gate.
- E2E-тесты используют Playwright route interception для мокирования API-ответов.
- Существующие тесты (SC-001..SC-009) обновлены: добавлен setup токена через `addInitScript`.
