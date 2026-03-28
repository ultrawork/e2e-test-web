# E2E-отчёт: Web Notes Auth v24

## Информация о прогоне

| Параметр | Значение |
|----------|----------|
| **Дата** | 2026-03-28 |
| **Версия** | v24 |
| **Платформа** | Web (Next.js 15 + React 19) |
| **Инструмент** | Playwright 1.52+ |
| **APP_URL** | http://localhost:3000 |
| **NEXT_PUBLIC_API_URL** | http://localhost:4000 |
| **API mock** | `page.route()` — backend не требуется |

## Вердикт

**PASS** — 6 из 6 сценариев пройдены.

## Матрица прохождения

| ID | Сценарий | Статус | Время |
|----|----------|--------|-------|
| SC-001 | Без токена — гейт авторизации | PASS | <1s |
| SC-002 | С токеном — список заметок из API | PASS | <1s |
| SC-003 | Создание заметки + Authorization POST | PASS | <1s |
| SC-004 | Удаление заметки + Authorization DELETE | PASS | <1s |
| SC-005 | Authorization: Bearer в GET-запросе | PASS | <1s |
| SC-006 | 401 — очистка токена + редирект /login | PASS | <1s |

## Детали сценариев

### SC-001: Без токена — гейт авторизации
- **Шаги:** Очистка localStorage → переход на `/notes`
- **Результат:** Текст «Необходима авторизация», ссылка «Войти» с href="/login", поле ввода скрыто

### SC-002: С токеном — список заметок из API
- **Шаги:** Установка токена → мок GET `/api/notes` → переход на `/notes`
- **Результат:** «Заметка из API» отображается, счётчик = 1

### SC-003: Создание заметки + Authorization POST
- **Шаги:** Мок GET (пустой список) + POST → ввод текста → клик «Add»
- **Результат:** Заметка появляется, счётчик инкрементирован, POST содержит `Authorization: Bearer test-token-v24`

### SC-004: Удаление заметки + Authorization DELETE
- **Шаги:** Мок GET (1 заметка) + DELETE → клик кнопки удаления
- **Результат:** Заметка исчезает, счётчик декрементирован, DELETE содержит `Authorization: Bearer test-token-v24`

### SC-005: Authorization: Bearer в GET-запросе
- **Шаги:** Мок GET с перехватом заголовков → `waitForResponse` → `goto`
- **Результат:** GET содержит `Authorization: Bearer my-secret-token`

### SC-006: 401 — очистка токена + редирект /login
- **Шаги:** Мок GET → 401 → `waitForResponse` → `goto`
- **Результат:** Редирект на `/login`, `localStorage.getItem('token')` = null

## Найденные баги

Нет.

## Окружение тестирования

- **OS:** Linux
- **Node.js:** 18+
- **Browser:** Chromium (Playwright default)
