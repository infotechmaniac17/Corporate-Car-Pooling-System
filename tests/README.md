# Auth Flow Tests

## Requirements
- Backend running: `http://localhost:8081/api`
- DB has organisation named **"test"** (exact match, case-insensitive)
- Node 18+ (uses native fetch)

## Run

```bash
node tests/auth-flow.test.mjs
```

Custom backend URL:
```bash
node tests/auth-flow.test.mjs --base-url http://localhost:8081/api
```

## What it tests

| Step | Action | Validates |
|------|--------|-----------|
| 1 | `GET /organisations` | Finds org named "test" |
| 2 | `POST /auth/register` | Creates user `testuser_<timestamp>@test.com` |
| 3 | `POST /auth/login` | Logs in with same credentials |
| 4 | JWT decode | Token valid, not expired, has userId/role claims |

## Output

- Coloured console output per step
- JSON report saved to `tests/auth-flow-results-<runId>.json`
- Exit code `0` = all passed, `1` = any failure

## Test User Spec

- Email: `testuser_<timestamp>@test.com`
- Password: `TestPass@123`
- Role: `PASSENGER`
- Phone: `+15550000000`
- Organisation: first org named "test" in DB (falls back to first org)
