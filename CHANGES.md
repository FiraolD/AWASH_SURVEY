# Awash Survey – Security fixes + Phase 1 (drop-in files)

Unzip into the project root; files land at their existing paths (new files are marked NEW).
`phase1.diff` shows every change against the files you uploaded. Nothing in the DB schema, routes or
server-action signatures was changed (exception: `actions/users.ts` now returns `{ok,error}` – the call sites in
`AdminUsersTable.tsx` are updated).

> Paths were inferred from the flat upload names. If any file belongs elsewhere in your tree, copy it by name.

## Before you start
1. `.env` must contain `AUTH_SECRET` and (for /console) `CONSOLE_PASSWORD`.
2. Delete `theme-toggle.tsx` (unused, references CSS classes that don't exist).
3. `0001_init.sql` was empty in the upload. If it is empty in your repo too, regenerate it from the live DB:
   `pg_dump --schema-only --no-owner --no-acl survey_spare > db/migrations/0001_init.sql`

## Security
| File | Change |
|---|---|
| `server/console-auth.ts` NEW | Signed, expiring console cookie (HMAC with AUTH_SECRET), constant-time password compare, login rate limit (5 tries / 15 min), Secure flag only on HTTPS |
| `server/permissions.ts` | `requireUser()` no longer trusts `console_auth=true`; it verifies the signed token |
| `server/actions/console.ts`, `app/console/page.tsx` | Use the signed token; cookie scoped to `/console`, 8 h |
| `server/actions/users.ts` | **Admin-only**, zod-validated, audited via `withActor`; cannot deactivate yourself, remove your own admin role, or remove the last active admin |
| `server/actions/items.ts` | Surveyors can only change items in their own reports; bulk delete/move/recovery/reorder are scoped to one report; undo (`restoreItems`) keeps original ids |
| `server/actions/reports.ts` | `createDraftReport` always uses the signed-in user; `finalizeReport` checks ownership |
| report page, preview page, PDF route | Surveyors get 404/403 for other people's reports |
| `server/actions/sql.ts` | Removed duplicate `MigrationFile` type (typecheck error); console now shows real applied/pending status |

## Phase 1 (UX / performance)
| File | Change |
|---|---|
| `reports/page.tsx`, `ReportsFilterBar.tsx`, `admin/audit/page.tsx` | Use the URL's locale (was always Amharic); all labels translated; branch name instead of code; status/coverage labels; parallel DB queries |
| `queries/reports.ts` | Adds `branch_names` to the list query |
| `tailwind.config.ts`, `app/layout.tsx`, `globals.css` | Latin text uses a clean UI font, Ethiopic falls back to Noto Sans Ethiopic (no more serif English); removed the rule that forced inputs into the Ethiopic font; 16 px inputs on phones; reduced-motion support |
| `[locale]/layout.tsx`, `HtmlLang.tsx` NEW | `<html lang>` follows the URL |
| `lib/format.ts` NEW | One date format `dd/MM/yyyy` (Addis Ababa time for timestamps) – used in list, audit log, printed form and PDF |
| `(app)/loading.tsx` NEW | Instant skeleton while pages load |
| `ReportForm.tsx` | Part search aborts stale requests (no flicker / wrong results) |
| `ui/Button`, `Modal`, `Toast`, `Pagination` | 36 px touch targets on phones, aria-labels on icon buttons, modals scroll on small screens, toasts full-width on phones, pagination wraps, Amharic pagination text |
| `error.tsx`, `not-found.tsx`, `global-error.tsx` | Locale-aware links, brand colours; global-error now actually loads the CSS |
| `AdminUsersTable.tsx` | `unwrap()` on user actions so error messages survive production mode |

## Important: production mode hides thrown error messages
Next.js replaces the message of any error *thrown* from a server action with a generic one when running `next start`.
Most of your actions still throw (items, reports, parts). The user actions now return `{ok:false,error}` (pattern:
`lib/action-result.ts`, `server/action-utils.ts`). The same conversion for the report editor lands with Phase 2.
Until then, keep using `next dev` for day-to-day testing, or expect generic toasts in production for those actions.

## Test checklist
- [ ] `npm run typecheck` (I could only syntax-check; fix any small type error and tell me)
- [ ] Open `/en/reports`: everything English, dates `dd/MM/yyyy`, branch names shown
- [ ] `/am/reports`: everything Amharic
- [ ] Console: old cookies stop working → log in again at `/console`
- [ ] As a surveyor, open another surveyor's report URL → 404; PDF URL → 403
- [ ] As admin: create / edit / deactivate a user; try deactivating yourself (blocked)
- [ ] Editor: add parts, Ctrl+Z, then remove a restored item (should persist)
- [ ] Phone (or browser devtools 390 px): modal scrolls, toasts full width, buttons easy to tap
