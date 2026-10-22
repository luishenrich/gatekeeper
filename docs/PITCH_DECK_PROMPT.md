# Greenlight — pitch deck rebuild prompt

Paste this into Cursor (or a design tool) to rebuild the deck. Product name is **Greenlight**. Closing line: **"Greenlight: let the right people in."**

## Product (locked facts)

- **What:** Open-source trust & safety for **WhatsApp communities** — AI scores applicants against *your* written rules **and** a shared cross-community blocklist of keyed hashes.
- **Not Discord.** Competitors like FedBot / MARVIN are Discord-only; Telegram CAS / Matrix Mjolnir are single-platform. Research found **no verified shared blocklist for WhatsApp groups**. That gap is our edge — not “multi-platform.”
- **Human in the loop:** Declines wait for a lead to click Send. Do **not** claim “every miss goes to a human” (eval shows Jev accepted 1 borderline that should have been ask; Luna did that twice).
- **Live demo surface:** `https://gatekeeper-kinglhb.vercel.app/demo` (and `/demo` locally). Video + live talk = three beats on `/demo`.

### /demo pipeline (three beats — record this)

1. **Normal applicant** — WhatsApp 1:1 message → signature verified → blocklist clear → reply goes out automatically with a reason that **cites the rule**.
2. **`@cryptomax_alpha1`** — keyed-hash blocklist match → straight to **decline**, but the decline is **held**.
3. **You as the lead** — read the reason → **click to send**. That’s the “never declines on its own” moment.

### Verified 200-applicant benchmark (use these numbers only)

From `data/eval_large_results.json` / landing `BENCHMARK`:

| Metric | Number |
|--------|--------|
| Labelled test set | **200** applicants |
| **Jev** | **195/200** (97.5%) |
| **GPT-6 Luna** | **179/200** |
| False blocks | **0** |
| Missed scammers (accepted) | **0** |
| Cost (Jev, full run) | **~$0.59** ≈ **⅓¢ per applicant** |

Safe stage line: *Jev 195/200, zero false blocks, zero missed scammers, ~⅓¢ each.*  
Do **not** use the old 30-app “29/30 Luna” headline.

### Stack (one slide max)

Next.js · Supabase (+ RLS) · LLM scoring · HMAC-SHA256 keyed hashes · WhatsApp Cloud API · MIT.

### Repo / links

- Public repo: https://github.com/luishenrich/gatekeeper  
- Live demo: https://gatekeeper-kinglhb.vercel.app/demo  
- Local deck: `/pitch.html`

---

## Judging — one moment per criterion

Hit **one** concrete beat for each (don’t dump features):

1. **Problem / insight** — No shared WhatsApp blocklist; scammers hop communities; bans today only ask “known spammer?” not “fits *our* rules?”
2. **Product depth** — Rules-cited accept/ask/decline + hashed shared blocklist + WhatsApp signed webhook.
3. **Human control** — Decline held until the lead clicks (beat 3).
4. **Evidence** — 200 labelled apps · Jev 195/200 · Luna 179/200 · 0 false blocks · 0 missed scammers · ~⅓¢.
5. **Ship / openness** — MIT · self-host with Supabase + a WhatsApp number next week.

---

## Deck shape — **6 slides only**

### Slide 1 — Title
- **Greenlight** (logo mark: black rounded square + green shield)
- Headline (match landing): *Let builders in. Keep scammers out.*
- Sub: Scores WhatsApp apps against your rules + shared hashed blocklist; declines wait for a human click.

### Slide 2 — Problem
- Scammers hop: declined in community A, new handle in community B.
- Existing shared-ban tools are locked to one platform (CAS / Mjolnir / FedBot) and only ask “known spammer?”
- No verified shared blocklist for WhatsApp groups.
- Volunteer leads re-read every application alone.

### Slide 3 — What we built
Four bullets, WhatsApp-only:
1. AI application reviewer → accept / ask / decline + plain-English reason citing the rule.
2. Shared blocklist in Supabase → HMAC-SHA256 keyed hashes, RLS per community, appeal path.
3. Native WhatsApp Cloud API → signed webhook, 1:1 apply + reply.
4. Human in the loop → **declines wait for a lead to click.**

### Slide 4 — Demo storyboard (`/demo`)
Three panels / steps matching the video:
1. Normal applicant → auto reply with cited reason.
2. `@cryptomax_alpha1` → blocklist hit → decline **held**.
3. Lead clicks Send → “never declines on its own.”

### Slide 5 — Evidence
Big numbers matching the site strip: **Jev 195/200** · **Luna 179/200** · **0 false blocks** · **0 missed scammers**.  
Caption: 97.5% · ~⅓¢ · declines wait for a lead click.

### Slide 6 — Close
- MIT · self-host next week.
- Closing line large: **Greenlight: let the right people in.**
- Optional: repo + `/demo` URL.

---

## Visual / tone — match the live site

Mirror `app/globals.css` + landing (`app/(site)/page.tsx`):

- **Surfaces:** white `#fff` / soft grey `#fafafa`; one dark closing slide `#111`.
- **Ink:** `#111`. Muted text `#616161`. Borders `#e5e5e5`.
- **Type:** display = **EB Garamond** (serif, light weight, italic for emphasis); body = **Figtree**.
- **Accent green:** `#22C55E` only on the logo shield / small dots — not purple gradients.
- **Decision colour:** accept emerald-600 · ask amber-500 · decline rose-600, always with a word.
- **Chrome:** rounded-full pills, soft `1rem` cards, thin 1px borders — not the old lime/dark hackathon look.
- No Discord feature claims. No “Gatekeeper.” No “every miss goes to a human.”

---

## Talk track (≤3 min if Top 5)

1. Problem (20s) — hop + no WhatsApp shared blocklist.  
2. Product (40s) — rules fit + hashed list + WhatsApp.  
3. Live `/demo` three beats (90s).  
4. Numbers (20s) — 200 / 97.5% / 60/60 / 0 false / ⅓¢.  
5. Close (10s) — *Greenlight: let the right people in.*

Fallback if `/demo` flakes: play the unlisted video, then answer questions.
