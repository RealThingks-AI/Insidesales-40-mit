

# Lock down cross-thread email leaks + observability + manual controls

Comprehensive hardening of reply attribution with full audit trail, monitoring dashboard, manual re-sync, and PDF reporting.

## 1) Stronger subject normalization (shared helper)

Create `supabase/functions/_shared/subject-normalize.ts` as the single source of truth:

- Strip stacked reply/forward prefixes recursively, including localized variants:
  - English: `Re`, `Fw`, `Fwd`
  - German: `AW`, `WG`, `Antwort`, `Weitergeleitet`
  - French: `Rép`, `Tr`
  - Spanish: `RV`, `RES`
  - Italian: `R`, `I`
  - Dutch: `Antw`, `Doorst`
- Strip bracket tags: `[EXT]`, `[External]`, `[SPAM]`, `[#1234]`
- Unicode NFKC normalize, remove zero-width chars, collapse whitespace, lowercase, trim trailing punctuation
- Export `areSubjectsCompatible(a, b)` using token Jaccard ≥ 0.6 OR substring containment ≥ 8 chars
- Mirror in `src/utils/subjectNormalize.ts` for UI guard parity

Apply in:
- `check-email-replies/index.ts` (replaces inline normalizer)
- `_shared/azure-email.ts`
- `CampaignCommunications.tsx` UI guard

Tests in `supabase/functions/check-email-replies/subject_compat_test.ts`:
- Lukas case must return `false`
- `Re: Re: Fw: Hello` vs `Hello` → `true`
- `AW: Angebot` vs `Angebot` → `true`
- `[EXT] Re: Proposal` vs `Proposal` → `true`
- Typo tolerance + null/empty safety

## 2) Persist every skipped reply

New table `email_reply_skip_log`:

```text
id                       uuid pk
created_at               timestamptz default now()
campaign_id              uuid null
contact_id               uuid null
contact_email            text
sender_email             text
subject                  text
conversation_id          text
received_at              timestamptz
parent_communication_id  uuid null
parent_subject           text
parent_sent_at           timestamptz
skip_reason              text   -- chronology | subject_mismatch | contact_mismatch | ambiguous_candidates | no_eligible_parent
details                  jsonb
correlation_id           uuid null
```

RLS: admins + campaign owners can SELECT; only service role can INSERT. Indexes on `(campaign_id, created_at)`, `(contact_id, created_at)`, `(skip_reason)`, `(correlation_id)`.

`check-email-replies` writes a structured row per skip instead of `console.log`.

## 3) Audit page

New route `/settings/email-skip-audit` (admin-gated, linked from `AdminSettingsPage` Logs tab):

- `src/pages/EmailSkipAuditLog.tsx` + `src/components/settings/EmailSkipAuditTable.tsx`
- Filters: date range, campaign, contact, reason
- Columns: When, Campaign, Contact, Sender email, Subject, Reason badge, Parent subject, Parent sent at
- Row click → side drawer with full `details` JSON and considered candidates
- `StandardPagination` + CSV export + PDF download button

## 4) Reply Health dashboard on campaign page

New tab on `/campaigns/:slug` rendered by `src/components/campaigns/ReplyHealthDashboard.tsx`:

- KPI cards: Valid replies (30d), Skipped replies (30d), Skip rate %, Active guards triggered
- Line chart (recharts): valid vs skipped per day, last 30 days
- Stacked bar: top skip reasons
- Table: top offending senders/conversations
- Date-range picker (7d / 30d / 90d / custom)

Sources:
- valid: `campaign_communications` where `sent_via='graph-sync'` and `campaign_id=:id`
- skipped: `email_reply_skip_log` where `campaign_id=:id`

## 5) Manual re-run sync

`check-email-replies/index.ts` accepts POST body:

```json
{ "campaign_id": "...", "contact_id": "optional" }
```

- Scope Graph search and DB queries to that scope
- Stamp every new row (skip log + outbound) with a generated `correlation_id`
- Return `{ correlation_id, scanned, inserted, skipped: { chronology, subject_mismatch, contact_mismatch, ambiguous, no_parent }, durationMs }`

UI in `CampaignCommunications.tsx`:
- New **Re-sync replies** button next to existing Refresh
- Scoped to selected thread's contact when one is open, else whole campaign
- Result dialog shows per-reason counts + "View skipped" link deep-linking to audit page filtered by `correlation_id`

## 6) PDF report

New edge function `supabase/functions/email-skip-report/index.ts`:

- Input: `{ campaign_id?, from, to }`
- Pulls from `email_reply_skip_log`
- Generates PDF via `pdf-lib` (Deno-compatible)
- Sections: cover (range, totals, reason breakdown), per-day breakdown table, per-row detail table
- Returns `application/pdf` stream

UI: **Download PDF report** button on both audit page and Reply Health dashboard with date-range picker.

## Files

**Edge functions**
- `supabase/functions/_shared/subject-normalize.ts` (new)
- `supabase/functions/check-email-replies/index.ts` (use helper, scoped re-run, skip log, summary)
- `supabase/functions/check-email-replies/subject_compat_test.ts` (new)
- `supabase/functions/email-skip-report/index.ts` (new)
- `supabase/config.toml` (register `email-skip-report`)

**Database migration**
- `email_reply_skip_log` table + RLS + indexes

**Frontend**
- `src/utils/subjectNormalize.ts` (new)
- `src/components/campaigns/CampaignCommunications.tsx` (normalizer + Re-sync button + result dialog)
- `src/components/campaigns/ReplyHealthDashboard.tsx` (new)
- `src/pages/CampaignDetail.tsx` (mount Reply Health tab)
- `src/pages/EmailSkipAuditLog.tsx` (new)
- `src/components/settings/EmailSkipAuditTable.tsx` (new)
- `src/components/settings/AdminSettingsPage.tsx` (link to audit page)
- `src/App.tsx` (register `/settings/email-skip-audit`)

## Verification

- Unit tests pass for Lukas pair and localized prefixes
- Re-sync on Campaign 2 → Lukas returns `inserted: 0, skipped: { subject_mismatch: 1 }` and writes audit row
- Audit page lists the row with reason `subject_mismatch`
- Reply Health dashboard shows 1 skip in chosen window
- PDF for that range contains the row with timestamps and blocking guard
- No new graph-sync row created for replies whose normalized subject doesn't match parent

## Technical notes

- `correlation_id` ties manual re-runs to their resulting skip log entries for traceability
- Subject normalizer lives in `_shared/` to guarantee server/client parity; UI mirror imports the same logic shape
- Skip log uses service-role-only inserts to prevent client tampering; RLS lets admins and campaign owners read
- Reply Health charts reuse existing `recharts` dependency; no new packages
- PDF generation uses `pdf-lib` from npm (Deno supports via `npm:` specifier)

