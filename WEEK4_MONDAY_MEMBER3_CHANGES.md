# Week 4 - Monday (Member 3) Changes

## Summary of Work
According to the project plan, Week 4 Monday is dedicated to **Full integration testing — testing all features end-to-end** for all members.

### Steps Performed:
1. Created a new feature branch `feature/week4-integration-testing` from `develop`.
2. Installed backend testing dependencies (`pytest`, `pytest-asyncio`, `httpx`).
3. Ran the full platform integration test (`pytest test_full_platform_integration.py`).
4. **Bug Fixed**: The integration test initially failed with an error: `sqlite3.OperationalError: no such table: notification_preferences`. This was because the `NotificationPreference` model was not being imported in `app/core/base.py`, causing Alembic/SQLAlchemy to not generate the table.
5. Added the missing import for `NotificationPreference` in `backend/app/core/base.py`.
6. Re-ran the integration tests, which successfully passed (`1 passed, 66 warnings in 43.60s`).
7. Ran backend code formatting and linting using `black` and `ruff check --fix`. The `base.py` file was reformatted.
8. Pushed the changes to the feature branch, merged into `develop` after pulling the latest changes.

All tasks for Week 4 Monday for Member 3 have been completed step by step! No frontend linting errors were introduced as `eslint` is not currently set up in the `package.json`.
