# Member 1 — Monday Codebase Study Notes
## Week 1 | Branch: `feature/auth-core`

---

## ✅ Core Module Review (`app/core/`)

### 1. `config.py` — Settings
- Uses **pydantic-settings** `BaseSettings` to load from `.env`.
- Key settings: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`.
- `BACKEND_CORS_ORIGINS` allows local dev ports (5173, 3000).

### 2. `database.py` — Async Database Sessions
- Engine: `create_async_engine` with `asyncpg` driver.
- Session factory: `async_sessionmaker` (expire_on_commit=False).
- `get_db()`: FastAPI dependency that yields an `AsyncSession` with auto commit/rollback.
- Pool: `pool_size=20`, `max_overflow=10`.

### 3. `security.py` — JWT & Password Hashing
- **Password hashing**: `passlib` with `bcrypt` scheme.
  - ⚠️ **Known issue**: `bcrypt >= 5.0.0` breaks `passlib` — pinned to `<5.0.0` in requirements.
- **JWT tokens**: `python-jose` library.
  - `create_access_token(subject, expires_delta)` — type: `"access"`, default 30 min.
  - `create_refresh_token(subject, expires_delta)` — type: `"refresh"`, default 7 days.
  - `create_verification_token(subject, expires_delta)` — type: `"verification"`, default 24 hrs.
  - `decode_token(token, expected_type)` — validates token and raises `AuthenticationError` on failure.

### 4. `repository.py` — Base Repository Pattern
- `BaseRepository[ModelType]`: generic class for standard CRUD.
- Methods: `get(id)`, `get_by_field(field, value)`, `get_multi(skip, limit)`, `create(dict)`, `update(obj, dict)`, `remove(id)`, `exists(id)`, `count()`.
- All methods are `async` using SQLAlchemy 2.x style.
- Pattern: every module creates its own repository inheriting from this.

### 5. `middleware.py` — CORS + Logging + Request ID
- **CORSMiddleware**: allows configured origins, all methods/headers, credentials.
- **RequestLoggingMiddleware**: logs start/end of every request with duration.
- **RequestIDMiddleware**: assigns `UUID4` to each request → `X-Request-ID` header for distributed tracing.
- Registration order is LIFO — `RequestIDMiddleware` runs first.

### 6. `logging.py` — Structured Logging
- Dev mode: human-readable `[timestamp] LEVEL [name:line] - message` format.
- Production mode: JSON-formatted logs for cloud monitoring (Kubernetes etc).
- `setup_logging()` auto-runs on import.
- `get_logger(name)` helper returns a named logger.

### 7. `exceptions.py` — Custom Exception Hierarchy
| Exception | Code | HTTP Status |
|---|---|---|
| `KNOTSException` | `INTERNAL_SERVER_ERROR` | 500 |
| `AuthenticationError` | `UNAUTHORIZED` | 401 |
| `AuthorizationError` | `FORBIDDEN` | 403 |
| `NotFoundError` | `NOT_FOUND` | 404 |
| `ValidationError` | `VALIDATION_ERROR` | 422 |
| `ConflictError` | `CONFLICT` | 409 |
- All errors return `{ "success": false, "error": { "code", "message", "details" } }`.

### 8. `base.py` — Model Registry for Alembic
- Imports all models so Alembic can auto-detect schema changes.
- Must be updated when new models are added.

### 9. `__init__.py` — Public API
- Re-exports all core utilities for clean imports from other modules.
- **Updated today**: added `create_verification_token` to exports.

---

## 📁 Module Structure Pattern (Used Across All Modules)
```
app/<module>/
  ├── models/       → SQLAlchemy ORM models
  ├── schemas/      → Pydantic request/response schemas
  ├── repository/   → DB queries (extends BaseRepository)
  ├── services/     → Business logic
  ├── routers/      → FastAPI route handlers
  └── dependencies/ → FastAPI dependency injectors
```

---

## 🐛 Issues Found & Fixed Today
| Issue | Fix |
|---|---|
| `bcrypt >= 5.0.0` incompatible with `passlib` (hashing crashes) | Pinned `bcrypt>=4.0.1,<5.0.0` in `requirements.txt` |
| `create_verification_token` not exported from `app/core/__init__.py` | Added to imports and `__all__` |

---

## ✅ Core Module Status: COMPLETE
All core components are working and tested:
- Database sessions ✅
- Password hashing ✅
- JWT (access, refresh, verification tokens) ✅
- CORS middleware ✅
- Request logging middleware ✅
- Request ID middleware ✅
- Base repository pattern ✅
- Custom exception hierarchy ✅
- Structured logging ✅
