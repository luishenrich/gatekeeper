# Gatekeeper — Moderator Review Queue (`/queue`) design brief

**Goal:** a community lead clears a week of applications in ~10 minutes, live on a projector. Each row is one application with a recommended **decision** (accept / ask / decline), a **score**, a **reason that quotes a community rule**, **signal chips**, a **channel badge**, and a **reply draft** sent with one click.
**Stack:** Next.js (App Router) + React + Tailwind. No other UI library required (lucide-react icons optional). Budget is about 45 minutes.

## 1. Reference patterns (Mobbin)
| # | Reference | Borrow | Link |
|---|---|---|---|
| 1 | Linear: grouped issue list with label chips + filter menu | Dense single-line rows, group headers with counts, right-aligned chips, filter dropdown | https://mobbin.com/screens/ed670cda-0527-4716-a1a6-0159f12c4f42 |
| 2 | Stripe: payment detail with a "Risk evaluation" field and timeline | Big headline + status pill at top, evidence sections, a right-hand "Details" column for facts (risk, source) | https://mobbin.com/screens/ebf7e9fe-326a-4459-ae16-f94aea16f56b |
| 3 | Intercom: inbox list + conversation + composer with a channel switcher | Reply composer pinned at the bottom of the detail pane, with a channel selector (→ "Send via WhatsApp/Discord") and kbd hints | https://mobbin.com/screens/ea15f102-0329-4efa-b21e-7882ece48bdc |
| 4 | Superhuman: list with "Starred · UNDO" toast | Bottom-left toast with UNDO after every action; keyboard-first triage | https://mobbin.com/screens/e0c1b181-0384-4e82-b424-397a5b7a10f2 |
| 5 | Superhuman: "Done" empty/celebration state | Calm empty state with a single next action (kbd `esc`) | https://mobbin.com/screens/e14baf82-9439-4fb4-866b-95356c0b8b7e |
| 6 | GitHub: "Finish your review" popover on a PR | A final explicit decision step (Comment / Approve / Request changes ≈ Accept / Ask / Decline) attached to a written message | https://mobbin.com/screens/e5b970ca-4207-466c-9cb8-b5d45fd8779f |

(Discord AutoMod and Stripe Radar's review queue were not checked on Mobbin, so they aren't cited.)

## 2. Layout
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TopBar: Gatekeeper · London Agent Builders ▾ │ [All 30] [Decline 10] [Ask 8] [Accept 12] │ Filter ▾ │ ? │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ QueueList (w-2/5, scroll)     │ DecisionDetail (w-3/5, scroll)               │
│  ▸ row (selected = ring)      │  header · big decision + score               │
│  ▸ row                        │  reason (quotes rule) · blocklist callout    │
│  ▸ row                        │  signals (all chips w/ evidence)             │
│                               │  application text                            │
│                               │  ReplyComposer (sticky bottom) + actions     │
└───────────────────────────────┴──────────────────────────────────────────────┘
```
- Root: `h-screen flex flex-col bg-white text-slate-900 text-[17px]`. Body: `flex flex-1 min-h-0`.
- List: `w-2/5 border-r-2 border-slate-200 overflow-y-auto`. Detail: `w-3/5 overflow-y-auto p-8`.
- **Default sort:** blocklist hits first, then decline, ask, accept, then newest. **The demo should start on the scammer.**
- **TopBar:** `h-16 px-6 flex items-center gap-4 border-b-2 border-slate-200`.
  - Decision counts are segmented buttons that filter the list.
  - Filter dropdown options: channel (WhatsApp/Discord), community (1/2), "blocklist hits only".

## 3. Queue row
`<li class="flex gap-3 px-5 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50">`. When selected, add `bg-slate-100 ring-2 ring-inset ring-slate-900`.
1. **Avatar initials:** `h-11 w-11 rounded-full bg-slate-800 text-white font-bold grid place-items-center`.
2. **Line 1:**
   - **Name** (`font-semibold`), then the handle (`text-slate-600`), then the ChannelBadge.
   - Time is right-aligned (`ml-auto text-slate-600 tabular-nums`, e.g. "4m").
3. **Line 2:**
   - DecisionPill (sm), then the score (`font-bold tabular-nums`, e.g. "92"), then the one-line reason (`truncate text-slate-700`).
4. **Line 3:** the top 2–3 SignalChips. Failing chips come first, then the blocklist chip if present.
5. **Blocklist hit:** the row gets `border-l-8 border-l-rose-600` plus a `BLOCKLIST` badge.

## 4. Colour tokens (Tailwind)
| Token | Pill / badge | Soft background (detail header) |
|---|---|---|
| accept | `bg-emerald-600 text-white` | `bg-emerald-50 border-emerald-600` |
| ask | `bg-amber-500 text-slate-950` | `bg-amber-50 border-amber-500` |
| decline | `bg-rose-600 text-white` | `bg-rose-50 border-rose-600` |
| blocklist hit | `bg-rose-700 text-white uppercase tracking-wide` badge + `ring-4 ring-rose-600` on the detail card | `bg-rose-50 border-2 border-rose-600` callout |
| WhatsApp badge | `bg-green-100 text-green-900 border border-green-700` "WhatsApp" | |
| Discord badge | `bg-indigo-100 text-indigo-900 border border-indigo-700` "Discord" | |
| chip pass | `bg-emerald-50 text-emerald-900 border border-emerald-700` + ✓ | |
| chip fail | `bg-rose-50 text-rose-900 border border-rose-700` + ✕ | |
| chip unknown | `bg-slate-100 text-slate-800 border border-slate-500` + ? | |

## 5. Decision detail card
1. **Header:**
   - Avatar (lg), name (`text-3xl font-bold`), handle, ChannelBadge, "Applied to London Agent Builders · 4m ago".
2. **Decision block** (`rounded-2xl border-2 p-6` with the soft colour):
   - **DecisionPill (xl):** `text-3xl font-extrabold px-6 py-3 rounded-xl uppercase`.
   - **Score:** `text-6xl font-black tabular-nums`, followed by `/100`.
   - **Confidence label:** "High confidence".
3. **Reason:**
   - Plain sentence plus a quoted rule: `<blockquote class="border-l-4 border-slate-900 pl-4 italic">Rule 5 — Zero tolerance: crypto/forex "guaranteed returns"…</blockquote>`.
   - Show the rule number as a link to `rules.md`.
4. **Cross-group blocklist callout** (only on a hit):
   - `rounded-xl border-2 border-rose-600 bg-rose-50 p-5`.
   - Text: 🚫 **Seen in South London Hack Nights, same phone hash**. Below that: "Declined there for: fake recruiter script · handle variant `@talent.rachel.hr` ↔ `@talent_rachel_hr`".
   - Show the hash prefix only (`hmac:3f9a…`), **never the phone number**.
5. **Signals** (grid `grid-cols-2 gap-3`):
   - Each SignalChip (lg) shows an icon (✓ / ✕ / ?), a label, and one line of evidence. Example evidence:
     - **Rules fit:** "Mentions building agents + London (rules 1–3)"
     - **Spam text:** "Matches 'guaranteed', 'DM me', URL shortener"
     - **StopForumSpam:** "email not listed (0 reports)"
     - **GitHub:** "ada-testworth-demo · 2y · 14 repos" or "none given"
     - **Devpost:** "2 projects, 1 winner" or "not found"
     - **Blocklist:** "hit in community 2"
6. **Application text:** `rounded-xl bg-slate-50 p-5 text-lg leading-relaxed whitespace-pre-wrap`.
7. **ReplyComposer** (sticky bottom: `sticky bottom-0 bg-white border-t-2 border-slate-200 pt-4`):
   - **Draft reply:** a `<textarea class="w-full min-h-28 text-lg border-2 border-slate-300 rounded-xl p-4 focus:border-slate-900">`, pre-filled per decision:
     - accept: welcome message with the link.
     - ask: one specific question tied to the rule.
     - decline: polite, no accusation, appeal link.
   - **Send button:** `Send via WhatsApp` / `Send via Discord`, chosen from `channel`, with kbd ⏎.
   - **Action buttons:** `Accept (A)` `Ask (S)` `Decline (D)`, each `h-14 px-6 text-lg font-bold rounded-xl` in its decision colour.
   - Choosing a decision swaps the draft template.
   - "Send" records the decision, sends (or simulates) the reply, advances to the next row and fires the toast.

## 6. Empty state
When there are 0 items: centred `Queue clear ✓` (`text-5xl font-black text-emerald-700`).
- Below it: "**27 handled today** · **≈ 2h 15m saved**", where saved time = handled × 5 min manual review (state this assumption in a tooltip).
- Then "Blocked 3 repeat scammers across 2 communities". Secondary action: "Press `R` to reload".

## 7. Keyboard shortcuts (with visible `<Kbd>` hints)
| Key | Action |
|---|---|
| `J` / `K` | next / previous row |
| `A` | set Accept (loads the accept draft) |
| `S` | set Ask / "needs info" |
| `D` | set Decline |
| `E` | focus the reply textarea (Esc leaves it) |
| `Enter` | send the reply + confirm the decision (Cmd/Ctrl+Enter inside the textarea) |
| `Z` or toast button | undo the last action |
| `?` | help overlay listing all shortcuts |

- `<Kbd>`: `inline-flex min-w-7 h-7 px-2 items-center justify-center rounded-md border-2 border-slate-400 bg-white text-sm font-mono font-bold text-slate-900`.
- Show kbd hints inside the buttons and in a footer hint bar (`J K move · A S D decide · E edit · ⏎ send · ? help`).
- Ignore single-key shortcuts while typing in an input or textarea.

## 8. Toast with undo
- Bottom-left (Superhuman style): `fixed bottom-6 left-6 rounded-xl bg-slate-900 text-white px-5 py-4 text-lg shadow-xl flex gap-4`.
- Text: "Declined @cryptomax_alpha1 · reply sent via WhatsApp". Button: `UNDO (Z)`.
- Auto-dismiss after 6s. Undo restores the item to the list and its previous state. For the demo, real sends can be deferred until the toast expires.

## 9. Projector readability rules
- Base text is 17px (`text-[17px]`); secondary text is at least 16px. Nothing below `text-sm`, and only inside kbd.
- Dark-on-light only. Secondary text uses `text-slate-600` at minimum; **never `text-slate-400` or lighter**. Borders are 2px.
- The decision pill is the largest coloured element on screen. Colour always comes with a word and an icon (works for colour-blind viewers).
- Selected states use thick rings, not subtle background tints. No thin fonts (`font-medium` minimum).

## 10. Components
`QueuePage` · `TopBar` (`DecisionCountTabs`, `FilterMenu`) · `QueueList` · `QueueRow` · `Avatar` · `ChannelBadge` · `DecisionPill` (sizes sm/xl) · `ScoreBadge` · `SignalChip` (sm/lg, pass/fail/unknown) · `BlocklistBadge` · `DecisionDetail` · `RuleQuote` · `BlocklistCallout` · `ReplyComposer` · `DecisionButtons` · `Kbd` · `HelpOverlay` · `UndoToast` · `EmptyState` · hook `useQueueKeyboard`.

## 11. Mock data shape
Based on `/workspace/gatekeeper_data/applicants.json`, whose fields are: id, name, handle, phone, email, github, linkedin, application_text, community_applied, expected_decision, reason, category, cross_group_dup_of. Copy that file to `data/applicants.json` and derive the review fields below. Use the scorer's output if it exists; otherwise derive from `expected_decision`/`reason` for the demo.
```ts
type Decision = "accept" | "ask" | "decline";
type Channel = "whatsapp" | "discord";
type SignalKey = "rules_fit" | "spam_text" | "stopforumspam" | "github" | "devpost" | "blocklist";

interface Applicant {               // 1:1 with applicants.json
  id: string; name: string; handle: string; phone: string; email: string;
  github: string | null; linkedin: string | null; application_text: string;
  community_applied: 1 | 2; expected_decision: Decision; reason: string;
  category: "good_fit" | "borderline" | "scammer" | "bot"; cross_group_dup_of: string | null;
}
interface Signal { key: SignalKey; label: string; status: "pass" | "fail" | "unknown"; evidence: string; }
interface BlocklistMatch { community: string; matchedOn: ("phone_hash" | "handle_variant")[];
  hashPrefix: string; priorDecisionAt: string; priorReason: string; reportedBy: string; matchedApplicantId: string; }
interface ReviewItem extends Applicant {
  channel: Channel;                 // demo: community 1 → whatsapp, 2 → discord (or alternate)
  decision: Decision;               // model recommendation (start = expected_decision)
  score: number;                    // 0–100 fit; scammers ≤ 15, borderline 40–65, good ≥ 80
  ruleRef: { number: number; text: string };   // quoted from rules.md
  signals: Signal[];
  blocklist: BlocklistMatch | null; // non-null when cross_group_dup_of != null
  replyDraft: string;
  receivedAt: string;               // ISO
  status: "pending" | "sent" | "undone";
}
```
Example (A24, the blocklist demo):
```json
{ "id":"A24","name":"Rachel H.","handle":"@talent.rachel.hr","channel":"discord","decision":"decline","score":4,
  "ruleRef":{"number":5,"text":"Zero tolerance: … fake recruiters asking for ID/bank details …"},
  "signals":[{"key":"blocklist","label":"Blocklist","status":"fail","evidence":"Hit in London Agent Builders (A23)"},
             {"key":"spam_text","label":"Spam text","status":"fail","evidence":"Asks for ID/bank details; unrealistic pay"},
             {"key":"rules_fit","label":"Rules fit","status":"fail","evidence":"No building activity"},
             {"key":"stopforumspam","label":"StopForumSpam","status":"unknown","evidence":"not checked (demo)"}],
  "blocklist":{"community":"London Agent Builders","matchedOn":["phone_hash","handle_variant"],"hashPrefix":"hmac:3f9a…",
               "priorDecisionAt":"2026-10-22T18:10:00Z","priorReason":"Fake recruiter script","reportedBy":"@lead_lab","matchedApplicantId":"A23"},
  "replyDraft":"Thanks for applying. We can't approve this application. If you think this is a mistake, you can appeal here: <link>",
  "status":"pending" }
```
(Mock tip: the A22/A24/A26 records are in community 2, so their callout should name *London Agent Builders*. Shown from community 1's view, the callout reads "Seen in South London Hack Nights". Make the community name data-driven.)

## 12. Acceptance checklist (demo script)
1. Open `/queue`. A blocklisted applicant is first, with a red bar and BLOCKLIST badge.
2. The detail view shows DECLINE, score 4, the quoted Rule 5, and the "Seen in … same phone hash" callout.
3. Press `Enter`. Toast "Declined … · UNDO" appears and the selection moves on.
4. Press `J` to a borderline item, `S`, edit with `E`, then `Ctrl+Enter`.
5. Press `A` repeatedly on the good fits until "Queue clear ✓ · 30 handled · ≈ 2h 30m saved".

---

## 13. Paste-ready Cursor prompt
```
Build the Gatekeeper moderator review queue at app/queue/page.tsx (Next.js App Router, React, Tailwind only; lucide-react icons allowed). Follow docs/DESIGN_QUEUE.md exactly.

Data: copy /workspace/gatekeeper_data/applicants.json to data/applicants.json. Create lib/queue.ts that maps each Applicant to a ReviewItem (types in §11 of the brief):
- channel: community_applied 1 → "whatsapp", 2 → "discord"; decision = expected_decision
- score: good_fit 80–95, borderline 40–65, scammer/bot 3–15 (deterministic from id)
- ruleRef: parse the rule numbers from `reason` (e.g. "rule 5"), else accept→1, ask→2, decline→5. Hard-code the rule texts from docs/rules.md (copy /workspace/gatekeeper_data/rules.md)
- signals: rules_fit, spam_text (regex: guaranteed|DM|bit\.ly|passport|bank|presale|signals), stopforumspam (unknown: "not checked"), github (pass if github non-null), devpost (unknown), blocklist (fail if cross_group_dup_of)
- blocklist: when cross_group_dup_of is set, build a BlocklistMatch pointing to that applicant's community name ("London Agent Builders" = 1, "South London Hack Nights" = 2), matchedOn ["phone_hash", "handle_variant"], hashPrefix = "hmac:" + first 4 hex of sha256(phone)
- replyDraft templates per decision (accept welcome, ask one question tied to the rule, decline polite + appeal link)
Sort: blocklist hits, then decline, ask, accept.

UI: two-pane layout (list w-2/5, detail w-3/5) under a top bar with segmented decision counts (All/Decline/Ask/Accept) and a filter menu (channel, community, blocklist only). Components: TopBar, QueueList, QueueRow, Avatar, ChannelBadge, DecisionPill(sm|xl), ScoreBadge, SignalChip(pass|fail|unknown, sm|lg), BlocklistBadge, DecisionDetail, RuleQuote, BlocklistCallout ("Seen in <community>, same phone hash" + hash prefix, never the raw phone), ReplyComposer (editable textarea + "Send via WhatsApp/Discord"), DecisionButtons, Kbd, HelpOverlay, UndoToast (6s, Z to undo), EmptyState ("Queue clear ✓", handled today, time saved = handled × 5 min).
Colours: accept bg-emerald-600 text-white, ask bg-amber-500 text-slate-950, decline bg-rose-600 text-white, blocklist border-l-8 border-l-rose-600 on the row + ring-4 ring-rose-600 on the detail card + bg-rose-700 badge. WhatsApp badge green-100/green-900, Discord indigo-100/indigo-900.
Keyboard (useQueueKeyboard hook, ignored while typing except Esc and Ctrl/Cmd+Enter): J/K move, A accept, S ask, D decline (each swaps the reply draft), E focus reply, Enter send + advance + toast, Z undo, ? help overlay. Show <Kbd> hints on the buttons and in a footer hint bar.
Sending: POST /api/send (stub route that logs and returns ok) with {id, channel, decision, reply}; optimistic update; undo reverts.
Projector readability: base text-[17px], secondary ≥ 16px text-slate-600 minimum (never slate-400), 2px borders, dark-on-light, the decision pill is the largest element, colour always paired with a word + icon.
Done when the §12 demo script in the brief works end to end with no console errors.
```
