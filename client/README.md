# MyWallet.Web

Angular 19 + PrimeNG frontend for the **MyWallet** JWC API (`../MyWallet`).
Built on the [`angular-template`](https://github.com/Nodirbek-Abdulaxadov/angular-template)
admin starter — the mock data layer was replaced with real HTTP calls and the
demo pages were removed.

## Stack

| Concern | Choice |
|---|---|
| Framework | Angular 19 (standalone components + signals) |
| UI kit | PrimeNG 19 + `@primeng/themes` **Aura** preset |
| Styling | Tailwind CSS 3 + `tailwindcss-primeui`, CSS layers |
| Theming | Dark/light via `.app-dark` (`ThemeService`, persisted) |
| i18n | `@ngx-translate/core`, `en` / `uz` in `public/i18n/` |
| Auth | JWT from `/auth/login`, attached by an HTTP interceptor |

## Run

The API must be up first (`jwc run` in `../MyWallet`, default port **7889**):

```bash
npm install
npm start        # ng serve -> http://localhost:4200
npm run build    # production build
```

`proxy.conf.json` forwards `/api/*` to `http://127.0.0.1:7889` in dev, so there
is no CORS setup and no absolute API host in the code. For a deployment, point
`apiUrl` in `src/environments/environment.ts` at the public API origin.

> The proxy target uses `127.0.0.1`, not `localhost` — the JWC server listens on
> IPv4 only, and Node resolves `localhost` to `::1` first.

## Pages

| Route | What it does |
|---|---|
| `/` | Dashboard — `/stats` cards, balance per wallet, income vs expense, latest transactions |
| `/wallets` | Wallet list, create / rename / delete (delete removes its transactions) |
| `/transactions` | Ledger of the selected wallet (`?wallet=<id>`), create and delete entries |
| `/categories` | Category list with usage counter, create / edit / delete |
| `/profile` | Read-only account card + totals |
| `/settings` | Theme and language (stored in the browser) |
| `/login`, `/register` | `/auth/login`, `/auth/register` |

## API notes baked into the UI

- **Money is an integer** (whole so'm) everywhere — no decimals in the inputs.
- A wallet's **balance is not editable**: `PATCH /wallets/{id}` only takes
  `name` / `currency`; the balance moves only through transactions.
- `GET /wallets/{id}/transactions` answers with `{ items, limit, offset, total }`,
  which is what drives the "Load more" paging.
- Deleting a category is refused (400) while transactions still reference it —
  the API message is surfaced in the toast.
- There is **no password-reset endpoint**, so `/forgot-password` says so instead
  of pretending to send a mail.

## Layout

```
src/app/
  core/        models, token storage, auth interceptor,
               services (api, auth, wallets, categories, transactions, stats,
               layout, language, theme, toast), guards, global error handler
  layout/      app-layout, sidebar, topbar, footer, nav config
  features/    dashboard, wallets, transactions, categories,
               profile, settings, auth/*, not-found
  shared/      page-header, placeholder
public/i18n/   en.json, uz.json
```
