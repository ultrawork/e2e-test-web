# E2E Report: Web v23 — /notes и авторизация

**Дата:** 2026-03-27
**Версия:** v23
**Окружение:** Next.js 15.1.0, Playwright 1.52.0, Chromium headless
**APP_PORT:** 3000 (Next.js dev)
**API_PORT:** 4000 (backend v23, не требуется для текущих тестов)

---

## Результаты прогона

| Сценарий | Описание | Результат |
|----------|----------|-----------|
| SC-v23-01 | Без токена — страница /notes доступна | PASS |
| SC-v23-02 | Интерфейс заметок: заголовок, форма, счётчик | PASS |
| SC-v23-03 | Создание заметки увеличивает счётчик | PASS |
| SC-v23-04 | Удаление заметки уменьшает счётчик | PASS |

**Итого:** 4/4 PASS

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

- `playwright.config.ts`: `baseURL` исправлен с `http://localhost:4000` на `http://localhost:3000` (Next.js, а не backend)
- `.env.local`: создан с `NEXT_PUBLIC_API_URL=http://localhost:4000`

## Примечания

- Auth gate (`src/lib/api.ts`, проверка токена) на текущий момент не реализован в страницах — `/notes` доступна без авторизации.
- SC-v23-01 подтверждает доступность страницы без токена.
- Существующие тесты (SC-001..SC-009) продолжают проходить после исправления `baseURL`.
