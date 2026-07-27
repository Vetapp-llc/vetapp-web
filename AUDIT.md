# Web app audit + legacy PHP comparison

Reviewed 2026-07-27. Covers `vetapp-web` (Next.js clinic portal), its
backend dependencies, and a feature comparison against the legacy PHP
app in `vetapp-php-frontend/admin` (145 pages).

## Fixed in this pass

### 1. Clinic could not take payments at all (backend, critical)

`models.Payment` described a table that does not exist. Real schema is
`paymethod(id, zip, date, uuid, sum, pay)`; the struct assumed
`sk, amount, method, vet_id, owner`. GORM therefore generated columns
that aren't there and **every** read and write failed with
`column "..." does not exist` (SQLSTATE 42703).

Broken as a result:

| Endpoint | Was | Now |
|---|---|---|
| `POST /api/payments/record` | 500 | 201 |
| `GET /api/payments/history` | 500 | 200 |
| `GET /api/payments/daily` | empty totals | real totals |
| `GET /api/stats/clinic/daily` | card/cash always 0 | real split |
| `GET /api/shop` | 500 | 200 |

This is the clinic's revenue path — the web app's VisitBuilder
("record visit → take payment") could never complete a payment.

Column mapping was confirmed against the legacy PHP writer
(`admin/paystatus.php`: `insert into paymethod (zip, date, uuid, sum, pay)`).

`pay` stores Georgian method labels — "ბარათი" (card) and
"ნაღდი ანგარიშწორება" (cash) — so `models.NormalizePayMethod` translates
the API's `card`/`cash` on write. Without that, new payments would not
appear in the clinic's existing reports, which GROUP BY that column.

Verified against real data: 2026-07-07 = 5,840 card + 1,345 cash =
**7,185 GEL**, matching the row-level history.

### 2. Same bug in `shop`

`shop(id, date, name, coment, price, zip, pay)` — the model mapped `sk`
and declared a `vetname` column that doesn't exist. Fixed, and the sale
API now accepts `method` and `comment`, the two fields the legacy sale
form records and the new one silently dropped.

### 3. `?` inside a SQL regex broke the aggregates

GORM counts every literal `?` in a raw query as a bind placeholder, so
a numeric-guard regex containing `(\.[0-9]+)?` desynchronised the
argument list and the query failed with `unused argument`. Both revenue
aggregates now use `{0,1}`.

### 4. Missing Georgian string on the public QR page

`petProfile.poweredBy` existed only in English, so the pet passport page
that owners reach by scanning a tag rendered a raw key in Georgian.
Added; both locales are now 288/288.

## Guarded against regression

`internal/models/legacy_columns_test.go` pins each Go field to its real
column. This matters because the legacy schema is **not** consistent:

- `zip` is the clinic column on `shop`, `paymethod`, `prices`
- `sk` is the clinic column on `vaccination`, `alergy`, `eals`, `operationdate`

so a blanket rename in either direction would break the other half. The
tests use GORM's schema parser and need no database.

## Legacy PHP → new stack comparison

### Already at parity

The PHP app has separate pages and tables per procedure category
(`vsterile`, `vstomatology`, `voperation`, `vconsultation`,
`viewprocedurebi`). Those tables are **empty or absent** in Supabase:
`steril`, `stomatology`, `cons` don't exist; `operation`, `procedurebi`,
`anlyse`, `tmslot`, `event_calendar` have 0 rows.

That functionality was consolidated into `vaccination` behind `tp`
codes, and all 20 codes in live use are mapped in the new backend
(`procedureTypeNames`) — including 106 surgery, 110 sterilisation,
101 dentistry, 203 ophthalmology. **No procedure data is unreachable.**

Also covered: pet register, owner lookup, prices, staff, clinic stats
(daily/monthly/yearly), payments, QR/PIN public profile.

### Backend ready, no web UI yet

These endpoints work (verified 200) but nothing in `vetapp-web` calls
them. They are build-out gaps, not defects:

| Feature | Endpoint | Legacy equivalent |
|---|---|---|
| Border-crossing certificate | `GET /api/pets/{id}/certificate` | `pdf.php` / `pfd.php` |
| Retail sales (shop) | `GET/POST /api/shop` | `shop.php`, `shopadd.php` |
| Appointments / time slots | `GET/POST /api/appointments` | `timeslot.php` (2,085 rows in `operationdate`) |
| Allergies register | `GET/POST /api/allergies` | `valergy.php`, `addeals.php` |
| Full clinic history view | `GET /api/pets/{id}/history` | `clinichistory.php` |

Shop is the most commercially significant: 9,523 rows of real sales
history that the new portal cannot display.

### Not carried over (appears deliberate)

`promo.php` (promo codes) — the `promo` table does not exist in
Supabase, so there is nothing to migrate.

## Verified working

Web: TypeScript clean, i18n 288/288 both locales, login proxy, all
clinic API routes, both public QR profile locales.

Clinic API (vet token): pets, owners, prices, shop, appointments,
allergies, stats (clinic/daily), payments (daily/history/record),
certificate, history — all 200.

Owner API (mobile shares this backend): auth/me, pets, calendar,
visits — all 200.

Test data created during the audit (payments 87692/87693, shop 9694)
was deleted; verified 0 rows remaining.

## Still open — your call

- **Deploy.** The backend repo has unrelated uncommitted work, so
  nothing was committed or pushed. The payment fixes are needed in
  production before the clinic can charge through the new system.
- `AES_SALT` on Railway must be `DW3Z07FI`, not the old MySQL salt.
- Resend is still in sandbox (delivers only to vetapp.develop@gmail.com).
