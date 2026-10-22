# Greenlight — build spec (draft, 22 Oct 2026)

Goal: stop scammers getting into communities while letting real builders in fast. Demo-first; cut scope before risking a broken demo.

## Stack (simplest that demos reliably)
- Next.js (App Router) + TypeScript, deployed on Vercel
- Supabase: Postgres + RLS + Auth (magic link for moderators)
- LLM scoring via server route (key in env, never in repo)
- discord.js bot (official API) as a separate small Node process
- License: MIT. README with setup steps from the first commit.

## Modules (priority order)
1. **Applicant scorer** (must-have): input = community rules (markdown) + application (name, handle, phone, email, github, text). Output = accept | ask | decline, score 0-100, reason citing rule numbers. Signals: rules fit (LLM), StopForumSpam (email, cached), GitHub API (account age, repos), spam-text classifier, shared-blocklist hit.
2. **Shared blocklist** (must-have): table `blocklist_entries(id, community_id, phone_hmac, handle_norm_hmac, email_hmac, evidence, reporter, status pending|confirmed|appealed|cleared, created_at)`. HMAC-SHA256 with server secret (never a plain hash). Handle normalisation: lowercase, strip `@ . _ -` and trailing digits. RLS: a community sees its own pending entries; everyone sees confirmed ones as match-only (no evidence leak). Appeal route = public form that sets status appealed.
3. **Review queue** (must-have): `ask` decisions plus blocklist matches, with approve/decline buttons and the reason shown.
4. **Discord mod bot** (nice-to-have): flags scam-pattern messages, drafts a removal message, posts it to a mod channel with a button; the human presses send.

## Data model
communities, rules, applications, decisions(application_id, decision, score, reason, signals jsonb), blocklist_entries, appeals, audit_log.

## Demo script (target)
1. An applicant to London Agent Builders gets scored and routed with a reason.
2. Scammer A21 is declined and reported, and the entry is confirmed.
3. A22 (same phone, handle `@cryptomax_alpha1`) applies to South London Hack Nights and gets stopped by the shared blocklist.
4. An eval page runs all 30 test applicants: accuracy vs `expected_decisions.csv`, false-decline count, time saved.

## Data
Fictional demo data from /workspace/gatekeeper_data (30 applicants, 2 communities). No real member data in the repo. SMS spam set licence unknown, so use it for eval only and don't commit it raw (fetch script instead).

## Timeline (London time)
- 19:15 repo public with LICENSE + README + scaffold
- 20:15 scorer + blocklist + queue working locally
- 21:00 deployed, eval page green
- 21:30 recordable build, demo video under 3 min
- 21:50 code freeze

## API contract (Person A owns, must match docs/HANDOFF_PERSON_B.md exactly)
- `POST /api/score` with body `{ community_slug, application: { name, handle, phone, email, github, text } }`, returns `{ application_id, decision, score, reason, signals: { rules_fit, stopforumspam, github, spam_text, blocklist_hit }, blocklist_match? }`
- `POST /api/decisions/:application_id` with body `{ decision: "accept"|"decline", report_to_blocklist, evidence? }`, returns `{ ok, blocklist_entry_id?, blocklist_status? }`
- `POST /api/blocklist/check` with header `Authorization: Bearer BOT_API_TOKEN` and body `{ community_slug, handle?, email?, phone? }`, returns match-only `{ match, matched_on?, status?, reported_at? }` with no evidence
- `/api/mock/*` stubs with identical shapes behind `USE_MOCKS=true`, so Person B can build until about 20:00 (Note: `_folders` are non-routable in Next.js, so actual URLs are `/api/mock/*` with a rewrite from `/_mock/`)
- Only the server computes HMACs and writes `blocklist_entries`.

## Repo layout
`/docs/SPEC.md`, `/docs/HANDOFF_PERSON_B.md`, `LICENSE` (MIT), `README.md`, `.env.example`, `app/`, `app/api/`, `supabase/migrations/`, `bot/`. Deploy on Vercel.
