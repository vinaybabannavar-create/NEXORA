# Test Plan

## Already verified in the development build

- PostgreSQL connection
- Django migrations
- Django Admin
- Login
- Current user
- Logout and refresh-token blacklist
- ADMIN access to admin-only endpoint
- MANAGER and ADMIN access to manager-or-admin endpoint
- EMPLOYEE blocked from manager-or-admin endpoint

## Next test layers

1. Django API unit tests
2. Permission tests
3. User-management integration tests
4. FastAPI tests
5. Realtime Socket.IO tests
6. Frontend component/e2e tests
7. CI pipeline
