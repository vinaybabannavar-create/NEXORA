# NEXORA Architecture

## Responsibility boundaries

### Django
Core transactional API, authentication, authorization, admin, and enterprise business models.

### FastAPI
AI/RAG/document processing boundary. It should not own core user identity.

### Node + Socket.IO
Realtime presence, chat, typing indicators, live notifications and event delivery.

### PostgreSQL
Source of truth for strongly structured transactional data.

### MongoDB
Flexible/semi-structured records where relational modeling is not ideal.

### Redis
Cache, queues, rate limiting and realtime ephemeral state.

### Frontend
Next.js/React/TypeScript web application.

## Security principles

1. Never trust frontend role checks.
2. Enforce authorization in backend permissions/services.
3. Keep secrets out of Git.
4. Use short-lived access tokens.
5. Blacklist refresh tokens on logout.
6. Public registration must not create privileged roles.
7. Add audit logging to sensitive mutations.
