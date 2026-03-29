# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## E2E v26

### Переменные окружения

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### Команда запуска

```bash
npx playwright test e2e/web-notes-auth-v26.spec.ts
```

### Использование токена (beforeEach)

```ts
localStorage.setItem('token', 'test-token-v26');
```

### Ожидаемый результат

PASS 6/6
