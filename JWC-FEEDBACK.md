# JWC feedback — MyWallet loyihasidan

MyWallet API (JWC) va unga ulangan Angular frontend (`../MyWallet.Web`) qurish
davomida to'plangan kamchiliklar. Har bir band **qayta ishlab chiqarilgan** —
taxmin yo'q; tekshirilmagan joylar alohida belgilangan.

| | |
|---|---|
| `jwc` | 0.6.3 (`git commit 068119b4cd28`, rustc 1.96.0) |
| `jwc-lsp` | 0.6.3 |
| VS Code extension | `jwc-extension.jwc-lang` 0.4.7 |
| OS | Windows 11, PostgreSQL lokal |
| Tekshirilgan sana | 2026-07-27 |

---

## 1. VS Code / LSP — eng ko'p vaqt yegan joy

### 1.1 Problems panelidagi 12 ta xato — hammasi false positive

VS Code 10 ta `ERROR` + 2 ta `WARN` ko'rsatadi, holbuki loyiha muammosiz
kompilyatsiya bo'ladi va ishlaydi:

```
AuthRoutes.jwc        Route POST /auth/register references unknown middleware 'RateLimit'
AuthService.jwc       error[E002]: Unknown entity 'User' used in select expression
CategoryRoutes.jwc    Route GET /categories references unknown middleware 'AuthMiddleware'
CategoryService.jwc   error[E002]: Unknown entity 'Category' used in select expression
StatsRoutes.jwc       Route GET /stats references unknown middleware 'AuthMiddleware'
StatsService.jwc      error[E002]: Unknown entity 'Wallet' used in select expression
TransactionRoutes.jwc Route GET /wallets/{wid}/transactions references unknown middleware 'AuthMiddleware'
TransactionService.jwc error[E002]: Unknown entity 'Transaction' used in select expression
WalletRoutes.jwc      Route GET /wallets references unknown middleware 'AuthMiddleware'
WalletService.jwc     error[E002]: Unknown entity 'Wallet' used in select expression
AuthMiddleware.jwc    [W002] middleware 'AuthMiddleware' is declared but never attached to a route
RateLimitMiddleware.jwc [W002] middleware 'RateLimit' is declared but never attached to a route
```

Sabab: **LSP har faylni alohida tekshiradi, loyiha bo'ylab indeks qurmaydi.**
Entity'lar `Data/AppDbContext.jwc` da, middleware'lar `Infrastructure/` da —
boshqa fayl, demak "unknown". Shu sababli `AuthMiddleware` bir vaqtning o'zida
"hech qayerda ishlatilmagan" (W002) va "mavjud emas" (routelarda) deb turadi —
ikkita diagnostika bir-birini inkor qiladi.

CLI esa toza:

```
$ jwc lint     → No lint warnings for project 'MyWallet' (19 source files)
$ jwc test     → OK: project 'MyWallet' (19 source files)
$ jwc run      → server ishlaydi, barcha endpointlar javob beradi
```

Ya'ni **CLI va LSP bir xil validatorni ishlatmayapti**. Natijada Problems paneli
signal sifatida foydasiz: doim 12 ta qizil, haqiqiy xato kelganda ko'zga
tashlanmaydi. `rootUri` va `workspaceFolders` to'g'ri berilganda ham, 19 ta
faylning hammasi bitta sessiyada `didOpen` qilinganda ham natija o'zgarmaydi.

### 1.2 E'lon qilingan LSP imkoniyatlari ishlamaydi

`initialize` javobidagi capabilities va amalda qaytgan natija:

| Capability | E'lon | Amalda (`WalletService.jwc`, `AppDbContext.Wallet` ustida) |
|---|---|---|
| `hoverProvider` | `true` | `null` |
| `definitionProvider` | `true` | `null` — entityga o'tib bo'lmaydi |
| `completionProvider` | `.`, `:`, `space` trigger | faqat statik kalit so'zlar: `function`, `route`, `entity`, `middleware`… Entity nomi, ustun nomi, `dome` funksiyalari taklif qilinmaydi. `AppDbContext.` dan keyin ham xuddi shu ro'yxat |
| `documentSymbolProvider` | `true` | ishlaydi |
| `renameProvider` | `true` | tekshirilmadi |
| `textDocument/formatting` | e'lon qilinmagan | `-32601 Method not found` — holbuki CLI da `jwc fmt` bor, ya'ni format-on-save yo'q |

Umuman e'lon qilinmagan: `referencesProvider`, `workspaceSymbolProvider`,
`semanticTokensProvider`, `codeActionProvider`, `signatureHelpProvider`.
`textDocumentSync: 1` (full sync) — katta fayllarda har harfda to'liq matn
yuboriladi.

### 1.3 Extension paketining o'zi ham warning beradi

Problems panelida loyiha fayllari orasida extension'ning `package.json` i turadi:

```
package.json  This activation event can be removed as VS Code generates these
              automatically from your package.json contribution declarations.  [Ln 35]
```

### 1.4 Yaxshi tomonlari (o'zgartirish shart emas)

- TextMate grammar to'liq: `dome`, `validate`, `orderby`, `autoincrement`,
  `references`, `errorHandler`, `setContext`, `path_param` — hammasi bo'yalgan.
- 34 ta snippet bor (`Full CRUD controller`, `Validate Body`, `Transaction` …) —
  boshlang'ich skeletni yozishda haqiqatan tez.

---

## 2. Til / parser cheklovlari

Hammasi `jwc check` bilan tasdiqlangan.

| Konstruksiya | Holat | Xato |
|---|---|---|
| `body().amount` | ❌ | `expected ';'` — funksiya natijasidan maydon olib bo'lmaydi, avval `let req = body();` qilish shart |
| `xs[0]` | ❌ | `expected ';'` — list literal (`[1,2,3]`) va `.length` bor, lekin indeks bo'yicha element olib bo'lmaydi |
| `a ? b : c` | ❌ | ternary yo'q |
| `n += 1` | ❌ | compound assignment yo'q, `n = n + 1` |
| `a ?? 0` | ❌ | null-coalescing yo'q, `if (x == null)` yozish kerak |
| `a == 1 && b == 2` | ❌ | `&&` yo'q — `and` ishlaydi (`or` ham) |
| `for i, x in xs` | ❌ | indeksli iteratsiya yo'q; hisoblagichni qo'lda yuritish kerak |
| `else if`, `while`, `try/catch`, string interpolation `"x${n}y"` | ✅ | ishlaydi |

Kod bazasidagi ta'siri ko'rinib turibdi: hamma joyda `let req = body();` +
`req.field`, `StatsService` da qo'lda `walletCount = walletCount + 1`.

**Tip konversiyasi jim ketadi.** `int(path_param("id"))` ga `"abc"` kelganda xato
tashlanmaydi — `GET /wallets/abc` **404** qaytaradi (0 ga aylanib, topilmadi),
400 emas. Route paramlari uchun tip e'loni (`{id:int}`) yo'q, shuning uchun
noto'g'ri so'rov "topilmadi" ga aylanadi.

---

## 3. Query DSL

| Imkoniyat | Holat |
|---|---|
| `sum()`, `avg()`, `count(*)` | ✅ |
| `where ... and ... / or`, `>=` va boshqa taqqoslashlar | ✅ |
| `orderby`, `limit`, `offset` (alohida ham) | ✅ |
| `join` | sintaksis mavjud (parser `join <Entity> on ...` kutadi), sinalmadi |
| **Ustun proyeksiyasi** — `select Tx.amount from C.Tx` | ❌ `expected 'from' after entity name` — faqat butun entity yoki aggregate |
| **`groupby` / `group by`** | ❌ parse xatosi |
| **`distinct`** | ❌ `expected 'from' in select expression` |
| **Bulk update** — `update C.Tx set Tx.amount = 0 where ...` | ❌ — qatorni tanlab, o'zgartirib, `update x in ...` qilish kerak |

Proyeksiya va group by yo'qligi hisobot (statistika) yozishda seziladi: masalan
"kategoriya kesimida xarajat" uchun SQL bir so'rovda qiladigan ishni JWC da
hamma qatorni olib, xotirada guruhlash orqali qilish kerak.

---

## 4. Tiplar va pul — eng jiddiy muammo

Entity ustun tiplari (`jwc check` bo'yicha):

```
int, bigint, decimal(12,2), varchar(n), text, bool, datetime, uuid, json   → qabul qilinadi
long, numeric, money, float, double                                        → Unknown type
```

`bigint` va `decimal` checkerdan o'tadi, lekin loyihada ular **ishlamagan**:
migratsiya tarixi buni saqlab qolgan —

```
1784897956_money-bigint.up.sql   ALTER ... TYPE bigint
1784898189_money-int.up.sql      ALTER ... TYPE integer   ← ortga qaytarish
```

README dagi izoh: *"JWC binds small integers as int4, so the money columns are
int rather than bigint / decimal"*. Ya'ni tip tizimi qabul qiladi, runtime
binding esa qo'llab-quvvatlamaydi. Oqibati: **pul `int` da, ~2.1 mlrd so'm
chegara, kasr yo'q**. Frontend ham shunga moslashgan (butun sonli inputlar).

> Bu bandda runtime xatosini men qayta ishlab chiqarmadim — dalil migratsiya
> tarixi va README. Qolgan hamma band bevosita sinovdan o'tgan.

---

## 5. HTTP runtime

### 5.1 CORS umuman yo'q — brauzer frontend uchun proxy majburiy

```
$ curl -X OPTIONS http://127.0.0.1:7889/stats -H 'Origin: http://localhost:4200'
{"status":404,"error":"Not Found","method":"OPTIONS","path":"/stats"}

GET javobidagi headerlar: Content-Length, Content-Type, Date   ← Access-Control-* yo'q
```

Server ishga tushganda chiqadigan 33 ta `JWC_*` sozlama ichida ham CORS bilan
bog'liq biror o'zgaruvchi yo'q. Shu sababli frontendda
[`proxy.conf.json`](../MyWallet.Web/proxy.conf.json) yozishga to'g'ri keldi.
Production da ham API ni alohida domendan chaqirib bo'lmaydi — reverse proxy
orqasiga qo'yish shart.

### 5.2 Server faqat IPv4 tinglaydi

Vite proxy `localhost:7889` ga ulanolmadi:

```
[vite] http proxy error: /auth/login
Error: connect ECONNREFUSED ::1:7889
```

Node `localhost` ni avval `::1` ga o'giradi, JWC esa IPv6 da tinglamaydi.
Yechim — proxy target'ni `127.0.0.1` qilish. Ikki soatlik "500 Internal Server
Error" shu yerdan chiqqan edi.

### 5.3 Noto'g'ri method 405 emas, 404 beradi

```
POST /stats  →  404   (to'g'risi 405 Method Not Allowed)
```

### 5.4 Xato konverti uch xil shaklda

```jsonc
// 1. validate xatosi (400)
{"errors":{"email":"pattern(^[^@]+@[^@]+\\.[^@]+$)","password":"minLength(8)"}}

// 2. router darajasi (404)
{"status":404,"error":"Not Found","method":"OPTIONS","path":"/stats"}

// 3. handler / errorHandler darajasi
{"error":"category has transactions; delete them first"}
```

Frontendda bitta parser yozib bo'lmaydi — uchalasini ham qo'ldan o'tkazish kerak
bo'ldi ([`api.service.ts` dagi `apiErrorMessage()`](../MyWallet.Web/src/app/core/services/api.service.ts)).
Yana: `errors` ichidagi qiymat DSL qoidasining o'zi (`"min(1): not a number"`),
foydalanuvchiga ko'rsatib bo'lmaydi, tarjima qilib ham bo'lmaydi.

### 5.5 Yaxshi tomonlari

- `/docs` (Swagger UI) va `/openapi.json` (9.5 kB) hech qanday kod yozmasdan ishlaydi.
- Har javobda `x-request-id` bor.
- `validate body { ... }` runtime da haqiqatan ishlaydi, jumladan `min(1)`:
  `{"amount":-5}` → `400 {"errors":{"amount":"min(1)"}}`.
- `transaction { ... }` bloki ishonchli: balans va ledger hech qachon ajralmadi
  (frontenddan tranzaksiya qo'shib/o'chirib tekshirildi).

---

## 6. Bu JWC aybi emas — MyWallet kodidagi ochiq masalalar

Feedbackni toza saqlash uchun ajratib qo'ydim; bularning hammasi til imkoniyati
bor bo'la turib yozilmagan joylar:

1. **Manfiy summa qabul qilinadi.** `POST /wallets/{id}/transactions` da faqat
   `amount: required` bor. Repro: `amount: -9999`, `is_income: false` →
   balans 1000 dan **10999** ga *ko'tarildi*. `min(1)` runtime da ishlaydi —
   validatega qo'shish kifoya. Xuddi shu narsa `balance: -500` bilan wallet
   yaratishda ham.
2. **`StatsService.summary()` hamma tranzaksiyani xotiraga yuklab, `for` bilan
   qo'shadi.** `select sum(...)` mavjud — ikkita so'rov bilan bo'ladi.
3. **`CategoryService.findByName()` foydalanuvchining hamma kategoriyasini
   aylanib chiqadi.** `where Category.user_id == @uid and Category.name == @name`
   ishlaydi (tekshirdim).
4. **RateLimit oynasi siljib ketadi:** har incrementda `cache_set(key, n, 60)`
   TTL ni qayta 60 ga tiklaydi, ya'ni izohda yozilgan "fixed window" emas.
5. **Ro'yxat konvertlari nomuvofiq:** `/wallets`, `/categories` yalang'och array,
   `/wallets/{id}/transactions` esa `{items, limit, offset, total}`. Frontendda
   shu farq runtime xatoga olib keldi (smoke testda tutildi). Wallet/category
   uchun sahifalash umuman yo'q.
6. **`PATCH /wallets/{id}` `balance` ni jimgina e'tiborsiz qoldiradi** —
   `UpdateWalletRequest` da bunday maydon yo'q. Frontendda tahrirlash formasidan
   balansni olib tashlashga to'g'ri keldi.
7. **`/auth/login` faqat `{token}` qaytaradi**, `/me` yo'q — foydalanuvchi ismini
   ko'rsatish uchun frontend uni localStorage da saqlaydi.
8. **JWT muddati yo'q** (`jwt_sign({ sub: u.id })`) va refresh oqimi yo'q.
9. **Parolni tiklash endpointi yo'q** — frontendda `/forgot-password` sahifasi
   shunchaki "qo'llab-quvvatlanmaydi" deb yozadi.

---

## 7. Qayta ishlab chiqarish

```bash
# CLI toza, LSP esa 12 ta xato beradi
jwc lint && jwc test

# Tip / sintaksis tekshiruvlari: bitta .jwc fayl yozib
jwc check probe.jwc

# HTTP xulqi
jwc run                                    # 127.0.0.1:7889
curl -X OPTIONS http://127.0.0.1:7889/stats -H 'Origin: http://localhost:4200' -i
curl -X POST http://127.0.0.1:7889/stats -o /dev/null -w '%{http_code}\n'
curl -X POST http://127.0.0.1:7889/auth/register -H 'Content-Type: application/json' -d '{"email":"bad","password":"x"}'
```

LSP diagnostikasini panelsiz ko'rish uchun `jwc-lsp` ni stdio orqali
`initialize` + har fayl uchun `didOpen` qilib, `textDocument/publishDiagnostics`
xabarlarini yig'ish kifoya — VS Code ko'rsatgan 12 ta diagnostika aynan shunday
qayta hosil qilindi.

---

## 8. `jwc fmt` kodni buzadi ⚠️

Eng jiddiy topilma. Rasmiy formatter valid faylni **parse bo'lmaydigan** holga
keltiradi: `minLength` / `maxLength` ni `min_length` / `max_length` ga
o'zgartiradi, parser esa bunday qoidani tanimaydi.

```bash
$ cp Features/Wallets/WalletRoutes.jwc /tmp/x.jwc
$ jwc check /tmp/x.jwc          → OK
$ jwc fmt   /tmp/x.jwc          → jwc fmt: rewrote 1/1 file(s)
$ jwc check /tmp/x.jwc
  Caused by[0]: unknown validation rule 'min_length' at line 8, col 35
     |
   8 |         name: required, min_length(1), max_length(120);
```

Ya'ni format-on-save yoqilgan bo'lsa (yoki CI da `jwc fmt --check` bo'lsa) loyiha
o'zi buziladi. Ikkinchi marta `jwc fmt` ishlatilganda ham `min_length` qolib
ketadi — o'zini o'zi tuzatmaydi. Ehtimol `jwc upgrade` (deprecation codemod)
mantiqi `fmt` ga kirib qolgan, lekin parser eski nomni kutadi — ikki tomon
kelishmagan.

Yon ta'sir: `fmt` fayl oxirini CRLF dan LF ga o'giradi. Windows da bu butun
faylni "o'zgargan" qilib ko'rsatadi — `AppDbContext.jwc` da mazmun bir xil
bo'la turib 42 satrning hammasi diff ga tushdi.

---

## 9. Entity DSL da yo'q narsalar

`jwc check` bilan sinalgan — hammasi parse xatosi beradi:

| Kerak bo'ladigan narsa | Holat |
|---|---|
| Nullable ustun (`name varchar(50) null` yoki `varchar(50)?`) | ❌ |
| `default` qiymat | ❌ |
| `index` (bitta ustun) | ❌ |
| Kompozit `unique(a, b)` | ❌ |
| `enum` tipi | ❌ (top-level `enum` bloki ham qabul qilinmaydi) |
| Serializatsiyadan yashirish (`hidden` / `ignore`) | ❌ |
| Avto `created_at` / `updated_at` | ❌ — har joyda qo'lda `now()` |
| `on update cascade` | ❌ — `only 'on delete' is supported` |
| Eager loading (`include` / `with`) | ❌ |

Ikkita jiddiy oqibati bor:

**1. Hamma ustun `NOT NULL`.** `jwc gen-sql` chiqishi buni tasdiqlaydi — 4 ta
jadvalning har bir ustuni `NOT NULL`. "Ixtiyoriy" maydon uchun bo'sh satr yoki
`0` sentinel ishlatishdan boshqa yo'l yo'q (MyWallet da `description` aynan
shunday: `if (desc == null) { desc = ""; }`).

**2. Hech qanday indeks yaratilmaydi.** `jwc gen-sql` da bitta ham
`CREATE INDEX` yo'q — faqat PK va `unique`. Ya'ni `wallet.user_id`,
`transaction.wallet_id`, `transaction.user_id`, `category.user_id` — hammasi
indekssiz. `select ... where user_id == @u` har safar seq scan; ma'lumot
o'sganda `/stats` va ro'yxatlar sekinlashadi. Entity DSL da indeks e'lon qilish
imkoni yo'qligi uchun buni faqat qo'lda migratsiya yozib qo'shish mumkin.

**3. `via` munosabatlari JSON ga chiqmaydi.** `Transaction` da
`wallet: Wallet via wallet_id` va `category: Category via category_id` e'lon
qilingan, lekin javobda faqat FK id lar keladi:

```json
{"amount":300000,"category_id":6,"created_at":"…","description":"july",
 "id":5,"is_income":true,"user_id":13,"wallet_id":4}
```

`include`/`with` sintaksisi ham yo'q, shuning uchun frontend kategoriya nomini
ko'rsatish uchun alohida `/categories` so'rovini olib, id → nom map'ini o'zi
qurdi ([`transactions.component.ts`](../MyWallet.Web/src/app/features/transactions/transactions.component.ts)).

> **Loyiha muallifining kuzatuvi:** DB tomonida `on delete cascade` dan boshqa
> bog'liqlik/atribut imkoniyatlari amalda ishlamagan. Yuqoridagi jadval shu
> tajriba bilan mos tushadi — parser darajasidayoq rad etiladi.

---

## 10. Yana bir nechta til/toolchain kamchiligi

- **`async` `dome` ichida ishlamaydi.** Top-level da `async function` OK, lekin
  `dome S { async function f() … }` → `expected function declaration inside dome
  block`. Biznes-logika esa aynan dome larda yashaydi. Extension'da "Async
  Function" (`afn`) snippeti bor — ya'ni snippet parser rad etadigan kodni
  taklif qiladi. `public` / `private` modifikatorlari ham dome ichida ishlamaydi
  (top-level da ishlaydi).
- **`throw` yo'q.** Domen xatosini ko'tarib bo'lmaydi; har bir funksiya `null`
  qaytarib, chaqiruvchi tomon tekshirishi kerak. `try/catch` faqat runtime
  xatolarini (masalan `jwt_verify`) tutadi. Natijada `Shared/ErrorHandler.jwc`
  amalda faqat kutilmagan xatolar uchun qoladi.
- **Default parametr yo'q** (`function f(a: int = 5)` → parse xatosi), overload
  ham yo'q — har xil variant uchun alohida funksiya nomi kerak.
- **`jwc test` — bu unit test emas.** Yordamida yozilgani: *"Validate current
  project sources"*. Ya'ni til bilan birga keladigan test freymvorki umuman yo'q:
  `dome` funksiyasini yoki route'ni avtomatik sinash uchun tashqi vosita (curl,
  Postman, boshqa tildagi test) yozish kerak. CI uchun `--deny-warnings` bor,
  lekin sinaladigan narsa faqat sintaksis.
- **`jwc check <file>` ham faylma-fayl ishlaydi** — `WalletService.jwc` ni yakka
  tekshirsangiz "Unknown entity 'Wallet'" beradi. LSP dagi 12 ta soxta xato
  (§1.1) aynan shundan: LSP loyiha emas, fayl tekshiradi. Ya'ni ildiz sabab
  bitta va uni bir joyda tuzatsa bo'ladi.
- **Yaxshi tomoni:** migratsiya vositasi kuchli — `migrate new/up/down/list/
  status`, `status` da applied/pending/sha-mismatch matritsasi bor, `gen-sql`
  toza DDL chiqaradi, `group`/`namespace`/`mount` bilan modul tizimi mavjud,
  `route WS` (websocket) sintaksisi parse bo'ladi.

---

## 11. Ustuvorlik bo'yicha taklif

| # | Muammo | Nega birinchi |
|---|---|---|
| 1 | **`jwc fmt` valid kodni buzadi** (§8) | Format-on-save yoki CI loyihani ishdan chiqaradi; tuzatish arzon (bitta nom moslashtirish) |
| 2 | LSP/`check` loyiha bo'ylab indeks qurmaydi (§1.1, §10) | Har kuni, har faylda ko'rinadi; Problems paneli ishonchini yo'qotadi |
| 3 | CORS yo'q (§5.1) | Har qanday brauzer frontendi proxy'siz ishlamaydi |
| 4 | Pul uchun bigint/decimal binding (§4) | Fintech loyihada arxitektura darajasidagi cheklov |
| 5 | Indeks e'lon qilib bo'lmaydi, FK ustunlari indekssiz (§9) | Ma'lumot o'sishi bilan hamma ro'yxat seq scan bo'ladi |
| 6 | Nullable ustun yo'q — hamma maydon `NOT NULL` (§9) | Ixtiyoriy maydon uchun sentinel qiymat ishlatishga majbur qiladi |
| 7 | Xato konvertining uch xilligi (§5.4) | Har bir frontend integratsiyasida qayta yoziladi |
| 8 | Test freymvorki yo'q (§10) | Biznes-logikani avtomatik sinab bo'lmaydi |
| 9 | `hover` / `go-to-definition` bo'sh javob (§1.2) | Notanish kod bazasini o'qishni sekinlashtiradi |
| 10 | `body().x`, `xs[0]`, ternary, `+=`, `throw`, dome ichida `async` (§2, §10) | Kundalik ergonomika |
| 11 | Query DSL: proyeksiya, group by, distinct, eager load (§3, §9) | Hisobot/statistika va JOIN talab qiladigan ekranlarda |
