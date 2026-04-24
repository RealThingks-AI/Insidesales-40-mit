

# Reply-attribution hardening — status & remaining work

## What's already in place ✅

**Edge functions**
- `supabase/functions/_shared/subject-normalize.ts` — full helper with all localized prefixes, bracket tags, NFKC, `areSubjectsCompatible` (Jaccard ≥ 0.6 + substring ≥ 8)
- `supabase/functions/check-email-replies/index.ts` — uses the shared helper, accepts POST `{ campaign_id, contact_id }`, scopes queries, generates `correlation_id`, writes structured rows to `email_reply_skip_log` for every skip path (chronology, subject_mismatch, contact_mismatch, ambiguous, no_parent), returns the summary object
- `supabase/functions/check-email-replies/subject_compat_test.ts` — test file present
- `supabase/functions/email-skip-report/index.ts` — PDF generator using `pdf-lib` (cover, breakdown, daily, per-row detail, page footer)
- `supabase/config.toml` — `email-skip-report` registered with `verify_jwt = true`

**Database**
- `email_reply_skip_log` table exists with all planned columns, RLS (admins + campaign owners SELECT, service-role INSERT only)

**Frontend**
- `src/utils/subjectNormalize.ts` — UI mirror of helper
- `src/components/settings/EmailSkipAuditTable.tsx` (286 lines) — table component
- `src/pages/EmailSkipAuditLog.tsx` (53 lines) — admin-gated page
- `src/components/campaigns/ReplyHealthDashboard.tsx` (243 lines) — KPIs/charts component

---

## What's broken or missing ❌

### 1. BUILD ERROR — blocks deploy
`email-skip-report/index.ts` imports `npm:pdf-lib@1.17.1`, but the Deno worker can't resolve npm specifiers without a `node_modules` dir or `nodeModulesDir: "auto"` in `deno.json`. Plan said pdf-lib is fine, but the actual sandbox rejects it.

**Fix:** swap to an esm.sh import that works under Lovable's Deno: `import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1?target=deno";`

### 2. New pages and components are NOT wired into the app
None of these are reachable today:
- `src/App.tsx` has no `/settings/email-skip-audit` route → **EmailSkipAuditLog page is dead code**
- `src/pages/CampaignDetail.tsx` does not mount `ReplyHealthDashboard` → **dashboard is dead code**
- `src/components/settings/AdminSettingsPage.tsx` has no link to the audit page
- `src/components/campaigns/CampaignCommunications.tsx` has **no Re-sync button**, no result dialog, no call to `check-email-replies` with `{ campaign_id, contact_id }`, and no deep-link to `/settings/email-skip-audit?correlation_id=…`

### 3. CSV / PDF buttons in audit table
EmailSkipAuditTable needs:
- "Download PDF report" button → invokes `email-skip-report` with current filters, downloads blob
- "Export CSV" button using existing CSV export pattern
- Read `?correlation_id=` from URL and apply as a hidden filter when present (so the Re-sync result deep-link works)

### 4. Reply Health needs a date-range picker + PDF button
Component exists but the plan calls for a 7d/30d/90d/custom picker and a "Download PDF report" button bound to the chosen range and current campaign id.

### 5. CORS header parity
`email-skip-report` allow-headers list is missing `x-supabase-client-platform`, `x-supabase-client-platform-version`, etc. — minor; web client may send them. Add the standard set used elsewhere.

---

## Implementation plan (default mode)

**A. Fix the build error**
1. `email-skip-report/index.ts` — replace `npm:pdf-lib@1.17.1` with `https://esm.sh/pdf-lib@1.17.1?target=deno`
2. Expand CORS headers to the standard list used by other functions

**B. Wire routes & links**
3. `src/App.tsx` — add `<Route path="/settings/email-skip-audit" element={<ProtectedRoute><EmailSkipAuditLog/></ProtectedRoute>} />` (lazy import)
4. `src/components/settings/AdminSettingsPage.tsx` — add a "View email reply skip audit" link/button in the Logs section pointing to `/settings/email-skip-audit`
5. `src/pages/CampaignDetail.tsx` — add a "Reply health" tab that renders `<ReplyHealthDashboard campaignId={id} />`

**C. Re-sync UX in CampaignCommunications**
6. Add **Re-sync replies** button next to the existing Refresh control
7. Scope: pass `contact_id` when a thread is open, otherwise just `campaign_id`
8. On success, open a small dialog summarising `inserted`, `skipped` per reason, and a "View skipped" link to `/settings/email-skip-audit?correlation_id=…`
9. Apply the UI subject-compat guard (using `src/utils/subjectNormalize.ts`) when grouping inbound replies into threads — drop any inbound whose normalized subject is incompatible with the parent

**D. Audit table polish**
10. Read `correlation_id` from query string and apply as filter chip
11. **Export CSV** button (current filtered rows)
12. **Download PDF report** button → POST to `email-skip-report` with `{ campaign_id?, from, to }` and stream the blob to the browser
13. Side drawer on row click showing the full `details` JSON pretty-printed

**E. Reply Health polish**
14. Date-range presets (7d / 30d / 90d / custom) feeding both the queries and the PDF button
15. **Download PDF report** button bound to selected range + `campaignId`

**F. Verification**
16. Deno test for `subject_compat_test.ts` passes (Lukas false; localized prefixes true; null-safe)
17. Manual re-sync on Campaign 2 → response shape matches `{ correlation_id, inserted, skipped: {...} }` and a row appears in audit page
18. Reply Health shows the new skip in chosen window
19. PDF downloads cleanly and contains the row

## Files to change

- `supabase/functions/email-skip-report/index.ts` — pdf-lib import + CORS
- `src/App.tsx` — register route
- `src/pages/CampaignDetail.tsx` — mount Reply Health tab
- `src/components/settings/AdminSettingsPage.tsx` — link to audit page
- `src/components/campaigns/CampaignCommunications.tsx` — Re-sync button, dialog, UI subject guard
- `src/components/settings/EmailSkipAuditTable.tsx` — correlation_id filter, CSV export, PDF button, details drawer
- `src/components/campaigns/ReplyHealthDashboard.tsx` — date-range picker + PDF button

No new dependencies, no new database changes — schema is already correct.

