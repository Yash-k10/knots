# Member 4 - Week 1 Monday Notes

## 1. Codebase Structure
- The application uses a modular structure inside `backend/app/` where each domain (auth, users, connections, messaging) has its own directory.
- Each module has its own `models/`, `schemas/`, `repository/`, `services/`, and `routers/` directories.
- The `connections` module scaffolding already exists, and `Connection` model is defined with `requester_id`, `addressee_id`, and `status`.

## 2. Authentication Mechanism
- Auth is handled via **JWT (JSON Web Tokens)** and OAuth2 Password Bearer flow.
- Found in `app.auth.dependencies.auth.py`.
- The `get_current_user` dependency can be injected into any route like this:
  ```python
  from fastapi import Depends
  from app.users.models.user import User
  from app.auth.dependencies.auth import get_current_user

  @router.get("/my-connections")
  async def get_connections(current_user: User = Depends(get_current_user)):
      # current_user contains the fully loaded User model
      pass
  ```
- It uses `security.decode_token()` to verify the token, then fetches the user using `AuthRepository`.
- Role-based and Permission-based access controls are also available via `RoleRequired` and `PermissionRequired`.

## Conclusion
Codebase is fully understood, and the feature branch `feature/connections` is ready for Tuesday's task (completing the models).
