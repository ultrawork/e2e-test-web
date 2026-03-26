# E2E Report: Notes API Integration

**Date:** 2026-03-26
**Task:** Web: интеграция /notes с backend API, типы, api.ts, ошибки
**Environment:** Playwright 1.52.0, Chromium, Next.js 15.1.0

## Verdict: PASS

---

## Mock-based Tests (без backend)

| Scenario | Description | Result |
|----------|-------------|--------|
| SC-001 | Home page: heading, welcome text, links | PASS |
| SC-002 | Navigate from home to /notes | PASS |
| SC-003 | Auth wall — без токена нет формы | PASS |
| SC-004 | С токеном — пустой список, форма и счётчик | PASS |
| SC-005 | Загрузка заметок из API | PASS |
| SC-006 | Пустой title не создаёт заметку | PASS |
| SC-007 | Создание заметки через API — счётчик +1 | PASS |
| SC-008 | Удаление заметки через API — счётчик -1 | PASS |
| SC-009 | Фильтрация поиском по заголовку | PASS |
| SC-010 | Очистка поиска показывает все заметки | PASS |
| SC-011 | Поиск без результатов — пустой список | PASS |
| SC-012 | Поиск регистронезависимый | PASS |
| SC-013 | Toggle favorite через PATCH API | PASS |
| SC-014 | Фильтр «Только избранные» | PASS |
| SC-015 | 500 ошибка — error state + кнопка «Обновить» | PASS |
| SC-016 | Сетевая ошибка — error state | PASS |
| SC-017 | Login page — форма рендерится | PASS |
| SC-018 | Login error — alert с текстом ошибки | PASS |
| SC-019 | Logout — очистка токена, редирект на /login | PASS |

## Live Backend Tests

| Scenario | Description | Result |
|----------|-------------|--------|
| SC-L01 | Full CRUD cycle | SKIPPED (no BACKEND_URL) |

## Summary

- **19 passed**, 1 skipped (live backend)
- Build: `next build` — OK
- Lint: `next lint` — 0 warnings, 0 errors
- Total time: ~3.9s

## Key Logs

```
Running 20 tests using 1 worker
19 passed (3.9s)
1 skipped
```

## Mapping to Specification Scenarios

| Spec Scenario | E2E Test | Result |
|---------------|----------|--------|
| SC-5 (auth wall) | SC-003 | PASS |
| SC-6 (load notes) | SC-005 | PASS |
| SC-7 (create note) | SC-007 | PASS |
| SC-8 (delete note) | SC-008 | PASS |
| SC-005 (auth wall) | SC-003 | PASS |
| SC-006 (load with token) | SC-004, SC-005 | PASS |
| SC-007 (create via API) | SC-007 | PASS |
| SC-008 (delete via API) | SC-008 | PASS |
