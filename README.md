# Notes App — Web (Next.js)

Cross-platform notes application — web frontend built with Next.js 15 + React 19 + TypeScript.

## E2E-тестирование (v23)

### Предусловия

1. Поднять backend v23 (порт 4000):
   ```bash
   cd e2e-test-backend
   npm install && npm run dev
   ```
2. Создать `.env.local` в корне web-проекта:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```
3. Поднять web-приложение (порт 3000):
   ```bash
   cd e2e-test-web
   npm install && npm run dev
   ```

### Запуск тестов

```bash
npx playwright install --with-deps chromium
npx playwright test e2e/web-notes-auth.spec.ts
```

### Просмотр отчёта

```bash
npx playwright show-report
```

### Сценарии

Описание сценариев: [`e2e/scenarios/web-notes-auth.md`](e2e/scenarios/web-notes-auth.md)
Результаты прогона: [`e2e/reports/web-v23.md`](e2e/reports/web-v23.md)
