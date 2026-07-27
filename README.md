# MyWallet

A small personal-finance app: an API written in **[JWC](https://jwc.1kb.uz)**
(Just Web Code) on top of PostgreSQL, plus an Angular web client. Users register,
open wallets, categorise spending, record income/expense transactions (with atomic
balance updates), and read a rollup of their finances.

## Stack

**Backend**

- **JWC** — routes, `dome` services, entities, middleware, and the query layer
- **PostgreSQL** — persistence, driven by JWC migrations
- **JWT** auth + per-IP rate limiting on the public auth routes

**Frontend** (`client/`)

- **Angular 19** — standalone components, signals, lazy-loaded routes
- **PrimeNG 19** + **Tailwind CSS** — UI kit and styling, dark/light theme
- **TanStack Query** — server state, caching, invalidation
- **ngx-translate** — English / O'zbek, persisted to `localStorage`
- **Chart.js** — dashboard charts; **zod** — response validation

## Layout

```
Data/AppDbContext.jwc          entities + dbcontext (User, Wallet, Category, Transaction)
Features/
  Auth/                        register / login, JWT, RegisterRequest / LoginRequest
  Wallets/                     wallet CRUD
  Categories/                  category CRUD (+ usage counter)
  Transactions/                income / expense with atomic balance moves
  Stats/                       per-user summary
Infrastructure/
  AuthMiddleware.jwc           verifies `Authorization: Bearer <jwt>`
  RateLimitMiddleware.jwc      60 req / 60s per IP on auth routes
Shared/ErrorHandler.jwc        global JSON error envelope
migrations/                    SQL migrations
main.jwc                       setConnectionString() + serve()

client/src/app/
  core/                        models, token storage, auth guard + interceptor,
                               one service per API area, theme / language / toast
  features/                    auth, dashboard, wallets, categories,
                               transactions, settings, profile, not-found
  layout/                      shell: sidebar, topbar, footer
  shared/                      page header, placeholder
client/public/i18n/            en.json / uz.json
```

## Setup

1. Copy the env template and fill it in:

   ```
   cp .env.example .env
   ```

   | Variable | Meaning |
   |----------|---------|
   | `PG_HOST` / `PG_PORT` / `PG_USER` / `PG_PASSWORD` / `PG_DATABASE` | Postgres connection |
   | `JWT_SECRET` | secret used to sign / verify JWTs |
   | `PORT` | HTTP port (default 8080) |

2. Apply the migrations:

   ```
   DATABASE_URL="postgres://postgres:PASSWORD@localhost:5432/MyWallet" jwc migrate up
   ```

3. Run the server:

   ```
   jwc run          # or: jwc serve --port 7889 --watch
   ```

Interactive API docs are served automatically at **`/docs`** (Swagger UI) and
**`/openapi.json`** — no code required.

## Client

With the API running on port 7889:

```
cd client
npm install
npm start          # http://localhost:4200
```

`proxy.conf.json` forwards `/api/*` to `http://127.0.0.1:7889` and strips the
`/api` prefix, so dev needs no CORS setup. `client/src/environments/environment.ts`
holds `apiUrl` (`/api` by default) — point it at the public API origin for a real
deployment. `npm run build` emits to `client/dist/`.

The JWT is kept in `localStorage`; an HTTP interceptor attaches it and `authGuard`
protects every route outside `/login`, `/register` and `/forgot-password`.

## Endpoints

All routes except the two auth routes require `Authorization: Bearer <token>`.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | rate-limited |
| POST | `/auth/login` | rate-limited → `{ token }` |
| GET / POST | `/wallets` | list / create |
| GET / PATCH / DELETE | `/wallets/{id}` | deleting a wallet also deletes its transactions |
| GET / POST | `/categories` | names are unique per user |
| GET / PATCH / DELETE | `/categories/{id}` | delete refused (400) while transactions reference it |
| GET / POST | `/wallets/{wid}/transactions` | list (paged) / create |
| GET / DELETE | `/transactions/{id}` | delete reverses the balance effect |
| GET | `/stats` | wallets, total balance, income, expense, net |

### Example

```bash
curl -X POST localhost:7889/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@b.c","password":"secret123","first_name":"A","last_name":"B"}'

TOKEN=$(curl -s -X POST localhost:7889/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"a@b.c","password":"secret123"}' | jq -r .token)

curl -X POST localhost:7889/wallets -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Cash","currency":"UZS","balance":100000}'
```

## Notes

- **Money is stored as an integer** (`int`, whole so'm). JWC binds small integers
  as `int4`, so the money columns are `int` rather than `bigint` / `decimal` —
  amounts up to ~2.1B per row.
- **Balance integrity**: creating or deleting a transaction moves the wallet
  balance inside the same DB transaction, so the ledger and the running balance
  never drift.
- **Rate limit** is an in-process fixed window (single replica). Behind multiple
  pods, back it with a shared cache.
