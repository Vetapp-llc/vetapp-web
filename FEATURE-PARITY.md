# PHP → Next.js feature parity

Does the new clinic portal have everything the old PHP app had?
**Not yet.** The backend covers nearly all of it; the web UI is the gap.

Compared `vetapp-php-frontend/admin` (145 PHP pages) against
`vetapp-web` + `vetapp-backend`. Row counts are live Supabase data as of
2026-07-27 and are what should drive priority — several legacy pages
back onto tables that are empty or gone.

## Already at parity

| Feature | Legacy pages | Status |
|---|---|---|
| Pet register + search | `pets.php`, `searchpet.php`, `search*.php` | Done |
| Owner lookup / create | `owner.php` | Done |
| Procedure history per pet | `procedures.php`, `v*.php`, `z*.php` | Done |
| Add procedures (all types) | `addvac`, `addtest`, `adddeh`, `addecto`, `addprocedure*` | Done |
| Prices catalogue (132 rows) | `prices.php`, `priceadd.php` | Done |
| Staff / vets (38) | `vets.php`, `addvet.php` | Done |
| Clinic stats + daily revenue | `jami.php`, `total*.php` | Done |
| Payments + card/cash split | `paystatus.php` | Done (was broken; fixed) |
| Public pet profile by QR/PIN | `pdf.php` viewer | Done |
| Admin cross-clinic overview | `cross.php`, `cross2.php` | Done |

### The per-category procedure pages are NOT a gap

The legacy app has separate pages *and tables* for sterilisation,
dentistry, surgery, consultations, lab work. Those tables are empty or
absent in Supabase:

```
steril, stomatology, cons      → table does not exist
operation, procedurebi, anlyse → 0 rows
tmslot, event_calendar         → 0 rows
```

That data was consolidated into `vaccination` behind `tp` codes, and
**all 20 codes in live use are mapped** in the new backend
(`procedureTypeNames`) — including 106 surgery, 110 sterilisation,
101 dentistry, 203 ophthalmology, 116 lab. Nothing is unreachable.

## Gaps — backend ready, no web UI

These endpoints are implemented and return 200; nothing in `vetapp-web`
calls them. Ordered by how much real data is stranded.

| Feature | Rows | Endpoint | Legacy page |
|---|---|---|---|
| **Retail sales (shop)** | **9,523** (2,353 in last 12mo) | `GET/POST /api/shop` | `shop.php`, `shopadd.php` |
| Appointments / time slots | 2,085 (76 in last 12mo) | `GET/POST /api/appointments` | `timeslot.php`, `operationdate.php` |
| Border-crossing certificate | — | `GET /api/pets/{id}/certificate` | `pdf.php`, `pfd.php` |
| Full clinic history view | — | `GET /api/pets/{id}/history` | `clinichistory.php` (1,290 lines) |
| Allergies / diseases register | 28 | `GET/POST /api/allergies` | `valergy.php`, `addeals.php` |

**Shop is the priority.** It is real, current revenue (2,353 sales in the
last year) that the new portal cannot show or record.

Appointments has volume historically but only 76 rows in the last
year — worth confirming with the clinic whether they still use it
before investing in the UI.

## Gaps — nothing built yet

| Feature | Rows | Legacy page | Note |
|---|---|---|---|
| Lab result file upload | 155 files | `upload77.php`, `uploadanalyse.php` | No backend endpoint either. Needs file storage (S3/Supabase Storage) — the legacy app wrote files to local disk, which does not survive on Railway. |

## Not carried over — appears deliberate

- `promo.php` (promo codes) — the `promo` table does not exist in
  Supabase, so there is nothing to migrate.
- `oldpets.php` (1,096 lines) — legacy archive view.
- The `*2.php`, `*copy.php`, `*reserve*.php` duplicates: the PHP app has
  many near-identical variants of the same page (e.g. `vprocedure.php`,
  `vprocedure2.php`, `vprocedure22.php`, `vprocedurereserve22.php`).
  These are edit-in-place forks, not distinct features.

## Suggested order

1. **Shop UI** — list + add sale. Backend already accepts `method` and
   `comment`; largest stranded dataset.
2. **Certificate** — read-only, backend done, high perceived value.
3. **Clinic history view** — consolidates what `clinichistory.php` did.
4. **Appointments** — confirm demand first.
5. **Lab uploads** — needs a storage decision before any code.
