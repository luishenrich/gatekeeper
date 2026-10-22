# Gatekeeper

Stop scammers getting into communities while letting real builders in fast. Gatekeeper scores applications against community rules using AI, maintains a shared blocklist across communities (HMAC-hashed for privacy), and provides a review queue for moderators. Built for hackathon Track 1 (community infrastructure).

## Architecture

- **Next.js App Router** (TypeScript + Tailwind) – Review queue UI and API routes
- **Supabase** – Postgres with RLS for secure data access
- **LLM scoring** – Evaluates applications against community rules via OpenRouter
- **Shared blocklist** – HMAC-SHA256 hashed phone/email/handle, RLS-protected
- **Discord bot** (optional) – Checks new joins against blocklist

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
   - `BLOCKLIST_HMAC_SECRET` – Secret for HMAC hashing (generate a random string)
   - `BOT_API_TOKEN` – Bearer token for bot API access
   - `GATEKEEPER_API_URL` – Your deployed API URL (or http://localhost:3000 for dev)
   - `USE_MOCKS=true` – Enable mock API routes for testing
   - `OPENROUTER_API_KEY` – OpenRouter API key for LLM scoring
   - `SCORER_MODEL` – Model to use (e.g. `typesafe/jev-router`)
   - `DISCORD_BOT_TOKEN` – Discord bot token (optional)
   - `DISCORD_MOD_CHANNEL_ID` – Discord mod channel ID (optional)
   - `COMMUNITY_SLUG` – Your community slug (e.g. `london-agent-builders`)

3. **Apply Supabase migrations:**
   ```bash
   # Install Supabase CLI if needed: npm install -g supabase
   supabase db push
   # Or manually apply: supabase/migrations/0001_init.sql in your Supabase SQL editor
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## How Another Community Could Run It

1. **Fork this repo** on GitHub
2. **Deploy to Vercel:** Connect your fork, Vercel auto-detects Next.js
3. **Set up Supabase:** Create a free project at supabase.com, run the migration in `supabase/migrations/0001_init.sql`
4. **Configure environment variables** in Vercel (same as `.env.local` above)
5. **Add your community rules:** Insert into `communities` table, write rules in `rules_md` column
6. **Invite moderators:** Add rows to `moderators` table linking user_id to community_id
7. **Test with demo data:** Use `USE_MOCKS=true` to test with fixture data
8. **Go live:** Set `USE_MOCKS=false`, share the `/queue` URL with moderators

## Project Structure

- `app/` – Next.js App Router pages and API routes
  - `api/score/` – Score applicant endpoint
  - `api/decisions/` – Moderator decision endpoint
  - `api/blocklist/` – Blocklist check endpoint
  - `api/mock/` – Mock API routes for testing (`USE_MOCKS=true`). App Router treats folders starting with `_` as private, so these live at `/api/mock/*`.
- `lib/` – Shared utilities (HMAC, Supabase clients)
- `supabase/migrations/` – Database schema
- `fixtures/` – Demo data for mocks (`queue.json` is the review queue)
- `data/` – Fictional demo dataset (30 applicants, 2 communities)
- `docs/` – Build spec and handoff docs

## License

MIT – see LICENSE file
