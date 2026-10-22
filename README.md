# Greenlight

Stop scammers getting into communities while letting real builders in fast. Greenlight scores applications against community rules using AI, maintains a shared blocklist across communities (HMAC-hashed for privacy), and provides a review queue for moderators. Built for hackathon Track 1 (community infrastructure).

## Architecture

- **Next.js App Router** (TypeScript + Tailwind) – Review queue UI and API routes
- **Supabase** – Postgres with RLS for secure data access
- **LLM scoring** – Evaluates applications against community rules via OpenRouter (recommended model: `openai/gpt-6-luna` for best accuracy, 29/30 on test set)
- **Shared blocklist** – HMAC-SHA256 hashed phone/email/handle, RLS-protected, match-only cross-community
- **Multiple signals** – StopForumSpam, GitHub account age/repos, Devpost projects, spam text classifier, all with 2s timeouts
- Discord bot (experimental, not live)

## How the Shared Blocklist Protects Privacy

The shared blocklist lets communities warn each other about scammers without exposing member data:

### Privacy-First Design

1. **HMAC-SHA256 hashing** – Phone numbers, email addresses, and handles are hashed with a server-only secret (`BLOCKLIST_HMAC_SECRET`) before storage. The raw values never enter the database.

2. **Handle normalization** – Before hashing, handles are normalized (lowercase, strip `@._-` and trailing digits) so `@cryptomax_alpha` and `@cryptomax_alpha1` produce the same hash and match.

3. **Match-only checks** – When another community checks a new applicant, the API returns only `{ match: true/false, matched_on: ["phone"|"handle"|"email"], status, reported_at }`. The reporting community's identity and the evidence are never shared.

4. **RLS (Row Level Security)** – Each community sees only its own blocklist entries in full (with evidence). Cross-community matching happens server-side via the service role; moderators never query other communities' entries directly.

5. **Confirmed entries only** – The API checks only `status='confirmed'` entries. Demo mode auto-confirms for speed; production would require a second moderator to confirm before an entry becomes shared.

### Data Flow

- **When a moderator reports a scammer:**
  1. Server computes `HMAC-SHA256(normalize(phone))`, `HMAC-SHA256(normalize(handle))`, `HMAC-SHA256(normalize(email))`
  2. Inserts a row with these HMACs, the evidence (visible only to the reporting community), and `status='confirmed'`
  3. No raw phone/email/handle is stored

- **When another community checks an applicant:**
  1. Server computes HMACs of the applicant's identifiers using the same secret
  2. Queries `blocklist_entries` (service role, bypasses RLS) for matching HMACs where `status='confirmed'`
  3. Returns match status only—no evidence, no reporter community

### Why This Works

- **Same scammer, different details** – If Max Moonshot applies as `@cryptomax_alpha` to Community A and `@cryptomax_alpha1` to Community B, normalization ensures both hash to the same value.
- **No rainbow tables** – The server secret makes pre-computing hashes infeasible.
- **Auditable** – Every report and check is logged in `audit_log` with timestamps and actors.

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` – Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (server-only)
   - `BLOCKLIST_HMAC_SECRET` – Secret for HMAC hashing (generate a random string, keep it safe)
   - `BOT_API_TOKEN` – Bearer token for bot API access
   - `GATEKEEPER_API_URL` – Your deployed API URL (or http://localhost:3000 for dev)
   - `USE_MOCKS=true` – Server-only flag for the mock routes and the queue page. The page receives it as a prop. Do not set `NEXT_PUBLIC_USE_MOCKS`.
   - `OPENROUTER_API_KEY` – OpenRouter API key for LLM scoring
   - `SCORER_MODEL` – Model to use (recommended: `openai/gpt-6-luna` for best accuracy; default: `typesafe/jev-router`)
   - `DISCORD_BOT_TOKEN` – Discord bot token (optional)
   - `DISCORD_MOD_CHANNEL_ID` – Discord mod channel ID (optional)
   - `COMMUNITY_SLUG` – Your community slug (e.g. `london-agent-builders`)

3. **Apply Supabase migrations:**
   ```bash
   # Install Supabase CLI if needed: npm install -g supabase
   supabase db push
   # Or manually apply migrations in order: supabase/migrations/*.sql in your Supabase SQL editor
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

5. **Run evaluation (optional):**
   ```bash
   npm run eval
   # Scores all 30 test applicants, shows accuracy and false-block count
   ```

6. **Test WhatsApp webhook (optional):**
   ```bash
   npx tsx scripts/simulate_whatsapp.ts
   # Simulates a WhatsApp message with correct signature, no real phone needed
   ```

## WhatsApp Intake Channel Setup

Greenlight can accept applications via WhatsApp using the official Meta WhatsApp Cloud API (no third-party libraries).

### Meta Business Setup

1. **Create a Meta Business Account** at business.facebook.com
2. **Create a WhatsApp Business App** in the Meta for Developers console
3. **Add WhatsApp product** to your app
4. **Get credentials:**
   - `WHATSAPP_TOKEN`: Permanent access token (Generate in Settings → WhatsApp → API Setup)
   - `WHATSAPP_PHONE_NUMBER_ID`: Phone number ID from the test number or your own number
   - `WHATSAPP_APP_SECRET`: App secret from Settings → Basic
   - `WHATSAPP_VERIFY_TOKEN`: Any random string you choose (used for webhook verification)
   - `WHATSAPP_COMMUNITY_SLUG`: Which community receives WhatsApp applications

5. **Configure webhook** in WhatsApp → Configuration:
   - Callback URL: `https://your-domain.com/api/whatsapp/webhook`
   - Verify token: Same as `WHATSAPP_VERIFY_TOKEN` above
   - Subscribe to: `messages` field

6. **Test with simulation script:**
   ```bash
   # Set WHATSAPP_APP_SECRET in .env.local
   npx tsx scripts/simulate_whatsapp.ts
   # Check /queue to see the scored application
   ```

### How It Works

1. **User sends a WhatsApp message** to your WhatsApp Business number
2. **Meta webhook calls** `POST /api/whatsapp/webhook` with the message
3. **Greenlight scores** the application (same internal function as web API)
4. **Auto-reply based on decision:**
   - `accept` → "Thanks! Your application looks good, and a lead will confirm shortly."
   - `ask` → Follow-up question from scorer's reason (e.g. "Missing info: which community do you run?")
   - `decline` or blocklist hit → No auto-reply, goes to moderator queue
5. **Moderator reviews** in `/queue` and makes final decision
6. **If moderator declines** a WhatsApp application → Auto-sends "Sorry, we can't accept this application."

All decisions land in the queue. WhatsApp uses the channel adapter in `lib/channels/`.

## API Documentation

### POST /api/score

Score an application against community rules and check the shared blocklist.

**Request:**
```json
{
  "community_slug": "london-agent-builders",
  "application": {
    "name": "Ada Testworth",
    "handle": "@ada_builds",
    "phone": "+44 7700 900101",
    "email": "ada.testworth@example.com",
    "github": "ada-testworth-demo",
    "text": "I'm building an open-source eval harness..."
  }
}
```

**Response:**
```json
{
  "application_id": "uuid",
  "decision": "accept"|"ask"|"decline",
  "score": 95,
  "reason": "Builds agents, open-source repo, offers to demo, London-based (rules 1, 2, 3).",
  "signals": {
    "rules_fit": {
      "score": 95,
      "rule_refs": ["london-agent-builders#1", "london-agent-builders#2"]
    },
    "spam_text": {
      "score": 0.02,
      "matched_patterns": []
    },
    "stopforumspam": {
      "appears": false,
      "frequency": 0,
      "confidence": 0
    },
    "github": {
      "exists": true,
      "account_age_days": 450,
      "public_repos": 8
    },
    "devpost": {
      "projects_found": 2
    },
    "blocklist_hit": false
  },
  "blocklist_match": {
    "matched_on": ["phone", "handle"],
    "status": "confirmed",
    "reported_at": "2026-10-22T18:00:00Z"
  }
}
```

**Signals:**
- `rules_fit`: LLM score (0-100) + rule citations
- `spam_text`: Deterministic scam-text classifier (0-1 score, matched patterns)
- `stopforumspam`: StopForumSpam.org check (appears, frequency, confidence) or `null` if skipped
- `github`: GitHub account exists, age in days, public repo count, or `null` if skipped
- `devpost`: Number of projects found on Devpost, or `null` if skipped
- `blocklist_hit`: Boolean, true if matched confirmed entry in shared blocklist
- `blocklist_match`: Present only when `blocklist_hit` is true; shows which fields matched

All external checks (StopForumSpam, GitHub, Devpost) have 2s timeouts and are cached. They can never break scoring.

### POST /api/decisions/:application_id

Record a moderator's final decision and optionally report to the shared blocklist.

**Request:**
```json
{
  "decision": "accept"|"decline",
  "report_to_blocklist": true,
  "evidence": "Crypto pump scam, identical to A21"
}
```

**Response:**
```json
{
  "ok": true,
  "blocklist_entry_id": "uuid",
  "blocklist_status": "confirmed"
}
```

**Notes:**
- `evidence` is required when `report_to_blocklist` is true
- Creates a `confirmed` blocklist entry (demo mode; production would use `pending` → moderator review → `confirmed`)
- Evidence is visible only to the reporting community

### POST /api/blocklist/check

Check if identifiers match the shared blocklist.

**Headers:**
```
Authorization: Bearer <BOT_API_TOKEN>
```

**Request:**
```json
{
  "community_slug": "london-agent-builders",
  "handle": "@cryptomax_alpha1",
  "phone": "+44 7700 900901",
  "email": "max@example.com"
}
```

**Response:**
```json
{
  "match": true,
  "matched_on": ["phone", "handle"],
  "status": "confirmed",
  "reported_at": "2026-10-22T18:00:00Z"
}
```

**Notes:**
- At least one identifier (handle, phone, or email) is required
- Returns match-only result—no evidence, no reporting community
- Only checks `confirmed` entries

## Auto mode

A lead can turn Auto mode on per community at `/settings` (same `gk_lead` cookie as the queue). It is **off by default**.

When Auto mode is on, scoring may send a reply with no extra click, and only in these cases:

- **ask** — send the clarifying question (the scorer reason).
- **accept with score ≥ 80** — send the welcome message.

It **never** auto-sends:

- a **decline**
- any **blocklist hit** (`signals.blocklist_hit` or a `blocklist_match`)
- a **web** application (no outbound channel)

WhatsApp uses the Cloud API adapter. Successful sends are written to `audit_log` with `auto=true`, `action='auto_send'`, and `details` `{application_id, decision, channel}` — no phone number. If the send fails, the failure is logged and the application stays in the queue. The queue header shows whether Auto mode is on, and an **auto-sent** badge marks items that were sent.

`GET` and `PATCH /api/communities/:slug/settings` read and update `{ auto_mode }` with the service-role client. Both require the lead token.

## How Another Community Could Run It

1. **Fork this repo** on GitHub
2. **Deploy to Vercel:** Connect your fork, Vercel auto-detects Next.js
3. **Set up Supabase:** Create a free project at supabase.com, run migrations in `supabase/migrations/*.sql` in order
4. **Configure environment variables** in Vercel (same as `.env.local` above)
5. **Add your community rules:** 
   ```sql
   INSERT INTO communities (slug, name, rules_md) VALUES ('your-slug', 'Your Community', '...');
   ```
6. **Invite moderators:** 
   ```sql
   -- First, create a moderator account via Supabase Auth (magic link)
   -- Then add them to your community:
   INSERT INTO moderators (user_id, community_id) VALUES ('<user-uuid>', '<community-uuid>');
   ```
7. **Test with demo data:** Set `USE_MOCKS=true` to test with fixture data
8. **Go live:** Set `USE_MOCKS=false`, share the `/queue` URL with moderators

## Project Structure

- `app/` – Next.js App Router pages and API routes
  - `api/score/` – Score applicant endpoint (real scoring with all signals)
  - `api/decisions/` – Moderator decision endpoint
  - `api/blocklist/` – Blocklist check endpoint (bot API)
  - `api/mock/` – Mock API routes (active when server `USE_MOCKS=true`; `/api/_mock/*` rewrites here)
- `lib/` – Shared utilities
  - `scorer.ts` – OpenRouter LLM scorer (prompt v3, 29/30 accuracy on test set)
  - `spam-classifier.ts` – Deterministic scam-text classifier
  - `signals.ts` – StopForumSpam, GitHub, Devpost API helpers with caching + timeouts
  - `hmac.ts` – Handle/phone/email normalization + HMAC-SHA256
  - `supabase/` – Server (service role) and browser (anon) clients
- `scripts/` – Eval and utility scripts
  - `eval.ts` – Score all 30 test applicants, show accuracy
  - `eval_spam.ts` – Evaluate spam_text classifier on SMS dataset
  - `fetch_sms_spam.ts` – Download SMS spam dataset from HuggingFace
  - `seed-demo.ts` – Reset demo tables for clean demo run
- `supabase/migrations/` – Database schema
  - `0001_init.sql` – Tables, RLS policies, seed communities
  - `0002_rules.sql` – Seed community rules from data/rules.md
  - `0004_auto_mode.sql` – `communities.auto_mode` and `audit_log.auto`
- `fixtures/` – Mock data for `/api/_mock/*` routes
- `data/` – Fictional demo dataset (30 applicants, 2 communities, rules, expected decisions)
- `docs/` – Build spec and handoff docs

## Model Recommendations

The scorer has been tested with multiple models. For production:

**Recommended: `openai/gpt-6-luna`**
- 29/30 accuracy on the test set (0 false blocks)
- Fast (mean latency ~1.2s)
- Best reasoning on edge cases

**Budget-friendly: `typesafe/jev-router`** (default)
- 27/30 accuracy
- Very fast (~800ms)
- Good for high-volume communities

Set via `SCORER_MODEL` environment variable. The code default is `typesafe/jev-router`.

## Datasets and attribution

The 30-applicant demo set is fictional. The 200-applicant eval set adds scrubbed spam texts to fictional applications:

- UCI SMS Spam Collection, CC BY 4.0, Almeida & Hidalgo (2011), https://doi.org/10.24432/C5CC84 (15 scrubbed texts used).
- thehamkercat/telegram-spam-ham, WTFPL (12 texts used).

All identities are fictional (Ofcom drama numbers, example.com). Sources, licences, and class counts are in [data/DATASETS.md](data/DATASETS.md).

## License

MIT – see LICENSE file
