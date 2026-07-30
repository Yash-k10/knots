# Walkthrough — Week 3 Monday: Member 3 (Notifications Backend)

**Date:** July 28, 2026  
**Branch:** `feature/notifications-ui`  
**Assigned Task (PROJECT_PLAN.md — Week 3, Monday):**
> `notifications/` backend — create notification on events (new like, comment, connection request, event RSVP)

---

## Step 1: Branch Creation & Git Flow

Created the new feature branch for Member 3's Week 3 tasks and confirmed we are working on it:

```bash
git checkout develop
git checkout -b feature/notifications-ui
```

Current branch confirmed:
```
feature/notifications-ui
```

The project follows this git flow:
- `main` — production only (never touched directly)
- `develop` — integration branch (pull before pushing)
- `feature/notifications-ui` — Member 3's Week 3 feature branch

> All changes were made exclusively in `feature/notifications-ui`. Main branch was never touched.

---

## Step 2: Explored Existing Codebase

Before writing any code, read and understood:

| File | Purpose |
|---|---|
| `app/notifications/models/notification.py` | Existing `Notification` SQLAlchemy model |
| `app/notifications/services/notification.py` | Existing `NotificationService` class |
| `app/notifications/repository/notification.py` | Repository with get/mark_as_read methods |
| `app/posts/services/post.py` | `PostService` — `like_post` and `add_comment` methods |
| `app/connections/services/connection.py` | `ConnectionService` — `request_connection` method |
| `app/events/services/event.py` | `EventService` — `rsvp_to_event` method |

Key finding: The `NotificationService.create_notification()` already:
- Saves the notification to DB
- Broadcasts it in real-time over WebSocket to the recipient user if online

All we needed to do was **call it at the right places** in the social action services.

---

## Step 3: Added `get_user_display_name()` Helper

**File modified:** `app/notifications/services/notification.py`

Added a helper method to `NotificationService` that:
- Fetches the `User` by ID with their `Profile` eagerly loaded
- Returns `"First Last"` if the profile has names set
- Falls back to the user's `email` address
- Falls back to `"Someone"` if user is not found

```python
async def get_user_display_name(self, user_id: int) -> str:
    """Fetch user display name (First Last, or email if profile name not set)."""
```

---

## Step 4: Added Notification Trigger — Post Like

**File modified:** `app/posts/services/post.py`

Modified `like_post()`:
- The post is now assigned to a variable (`post = await self.get_post(post_id)`)
- After creating the like, checks `if post.author_id != user_id`
- If true (someone else's post), calls `NotificationService.create_notification()` with:
  - `type="like"`, `title="New Like"`
  - `content="<Display Name> liked your post."`

---

## Step 5: Added Notification Trigger — Post Comment

**File modified:** `app/posts/services/post.py`

Modified `add_comment()`:
- The post is now fetched before creating the comment
- After the comment is created, checks `if post.author_id != author_id`
- If true, calls `NotificationService.create_notification()` with:
  - `type="comment"`, `title="New Comment"`
  - `content="<Display Name> commented on your post: '<snippet>'"` (truncated to 60 chars)

---

## Step 6: Added Notification Trigger — Connection Request

**File modified:** `app/connections/services/connection.py`

Modified `request_connection()`:
- After the connection object is created, calls `NotificationService.create_notification()` for `addressee_id` with:
  - `type="connection_request"`, `title="New Connection Request"`
  - `content="<Display Name> sent you a connection request."`

---

## Step 7: Added Notification Trigger — Event RSVP

**File modified:** `app/events/services/event.py`

Modified `rsvp_to_event()`:
- After the RSVP object is created/updated, checks `if event.organizer_id != user_id`
- If true, calls `NotificationService.create_notification()` for `event.organizer_id` with:
  - `type="event_rsvp"`, `title="New Event RSVP"`
  - Content is tailored to the RSVP status:
    - GOING → `"<Name> is going to your event '<Title>'."`
    - MAYBE → `"<Name> is maybe attending your event '<Title>'."`
    - NOT_GOING → `"<Name> is not going to your event '<Title>'."`

---

## Step 8: Integration Tests

**File created:** `test_notifications_integration.py`

Added 4 end-to-end integration tests using an in-memory SQLite database:

| Test | What it verifies |
|---|---|
| `test_like_notification` | Liking another user's post → `"like"` notification. Own post → no notification. |
| `test_comment_notification` | Commenting on another's post → `"comment"` notification with snippet. Own post → no notification. |
| `test_connection_request_notification` | Sending a connection request → `"connection_request"` notification for recipient. |
| `test_event_rsvp_notification` | RSVPing to another's event → `"event_rsvp"` notification for organizer. Own event → no notification. |

Each test also verifies:
- Notification count is exactly correct
- Display names appear properly in the notification content

---

## Step 9: Code Quality

All modified files were formatted and linted:

```
black reformatted:
  - app/connections/services/connection.py
  - app/notifications/services/notification.py
  - app/posts/services/post.py
  - app/events/services/event.py

ruff check → All checks passed!
```

---

## Step 10: Test Results

### Integration Tests (New — 4 tests)
```
Ran 4 tests in 17.323s
OK
```

### Full Test Suite (62 tests)
```
Ran 62 tests in 85.332s
OK (skipped=1)
```

Zero regressions. All previously passing tests still pass.

---

## 🗓️ Tuesday (July 28): Notification Preferences

**Assigned Task (PROJECT_PLAN.md — Week 3, Tuesday):**
> `notifications/` backend — mark as read, notification preferences

**Note:** `mark_as_read` and `mark_all_as_read` were already completed in the initial `NotificationService` setup.

### Step 11: Notification Preference Model & DB Migration
**Files Created:** 
- `app/notifications/models/notification_preference.py`
- `alembic/versions/f1a2b3c4d5e6_add_notification_preferences_table.py`

Created a new `NotificationPreference` model with a one-to-one relationship to `User`. It contains boolean flags for each notification type (like, comment, connection request, event RSVP, etc.), defaulting to `True`. Created the Alembic migration script manually.

### Step 12: Schemas, Repository, and Service
**Files Created:**
- `app/notifications/schemas/notification_preference.py` (Response and Update models)
- `app/notifications/repository/notification_preference.py` (`get_by_user`, `get_or_create`, `update_preferences`)
- `app/notifications/services/notification_preference.py`

The service layer handles lazy-creation of the preference row using `get_or_create`. It also exposes an `is_enabled(user_id, type)` helper for fast preference checking.

### Step 13: Wired Preferences into Notification Trigger
**File Modified:** `app/notifications/services/notification.py`

Modified `NotificationService.create_notification()` to check user preferences *before* creating the notification or sending the WebSocket event.
- If the user has disabled that specific `type`, the method now silently returns `None` and skips delivery.

### Step 14: REST Router & API Registration
**Files Modified/Created:**
- `app/notifications/routers/notification_preference.py` (New)
- `app/api_router.py` (Modified)
- `app/core/base.py` (Modified)

Created endpoints:
- `GET /api/v1/notifications/preferences` — Returns current preferences (lazily created if missing).
- `PATCH /api/v1/notifications/preferences` — Partially updates preferences.

Registered the new router in `api_router.py` (mounted before the main notifications router to prevent path collisions).

### Step 15: Unit & Integration Tests
**Files Created:**
- `test_notification_preferences_router.py` (Unit tests with mocks)
- `test_notification_preferences_integration.py` (End-to-end tests with in-memory SQLite)

Added 10 tests across both files. Verified that disabling a preference correctly suppresses the notification without affecting other users or other notification types.

```
Ran 10 tests in 14.713s
OK
```

---

## Summary of Changes (Tuesday)

| File | Change Type | Summary |
|---|---|---|
| `app/notifications/models/notification_preference.py` | New | `NotificationPreference` DB model |
| `app/notifications/schemas/notification_preference.py` | New | API schemas |
| `app/notifications/repository/notification_preference.py` | New | DB operations (`get_or_create`) |
| `app/notifications/services/notification_preference.py` | New | Business logic and `is_enabled` check |
| `app/notifications/routers/notification_preference.py` | New | `GET` and `PATCH` endpoints |
| `app/notifications/services/notification.py` | Modified | Skips notification creation if disabled |
| `app/api_router.py` | Modified | Registered new router |
| `app/core/base.py` | Modified | Registered model for Alembic |
| `alembic/versions/f1a2b3c4d5e6...` | New | DB migration script |
| `test_notification_preferences_*.py` | New | 10 new tests |
| `frontend/src/pages/Settings.tsx` | Modified | Integrated real notification preferences API |

---

## Git Flow Compliance

- Formatted with `black`, linted with `ruff` ✅

---

## 🗓️ Wednesday (July 29): Notifications UI & Real-Time Badge

**Assigned Task (PROJECT_PLAN.md — Week 3, Wednesday):**
> Frontend — Notifications page (notification list, mark as read, real-time badge count)

### Step 16: Created Notifications Page
**File Created:** `frontend/src/pages/Notifications.tsx`

Built the central Notifications center UI using Tailwind CSS. 
- Integrates with the `GET /notifications` endpoint to fetch the user's notification list.
- Renders notifications dynamically with conditional styling (dimming opacity if `is_read` is true).
- Categorizes notification icons and colors based on `type` (e.g., `job_alert`, `connection_request`, `event_alert`).

### Step 17: Implemented Mark As Read
**File Modified:** `frontend/src/pages/Notifications.tsx`

- Added `handleMarkAsRead` which triggers a `PATCH /notifications/:id/read` when a user clicks on an unread notification, immediately updating the local state.
- Added a "Mark All as Read" button that triggers `PATCH /notifications/read-all`.

### Step 18: Integrated Real-Time WebSocket Listener
**File Modified:** `frontend/src/pages/Notifications.tsx`

- Subscribed to `wsClient.onNotification` to listen for real-time WebSocket pushes.
- Whenever a new notification arrives via WS, it is immediately prepended to the `notifications` state array without requiring a page refresh.

### Step 19: Added Real-Time Badge Count to Layout
**File Modified:** `frontend/src/components/layout/DashboardLayout.tsx`

- Integrated `wsClient.connect()` upon component mount.
- Fetched the initial unread count via `GET /notifications/unread-count`.
- Subscribed to `wsClient.onNotification` to either receive a new unread count from the server or increment the local counter.
- Rendered the red badge count with a pulsing animation over the `Bell` icon in the top header and sidebar navigation if the count > 0.

### Step 20: Registered Route
**File Modified:** `frontend/src/routes/AppRoutes.tsx`

- Added the `<Route path="notifications" element={<Notifications />} />` inside the ProtectedRoute wrapper so users can navigate to the page via the sidebar.

---

## Summary of Changes (Wednesday)

| File | Change Type | Summary |
|---|---|---|
| `frontend/src/pages/Notifications.tsx` | New | Notifications center with list, mark as read, and WS integration |
| `frontend/src/components/layout/DashboardLayout.tsx` | Modified | Added real-time WS badge counter and initial count fetch |
| `frontend/src/routes/AppRoutes.tsx` | Modified | Registered Notifications route |

## Git Flow Compliance

- Worked on `feature/notifications-ui` (Member 3's branch) ✅
- Did not touch `main` branch ✅
- Verified WebSocket connects successfully and badge updates ✅

