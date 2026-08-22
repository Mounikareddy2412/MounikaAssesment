# Focus List — Full Stack To Do List

This is my implementation of the full-stack To Do List engineering challenge. I kept the solution deliberately small enough to explain end-to-end in a live session, while still covering authentication, ownership, CRUD, search, ordering, responsive UX, persistence, validation, and tests.

## Assignment summary

The application provides a sign-in landing page and a private task list for each user. After signing in, a user can create, read, update, delete, search, complete, and reorder their own tasks. The React frontend talks only to the custom REST API; task data is persisted by the backend.

## What I built

- Email/password sign-in with an 8-hour JWT session.
- Per-user authorization: one user cannot read or mutate another user's tasks.
- Full task CRUD.
- Search across task titles and descriptions.
- Drag-and-drop task ordering when the unfiltered list is shown.
- Task completion toggle from the list.
- Separate create/detail/edit screen.
- Responsive desktop/mobile layout.
- REST-style status codes and JSON errors.
- Input validation for task fields.
- File-based JSON persistence with serialized, atomic writes.
- Backend API tests covering auth, CRUD, ownership and ordering.
- Frontend tests covering login behavior and task rendering.
- Docker Compose setup in addition to normal Mac development instructions.

## Technology choices

### Frontend

- React + Vite
- React Router
- Native HTML5 drag/drop
- Plain CSS
- Vitest + React Testing Library

I used native drag/drop rather than adding a large dependency because the interaction is small and the code is easy to discuss. For a product that needed touch-heavy or complex sortable behavior, I would use a mature accessibility-focused drag/drop library.

### Backend

- Node.js + Express
- JWT for session tokens
- bcryptjs for password hashing
- JSON file persistence
- Vitest + Supertest

I chose a file store because the exercise explicitly allows file-based storage and it makes the project runnable without provisioning a database. I still serialize writes and persist via temporary-file rename so concurrent requests do not accidentally overwrite each other or leave a partially written JSON document.

## Project structure

```text
todo-list-challenge/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── auth.jsx
│   │   └── styles.css
│   ├── Dockerfile
│   └── nginx.conf
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Run locally on a Mac

### Prerequisites

- Node.js 22+ (Node 20+ should also work)
- npm 10+

### Install

From the project root:

```bash
npm install
```

Because the root uses npm workspaces, this installs both the `client` and `server` dependencies.

### Start frontend and backend together

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

The API runs at:

```text
http://localhost:4000
```

Vite proxies `/api` requests to the backend during local development.

### Demo users

```text
alex@example.com / demo1234
sam@example.com  / demo1234
```

The backend creates the demo users the first time it starts. Their passwords are stored as bcrypt hashes, not plain text.

## Tests

Run all backend and frontend tests:

```bash
npm test
```

Run one side independently:

```bash
npm run test -w server
npm run test -w client
```

## Production build

Build the frontend:

```bash
npm run build
```

The generated static files are written to `client/dist`.

## Run with Docker Compose

If Docker Desktop is installed:

```bash
docker compose up --build
```

Open:

```text
http://localhost:8080
```

The Compose setup runs the React build behind Nginx and proxies `/api` to the Express service. Task data is stored in a named Docker volume so it survives container recreation.

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/login` | Sign in and receive a JWT |
| `GET` | `/api/tasks?search=` | List/search the signed-in user's tasks |
| `GET` | `/api/tasks/:id` | Read one owned task |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `PUT` | `/api/tasks/reorder` | Persist the user's complete task order |

Protected requests use:

```text
Authorization: Bearer <token>
```

## HTTP behavior

- `200` for successful reads/updates.
- `201` when a task is created.
- `204` when a task is deleted.
- `400` for invalid input.
- `401` for missing/invalid authentication.
- `404` when a task does not exist or is not owned by the signed-in user.

For ownership failures I intentionally return `404` rather than confirming that another user's task exists.

## Design notes I would discuss in a review

### Task ownership

The user id comes from the verified JWT and is never accepted from the browser as an authorization decision. Every task query is scoped to `req.user.sub`.

### Reordering

The UI sends the complete ordered list of task ids. The API verifies that the ids exactly match the signed-in user's current task set before storing positions. Search mode disables reordering because a partial filtered list is not enough information to safely rewrite the global order.

### Persistence and concurrency

The file store maintains a small promise queue around mutations. Writes go to a temporary file and are renamed over the data file only after the full JSON document has been written. This is intentionally lightweight, but avoids the most obvious lost-write and partial-write problems of naive file storage.

### Error handling

Expected client errors are returned as JSON with useful 4xx status codes. Unexpected errors are converted to a generic 500 response so server implementation details are not leaked to the client.

## If I had more time

These are the next improvements I would prioritize for a real product:

| Improvement | Rough effort | Why |
|---|---:|---|
| PostgreSQL + migrations | 3–5 hours | Better durability, indexing, concurrent writes and production operations |
| Refresh-token/session revocation flow | 3–4 hours | Better control over long-lived authentication sessions |
| Accessible sortable library + keyboard ordering | 2–4 hours | Stronger accessibility and mobile drag behavior |
| Pagination and server-side sort/filter options | 2–3 hours | Keeps list APIs efficient as task counts grow |
| More component and API edge-case tests | 3–5 hours | Improves regression safety |
| CI pipeline for test/build/container scan | 2–3 hours | Makes quality checks automatic on every change |

## What I would do to make it more robust

For production I would move persistence to PostgreSQL, keep secrets in a managed secret store, use TLS everywhere, place the API behind a load balancer/API gateway, add request IDs and structured logs, add rate limiting on login, configure security headers, add metrics/tracing, and run multiple stateless API instances. I would also use a managed identity provider rather than owning password authentication unless the product specifically required local accounts.

A cloud version could use a CDN plus object/static hosting for the built frontend, containerized API instances behind a managed load balancer, managed PostgreSQL, and centralized logs/metrics. The API is already stateless except for the exercise's local file store, so replacing that store with a database is the main change needed before horizontal scaling.

## Notes for reviewers

The source includes a few first-person comments only where I felt the implementation choice deserved explanation. I avoided commenting obvious lines so the code remains concise and readable.
