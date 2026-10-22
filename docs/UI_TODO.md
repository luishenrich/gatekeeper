# UI TODO — needs API / lib changes (out of scope for the design pass)

The design pass only touched UI files. These need a backend change first.

## Demo blocker: blocklist callout on /apply
- **`POST /api/score` `blocklist_match` only returns `matched_on`, `status` and `reported_at`.** Without `prior_community_name` and `hash_prefix`, `/apply` shows "Seen in a partner community, same phone + handle hash" with no `hmac:…` line. Demo step 2 needs "Seen in London Agent Builders". To fix, `scoreApplicationInternal` (`lib/scoring.ts`) should add `prior_community_name` (from the blocklist entry's community) and `hash_prefix` (`hmac:` + first 4 hex chars). The UI already renders both. `/queue` is fine: `GET /api/queue` already fills both fields.
- **`/api/mock/score` always returns "ask" with no blocklist hit**, so the scammer demo only works against the real API.

## Auth
- **Supabase magic link / 6-digit OTP is not on main.** `lib/auth/client.ts` (`sendMagicLink`, `verifyCode`), `lib/auth/requireLeadPage.ts`, `middleware.ts` and `/auth/callback` don't exist yet. `/login` ships the lead passcode as the only sign-in path. When the helpers land, add the email → "Check your email" (30s resend) → 6-digit code states above the passcode form.
- **No sign-out endpoint.** The nav's "Sign out" uses a server action (`components/shell/actions.ts`) that deletes the `gk_lead` cookie. A `POST /api/lead/logout` would be cleaner.

## Queue
- **`GET /api/queue` has no `reply_draft`.** The composer uses the draft returned by `POST /api/decisions/:id` (accept/decline), or a neutral clarifying-question template for "Ask".
- **`POST /api/decisions/:id` only accepts `accept` | `decline`.** "Ask" can't be recorded as a lead decision, so it only fills the composer with a question.
- **`POST /api/decisions/:id` is not lead-gated** (no `checkQueueAuth`). Every other lead API is.
- **`GET /api/queue` returns the raw `phone`.** The UI masks it, but the API should stop sending it (send the masked form or the hash prefix only).
- **Undo after send is impossible.** WhatsApp messages can't be recalled. Undo only reverts the local decision before sending.

## Settings
- **No mock for `GET/PATCH /api/communities/:slug/settings`.** In `USE_MOCKS` mode the toggle stays local and is labelled "Mock mode — not saved".

## Login
- **`POST /api/lead/login` has no rate limit.** The UI already handles 429 ("Too many tries — wait a minute."). Add a per-IP limit like `/api/score` has, to slow passcode guessing.

## Queue (from the redesign)
- **Ask can't be recorded.** `POST /api/decisions` rejects `ask`, so the queue only sends the question. It then hides the item for this browser session (sessionStorage) because `GET /api/queue` keeps returning it. Fix: accept `ask`, or log a "question sent" state the queue API filters on.
- **Mock queue has no `hash_prefix`, `prior_community_name` or `created_at`.** In mock mode the callout says "the other community" and rows show no times.
- **`ruleText()` only has London Agent Builders' rules.** South London rule refs show LAB rule text.
