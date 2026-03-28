# E2E-сценарии: Web Notes Auth v25

Верификация страницы `/notes` и `api.ts` — авторизация, Authorization header, обработка 401.

**Платформа:** Web (Next.js)
**Инструмент:** Playwright
**API-моки:** `page.route()` — backend не требуется
**Дата:** 2026-03-28

---

## SC-001: Без токена — гейт авторизации

| Поле | Значение |
|------|----------|
| **Тип** | Auth gate |
| **Приоритет** | High |
| **Режим** | automated (Playwright) |

**Предусловия:**
- localStorage не содержит `token`

**Шаги:**
1. Очистить localStorage через `addInitScript`
2. Перейти на `/notes`

**Ожидаемый результат:**
- Текст «Необходима авторизация» отображается
- Ссылка «Войти» с `href="/login"` видима
- Поле ввода `#new-note` НЕ видимо

---

## SC-002: С токеном — список заметок из API

| Поле | Значение |
|------|----------|
| **Тип** | API integration |
| **Приоритет** | High |
| **Режим** | automated (Playwright) |

**Предусловия:**
- `localStorage.token = 'test-token-v25'`
- GET `/api/notes` → 200, `[{id:'1', text:'Заметка из API', createdAt:'...'}]`

**Шаги:**
1. Установить токен через `addInitScript`
2. Мокировать GET `/api/notes`
3. Перейти на `/notes`

**Ожидаемый результат:**
- Текст «Заметка из API» отображается
- Счётчик показывает «Всего заметок: 1»

---

## SC-003: Создание заметки — счётчик растёт + Authorization в POST

| Поле | Значение |
|------|----------|
| **Тип** | Create + Auth header |
| **Приоритет** | High |
| **Режим** | automated (Playwright) |

**Предусловия:**
- `localStorage.token = 'test-token-v25'`
- GET `/api/notes` → 200, `[]` (допущение: оптимистичное обновление UI без re-fetch)
- POST `/api/notes` → 201, `{id:'new-1', text:'Тестовая заметка v25', ...}`

**Шаги:**
1. Установить токен, мокировать GET и POST
2. Перейти на `/notes`, проверить «Всего заметок: 0»
3. Ввести текст в `#new-note`, нажать «Add»

**Ожидаемый результат:**
- Текст «Тестовая заметка v25» отображается
- Счётчик обновляется до «Всего заметок: 1»
- POST-запрос содержит заголовок `Authorization: Bearer test-token-v25`

---

## SC-004: Удаление заметки — счётчик уменьшается + Authorization в DELETE

| Поле | Значение |
|------|----------|
| **Тип** | Delete + Auth header |
| **Приоритет** | High |
| **Режим** | automated (Playwright) |

**Предусловия:**
- `localStorage.token = 'test-token-v25'`
- GET `/api/notes` → 200, `[{id:'del-1', text:'Заметка для удаления', ...}]`
- DELETE `/api/notes/del-1` → 204

**Шаги:**
1. Установить токен, мокировать GET и DELETE
2. Перейти на `/notes`, проверить «Всего заметок: 1»
3. Нажать кнопку `[aria-label="Delete note: Заметка для удаления"]`

**Ожидаемый результат:**
- Текст «Заметка для удаления» исчезает
- Счётчик обновляется до «Всего заметок: 0»
- DELETE-запрос содержит заголовок `Authorization: Bearer test-token-v25`

---

## SC-005: api.ts добавляет Authorization: Bearer к GET-запросу

| Поле | Значение |
|------|----------|
| **Тип** | Auth header verification |
| **Приоритет** | High |
| **Режим** | automated (Playwright) |

**Предусловия:**
- `localStorage.token = 'my-secret-token'`
- GET `/api/notes` → 200, `[]`

**Шаги:**
1. Установить токен, мокировать GET с перехватом заголовков
2. Инициализировать `waitForResponse` ДО `page.goto()`
3. Перейти на `/notes`

**Ожидаемый результат:**
- GET-запрос содержит заголовок `Authorization: Bearer my-secret-token`

---

## SC-006: 401 от API — токен очищается + редирект на /login

| Поле | Значение |
|------|----------|
| **Тип** | Error handling (401) |
| **Приоритет** | Critical |
| **Режим** | automated (Playwright) |

**Предусловия:**
- `localStorage.token = 'test-token-v25'`
- GET `/api/notes` → 401, `{"error":"Unauthorized"}`

**Шаги:**
1. Установить токен, мокировать GET → 401
2. Инициализировать `waitForResponse` ДО `page.goto()`
3. Перейти на `/notes`

**Ожидаемый результат:**
- Браузер перенаправлен на `/login`
- `localStorage.getItem('token')` возвращает `null`
