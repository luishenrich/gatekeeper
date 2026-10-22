# Greenlight: handoff for Person B (UI + Discord bot)

Hackathon: Grok Bot Community Engineering London, Thu 22 Oct 2026. **Code freeze 21:50 London time.** Top-5 live demos at 22:20, 3 min each.
Track 1 "Gatekeeper": review applications, keep scammers out, share a blocklist across communities. Must be open source (public GitHub repo, MIT).

Full build spec: [SPEC.md](./SPEC.md) (same folder). SPEC.md wins if anything here conflicts.

## The one-paragraph pitch
Community leads review applications by hand, and a scammer kicked from one group just joins the next, because communities share nothing. Gatekeeper scores each application (accept / ask / decline, with a reason that cites the community's rules), puts the unclear ones and blocklist hits into a review queue, and shares a blocklist across communities that stores only HMACs of the phone, handle and email, never the raw values. The money shot in the demo: scammer A21 gets declined and reported in *London Agent Builders*, then A22 (same phone, handle `@cryptomax_alpha1`) applies to *South London Hack Nights* and gets stopped instantly.

## Who owns what
- **Person A (Luis):** Supabase schema + RLS, HMAC/normalisation, scorer, all `/api/*` routes, the eval page.
- **Person B (you):** the review queue UI (Next.js) with the report-to-blocklist toggle, the discord.js join-check bot, and the WhatsApp 1:1 channel (official Cloud API) behind the shared `ChannelAdapter`.
- **Scope note:** WhatsApp is **1:1 applications only**. The official Cloud API can't moderate groups, so don't promise group kicks or scans on WhatsApp.
- **Human in the loop:** no reply goes to an applicant on any channel until the lead clicks in the queue. Decline replies especially are drafted, shown in the queue, and only sent on click.
- **Rule:** B never computes HMACs and never writes to `blocklist_entries` directly. Everything goes through A's API routes, because the HMAC secret stays on the server.

## Contracts with Person A (do not change without telling A)

### Tables (Supabase, from SPEC.md)
- `communities(id uuid, slug text, name text)`, seeded with `london-agent-builders` and `south-london-hack-nights`
- `applications(id uuid, community_id uuid, channel 'whatsapp'|'discord'|'web', channel_user_id text, name, handle, phone, email, github, text, created_at)`. Ask A to add `channel` + `channel_user_id` if they're missing.
- `decisions(id uuid, application_id uuid, decision 'accept'|'ask'|'decline', score int 0-100, reason text, signals jsonb, decided_by text null, final bool default false, created_at)`
- `blocklist_entries(id, community_id, phone_hmac, handle_norm_hmac, email_hmac, evidence, reporter, status 'pending'|'confirmed'|'appealed'|'cleared', created_at)`
- `appeals`, `audit_log`, owned by A (B only reads them if needed)

B reads `applications` joined with their latest `decisions` row through the Supabase JS client, logged in as the moderator with a magic link. RLS limits what the moderator sees to their own community.

### API routes (owned by A, consumed by B)
```
POST /api/score
  body: { community_slug, application: { name, handle, phone, email, github, text } }
  200:  { application_id, decision: "accept"|"ask"|"decline", score: 0-100,
          reason: string, signals: { rules_fit, stopforumspam, github, spam_text, blocklist_hit: bool },
          blocklist_match?: { matched_on: ["phone"|"handle"|"email"], status: "confirmed", reported_at } }

POST /api/decisions/:application_id      (moderator action from the queue)
  body: { decision: "accept"|"decline", report_to_blocklist: boolean, evidence?: string }
  200:  { ok: true, blocklist_entry_id?: string, blocklist_status?: "pending"|"confirmed" }

POST /api/decisions/:application_id also returns
  { reply_draft?: { channel, text } }   (the queue shows it, nothing is sent yet)

POST /api/channel/send                   (owned by B, called only by the queue on a lead's click)
  body: { application_id, text }
  -> looks up channel + channel_user_id, calls ChannelAdapter.send(), writes audit_log
  200: { ok: true, channel, sent_at }

POST /api/whatsapp/webhook  + GET verify (owned by B)
  inbound 1:1 text -> ChannelAdapter.toApplication() -> POST /api/score -> stored with channel='whatsapp'
  auto-acknowledgement allowed ONLY as a fixed neutral text ("Thanks, a moderator will review your application"), no verdict

POST /api/blocklist/check                (used by the Discord bot and the WhatsApp intake)
  headers: Authorization: Bearer ${BOT_API_TOKEN}
  body: { community_slug, handle?, email?, phone? }
  200:  { match: boolean, matched_on?: ["handle"|...], status?: "confirmed", reported_at?: string }
  (no evidence and no reporting community's private notes: match-only, per SPEC)
```
Until A's routes are live, **mock them** with `/api/mock/*` returning the shapes above. Use the fictional data in `/workspace/gatekeeper_data`.
(Note: `/api/mock/*` not `/api/_mock/*` — Next.js treats `_folders` as private routing, so the actual URLs are `/api/mock/*` with a rewrite from `/_mock/` in `next.config.ts`.)

### Env vars B needs
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GATEKEEPER_API_URL`, `BOT_API_TOKEN`, `DISCORD_BOT_TOKEN`, `DISCORD_MOD_CHANNEL_ID`, `COMMUNITY_SLUG`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `OPENROUTER_API_KEY` (A's). Never commit any of them, and ship a `.env.example` instead.

## Milestones (London time, from SPEC.md)
- **19:15**: repo public with LICENSE, README and scaffold. B has the `/queue` page rendering mock data.
- **20:15**: scorer, blocklist and queue working locally. B's queue is wired to A's real routes.
- **20:30**: feature freeze. If the bot isn't flagging a join by now, cut it (see below).
- **21:00**: deployed on Vercel, eval page green, bot running locally against prod API.
- **21:30**: recordable build, backup demo video under 3 min.
- **21:50**: code freeze, everything pushed.

## Cut order if behind (cut the first item first)
1. Discord bot: WhatsApp carries the channel story, and the cross-community hit can also be shown in the web app.
2. Live WhatsApp Cloud API: **go/no-go at 20:30**. If a real phone message doesn't round-trip by then, demo with `simulate_whatsapp` (it posts the same webhook payload).
3. External lookups in the scorer (A's call): keep the LLM reasons plus the blocklist only.
4. The `ask` verdict in the UI: just accept or decline.
5. Eval page polish: show the headline numbers only.
**Never cut:** the shared HMAC blocklist and the cross-community block in the demo.

---

## Copy-paste prompts

### B1 · Grok Bot (research and planning), ~5 min
> I'm Person B on a 2-person hackathon team building "Gatekeeper", an open-source tool that scores community applications and shares an HMAC-hashed scammer blocklist across communities (Next.js App Router + TypeScript, Supabase with RLS and magic-link auth, discord.js bot). Code freeze is 21:50 London time tonight. My job: (1) a `/queue` review page and (2) a discord.js bot that checks new joiners against the blocklist via `POST /api/blocklist/check` and posts a flag to a mod channel with a button; a human presses it, and the bot never kicks on its own. Give me a 10-step build plan for both parts in priority order, the exact discord.js v14 intents and events I need for member joins (`guildMemberAdd`, `GuildMembers` privileged intent) and how to enable them in the Developer Portal, and the 3 most likely ways each part breaks during a live demo, with a fix for each. Keep it short.

### B2 · Cursor agent (code): review queue, start at once
> In this Next.js App Router + TypeScript repo (Tailwind is fine), build a `/queue` page for moderators.
> - Data: applications joined with their latest `decisions` row (see the contract in `HANDOFF_PERSON_B.md`). Show only rows where `decision = 'ask'` OR `signals.blocklist_hit = true` OR `final = false`, newest first. Until the real API exists, read from `/api/_mock/queue`, which returns fixture data built from `/workspace/gatekeeper_data` (copy 6 fictional applicants into `fixtures/queue.json`, and include A21 and A22 `@cryptomax_alpha1`).
> - Each card shows a **channel badge** (`whatsapp` green / `discord` blurple / `web` grey), the name, handle, community, a big score badge (0-100, colour-coded), the verdict pill, the `reason` text in full, and a collapsible list of `signals`. A blocklist hit gets a red banner: "Matched shared blocklist on phone, handle · confirmed · reported 22 Oct".
> - Buttons: **Accept** and **Decline**. Decline opens an inline panel with a **"Report to shared blocklist"** toggle (off by default) and an evidence textarea that's required when the toggle is on. On submit, call `POST /api/decisions/:application_id` with `{ decision, report_to_blocklist, evidence }` and show the returned `blocklist_status`. If a `reply_draft` comes back, show it in an editable box with a **Send reply via <channel>** button that calls `POST /api/channel/send`. Nothing is sent to the applicant without that click. Then remove the card.
> - Add a community switcher in the header (`london-agent-builders` / `south-london-hack-nights`), so the demo can show the second community seeing the hit.
> - No raw phone or email in the UI. Show them masked (`+44 •••• 21`).
> - Add a `/api/mock/*` set implementing exactly the shapes in the contract, behind `USE_MOCKS=true`.
> Keep it to as few files as possible. No auth gating yet, since Person A adds the Supabase magic link.

### B3 · Cursor agent (code): wire queue to real API, after A says routes are live (~20:00)
> Switch `/queue` from the mocks to the real routes in `HANDOFF_PERSON_B.md`: read with the Supabase JS client (`@supabase/ssr`, signed-in moderator, RLS does the filtering), and write via `POST /api/decisions/:application_id`. Keep `USE_MOCKS=true` working as a fallback for the demo. Add loading and error states, plus a toast showing the blocklist status after a report. Don't touch Person A's files under `app/api/` except `mock`.

### B4 · Cursor agent (code): Discord join-check bot, first item to cut
> Create `bot/` as a standalone Node 20 + TypeScript package using discord.js v14.
> - Intents: `Guilds`, `GuildMembers`. On `guildMemberAdd`, call `POST ${GATEKEEPER_API_URL}/api/blocklist/check` with `Authorization: Bearer ${BOT_API_TOKEN}` and body `{ community_slug: COMMUNITY_SLUG, handle: member.user.username }`.
> - If `match` is true, post an embed to `DISCORD_MOD_CHANNEL_ID`: "⚠️ @user matched the shared Gatekeeper blocklist on <matched_on> (status <status>, reported <date>)". Add two buttons, **Draft removal** and **Dismiss**. Draft removal posts a pre-written removal message plus a **Kick now** button; only a human click on Kick now calls `member.kick()`. Log every action to the console.
> - Add a `/gatekeeper check <handle>` slash command that runs the same check, as a demo fallback when you can't join with a second account.
> - Add `bot/.env.example`, a `bot/README.md` covering Developer Portal setup (enable the Server Members privileged intent, invite URL with `bot applications.commands` scopes and Kick Members permission) and `npm run dev`.
> - Never put tokens in code, and never kick without a human click.

### B4b · Cursor agent (code): WhatsApp 1:1 intake via the official Cloud API, cut #2 (simulator fallback)
> Implement the WhatsApp side of the shared `ChannelAdapter` interface (`lib/channels/adapter.ts`: `toApplication(inbound) -> Application`, `send(channel_user_id, text) -> {sent_at}`) using the **official WhatsApp Cloud API only** (Graph API `/{WHATSAPP_PHONE_NUMBER_ID}/messages`). No Baileys or whatsapp-web.js.
> - `GET /api/whatsapp/webhook`: verify the `hub.verify_token` challenge. `POST /api/whatsapp/webhook`: verify `X-Hub-Signature-256` with `WHATSAPP_APP_SECRET`, take 1:1 text messages only (ignore groups, statuses and media), map them to an application (`channel='whatsapp'`, `channel_user_id` = sender wa_id, `phone` = sender number), call `POST /api/score`, and store the result.
> - The only automatic outbound is a fixed neutral acknowledgement inside the 24h customer-service window ("Thanks, a moderator will review your application"). It never states a verdict. Verdict replies go only through `POST /api/channel/send` when the lead clicks in the queue.
> - Keep `scripts/simulate_whatsapp.ts` posting a realistic signed webhook payload (e.g. A22 from the same phone as A21), so the demo works without a live phone. It's the official fallback.
> - Add the WhatsApp vars to `.env.example` and a README section on Meta app setup (test number, webhook URL, verify token).

### B5 · Grok Bot (planning): demo rehearsal, ~21:15
> Here's our Gatekeeper demo flow: [paste SPEC.md "Demo script"]. Write a tight 3-minute script for 2 speakers with exact clicks, what to say over each step, and a fallback line for each step if it fails live (mocks, slash command, video). Also list what must be open in browser tabs before we go on stage.

## Done means
- `/queue` deployed, both communities switchable, a decline with report works end-to-end against A's API.
- The bot flags a blocklisted join in a test server (or is cut by 20:30 and the slash command or in-app view covers it).
- A WhatsApp 1:1 application (live or via `simulate_whatsapp`) shows up in the queue with a `whatsapp` badge, and a decline reply only goes out on the lead's click.
- No secrets and no real member data in the repo. `.env.example` files are present.

---

## 0. Start here: set up your own Grok Bot agent team (5 min)

Do this before B1. Paste the prompt below into a fresh Grok Bot chat (your primary bot). It creates a small team of agents that mirrors Luis's side, so both halves work the same way.

**Paste into Grok Bot:**

> I'm Person B on a 2-person team at the Grok Bot Community Engineering London Hackathon tonight (code freeze 21:50 London time, demo video under 3 min required, top 5 demo live at 22:20). We're building **Gatekeeper** (Track 1, vetting & moderation): an AI application reviewer that scores applicants against a community's own rules (accept / ask / decline with a reason), a shared cross-community blocklist in Supabase (HMAC-SHA256 hashed handles/phones, RLS, appeals), a review queue UI, and a Discord join-check bot that only drafts removals (a human clicks). The repo is public and MIT licensed. Read `docs/SPEC.md` and `docs/HANDOFF_PERSON_B.md` in the repo first.
>
> Always write to me in English. Create these teammates for me now, each with a description that includes the context above:
> 1. **B Builder**: owns my code: the Next.js `/queue` page (channel badge, accept/ask/decline, report-to-blocklist, reply_draft + Send via channel), the discord.js bot, and WhatsApp 1:1 intake (prompt B4b). Launches and steers Cursor cloud agents using prompts B2–B4b. Never computes HMACs and never writes `blocklist_entries` directly; only calls Person A's API / uses `/api/_mock/*` until about 20:00.
> 2. **B QA**: pulls the latest `main` every 20 minutes, runs the app against the test set, and reports broken flows to me and B Builder. Checks the demo arc works: an applicant is scored and routed with a reason, then a known scammer is stopped when trying to join a second community.
> 3. **B Demo**: runs prompt B5 (demo rehearsal), keeps a 3-minute script for my part, and makes sure we have screenshots and a screen recording as backup by 21:30.
>
> After creating them, send each one its first task and give me a one-line status per agent. Remind me at 20:00 (switch from mocks to the real API), 20:30 (feature freeze), 21:15 (end-to-end on the test set) and 21:40 (README, video, rehearsal).

**Then connect:** GitHub (to be added to the repo, send Luis your GitHub handle) and, if you deploy, Vercel. You don't need your own Supabase; you only talk to Person A's API.

**Sync rule:** small PRs into `main`, rebase often, and never commit secrets or real member data. Shared env vars are in the README.
