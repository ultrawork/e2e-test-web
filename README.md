# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## E2E Tests

### E2E v27 — /notes Authorization

Верификация авторизации страницы `/notes`: Bearer-токены, мок API, обработка 401.

**Сценарии (6/6):**
- SC-001: редирект на `/login` при отсутствии токена
- SC-002: GET `/api/notes` с Bearer + рендер списка
- SC-003: POST `/api/notes` stateful mock с Authorization: Bearer
- SC-004: DELETE заметки с Authorization: Bearer
- SC-005: валидация заголовка Authorization в исходящих запросах
- SC-006: обработка 401 → очистка токена + redirect `/login`

**Запуск:**
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api APP_PORT=3000 \
  npx playwright test e2e/web-notes-auth-v27.spec.ts
```

**Переменные окружения:**
| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api` | Base URL backend API |
| `APP_PORT` | `3000` | Порт Next.js приложения |
| `BASE_URL` | `http://localhost:3000` | Base URL для Playwright |

**Ключ токена:** `token` в `localStorage`

### E2E v28 — /notes Authorization

Верификация авторизации страницы `/notes`: Bearer-токены, мок API, обработка 401.

**Сценарии (6/6):**
- SC-001: редирект на `/login` при отсутствии токена
- SC-002: GET `/api/notes` с Bearer + рендер списка
- SC-003: POST `/api/notes` stateful mock с Authorization: Bearer
- SC-004: DELETE заметки с Authorization: Bearer
- SC-005: валидация заголовка Authorization в исходящих запросах
- SC-006: обработка 401 → очистка токена + redirect `/login`

**Запуск:**
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api APP_PORT=3000 \
  npx playwright test e2e/web-notes-auth-v28.spec.ts
```

**Переменные окружения:**
| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api` | Base URL backend API |
| `APP_PORT` | `3000` | Порт Next.js приложения |
| `BASE_URL` | `http://localhost:3000` | Base URL для Playwright |

**Ключ токена:** `token` в `localStorage`
