# E2E Report: Web v26

**Date:** 2026-03-29
**Result:** PASS 6/6

| # | Test | Status |
|---|------|--------|
| 1 | TC-001: loads /notes without token — shows auth error | PASS |
| 2 | TC-002: loads /notes with token — page renders | PASS |
| 3 | TC-003: handles 401 from API — shows unauthorized error | PASS |
| 4 | TC-004: renders notes list on success | PASS |
| 5 | TC-005: shows network error message | PASS |
| 6 | TC-006: event-driven 401 via window.dispatchEvent | PASS |
