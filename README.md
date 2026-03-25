# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## Настройка окружения (Web)

Скопируйте `.env.local.example` в `.env.local`:

```bash
cp .env.local.example .env.local
```

Переменные окружения:

| Переменная | Описание | По умолчанию |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Базовый URL backend API | `http://localhost:3000` |

В dev-режиме токен запрашивается автоматически через `POST /api/auth/dev-token` при отсутствии токена в localStorage.
