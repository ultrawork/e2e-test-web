# E2E Report: Web v28

**Spec:** `e2e/web-notes-auth-v28.spec.ts`
**Date:** 2026-03-29
**Status:** PASS 6/6

## Test Results

| Scenario | Description | Status |
|----------|-------------|--------|
| SC-001 | Redirect to /login when no auth token | ✅ PASS |
| SC-002 | GET /api/notes with Bearer token renders list | ✅ PASS |
| SC-003 | POST /api/notes stateful mock with Authorization: Bearer | ✅ PASS |
| SC-004 | DELETE note with Authorization: Bearer | ✅ PASS |
| SC-005 | Outgoing requests include Authorization: Bearer token | ✅ PASS |
| SC-006 | 401 response clears token and redirects to /login | ✅ PASS |

## Environment

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
APP_PORT=3000
```

## Build / Lint / TSC

- `npm run build` — OK
- `npm run lint` — OK
- `npx tsc --noEmit` — OK

## Run Command

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api APP_PORT=3000 \
  npx playwright test e2e/web-notes-auth-v28.spec.ts
```
