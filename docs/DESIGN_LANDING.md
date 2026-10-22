Discord is out of scope for the demo.

# Greenlight — Landing (`/`) + Sign-in (`/login`) upgrade brief

## 0. What's live now (fetched 22 Oct 2026, 20:1x BST, https://gatekeeper-kinglhb.vercel.app)
- `/` has a title "Gatekeeper", the tagline "Community application vetting with AI scoring and shared blocklist", and two links: **Review Queue** (`/queue`) and **Eval Dashboard** (`/eval`). There is no hero visual, proof, comparison or footer.
- `/login` shows "Lead sign-in · Enter the queue passcode. It is stored only in an httpOnly cookie." with one `password` input (`name="passcode"`) and a **Continue** button, in a `max-w-sm rounded-lg border border-slate-200 shadow-sm` card.
- `/queue` without the cookie renders that same sign-in form.
- ⚠️ **Auth dependency:** `/queue` is gated by the passcode cookie, not a Supabase session. A Supabase magic-link session will **not** unlock `/queue` unless the gate is changed, and that change is out of scope here (no layout or API changes).
  - Therefore the existing **lead-passcode form must stay working** on `/login`, as a third option.
  - Magic link and OTP are added as the primary UI. After success they redirect to `/queue`, and the passcode gate still applies there until someone wires the session into the gate.

## 1. References (Mobbin, as returned)
| # | Reference | Borrow | Link |
|---|---|---|---|
| 1 | Customer.io: developers hero | Left-aligned headline + 2 CTAs; product UI cards floating on the right, including a **score card** ("1.9 Score"). This is the model for our animated queue card | https://mobbin.com/sites/sections/cbac56f2-5cdf-45a1-814d-83c855d8f552 |
| 2 | Vercel: closing CTA band + footer | Three-word punchy closer ("Develop. Preview. Ship.") with stacked primary/secondary CTAs, then a quiet multi-column footer with a status dot | https://mobbin.com/sites/sections/62c13ac6-ec58-49af-9507-9f059e91a4fc |
| 3 | Whereby: "Why switch to Whereby?" comparison | Plain two-tone table: feature rows, our column highlighted, short factual cells, ✓ / "–" | https://mobbin.com/sites/sections/22732bba-1e9b-4720-aba4-2919031c7b2e |
| 4 | MagicPath: "Check your email" (magic link) | Mail icon, "We've sent a magic link to **email**", a 2-item checklist ("Click the link…", "check spam"), a "Waiting for sign-in…" spinner and "Resend in 29s" | https://mobbin.com/screens/3c996257-c47d-4179-a89c-3ccb06f4bbdf |
| 5 | Base44: "Check your email" with split layout | "← Back" link, the email shown bold, an info box, and a "Didn't get the email? **Resend email**" line | https://mobbin.com/screens/bcc04bb1-f24d-4f2b-879a-0b3c0766c6c9 |

(The Mobbin search for "Linear landing hero" returned only in-app screens, so there are no Linear, Clerk, Resend or Stripe landing references.)

## 2. Tokens (same as DESIGN_QUEUE.md)
- **Base:** `bg-white text-slate-900 text-[17px]`. Secondary text is at least `text-slate-600` (never slate-400). Borders are `border-2 border-slate-200`. Radius is `rounded-xl` (cards `rounded-2xl`). Container is `max-w-6xl mx-auto px-6`.
- **Decisions:**
  - accept: `bg-emerald-600 text-white`
  - ask: `bg-amber-500 text-slate-950`
  - decline: `bg-rose-600 text-white`
- **Blocklist:**
  - Badge: `bg-rose-700 text-white uppercase tracking-wide`
  - Card: `ring-4 ring-rose-600`
  - Callout: `bg-rose-50 border-2 border-rose-600`
- **Channels:** WhatsApp `bg-green-100 text-green-900 border border-green-700`; Discord `bg-indigo-100 text-indigo-900 border border-indigo-700`.
- **Buttons:** both are `h-14 px-7 text-lg rounded-xl` with visible focus `focus-visible:ring-4 ring-slate-900/30`.
  - Primary: `bg-slate-900 text-white font-bold hover:bg-slate-800`
  - Secondary: `border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50`
- **Type:** H1 `text-5xl md:text-6xl font-black tracking-tight`. H2 `text-3xl md:text-4xl font-extrabold`. Eyebrow `text-sm font-bold uppercase tracking-widest text-emerald-700`.
- **Motion:** only `transition` + `animate-pulse`/keyframes on the hero card. Respect `motion-reduce:animate-none`.

## 3. Landing section order
1. **Nav** (`h-16 border-b-2 border-slate-200`): Gatekeeper wordmark (shield glyph) · How it works · Compare · Self-host · `Sign in` (secondary small) · `Open review queue` (primary small).
2. **Hero** (2 columns: copy left, animated card right).
3. **Benchmark strip.**
4. **Why not existing tools** (comparison table).
5. **How it works** (4 steps).
6. **Self-host / MIT.**
7. **Closing CTA band** (Vercel-style).
8. **Footer.**

## 4. Hero
- Eyebrow: `TRUST & SAFETY FOR COMMUNITY BUILDERS`
- **Headline:** "Stop the scammer before they join your *second* group."
- **Subhead:** "Gatekeeper scores every application against your community's rules, explains why, and checks a shared, hashed blocklist across WhatsApp and Discord communities. A human approves every decision."
- CTAs:
  - **Open review queue** → `/queue` (primary)
  - **Self-host (MIT)** → repo URL (secondary). Use a `REPO_URL` constant and keep `#self-host` until the team supplies the URL.
- Micro-line under the CTAs: "Phone numbers are HMAC-hashed. Raw numbers never leave your community."
- **Visual: `HeroQueueCard`**, a mock of the queue's detail card (`rounded-2xl border-2 border-slate-200 bg-white shadow-xl p-6 w-full max-w-md`). It animates on a ~6s loop, or is static under `motion-reduce`:
  1. **0.0s:** a row slides in: avatar "MM", **Max Moonshot** `@cryptomax_alpha1`, Discord badge, applied to *South London Hack Nights*. A pill reads "Scoring…" (`bg-slate-100 text-slate-800`, pulse).
  2. **1.2s:** signal chips appear one by one:
     - ✕ Spam text: "10x guaranteed"
     - ✕ Rules fit: Rule 5
     - ✕ Blocklist
  3. **2.4s:** the card gains `ring-4 ring-rose-600`, the `BLOCKLIST` badge appears, and the callout fades in: "🚫 Seen in **London Agent Builders**, same phone hash · `hmac:3f9a…`". Show the hash prefix only, never a phone number.
  4. **3.2s:** a big `DECLINE` pill (`bg-rose-600 text-white text-2xl font-extrabold px-5 py-2 rounded-xl`) appears with "Score 4".
  5. **4.0s:** a reply draft line appears, then a toast "Declined · reply ready for review · UNDO".
  - Data is fictional (A22 in `applicants.json`: Max Moonshot, @cryptomax_alpha1, community 2, duplicate of A21 in community 1).
  - The score of 4 is illustrative and is labelled "demo data" in tiny text under the card.

## 5. Benchmark strip (use ONLY these numbers)
`section class="border-y-2 border-slate-200 bg-slate-50"`, 4 stat tiles in `grid md:grid-cols-4`:
| Big number | Label |
|---|---|
| **29/30** | GPT-6 Luna |
| **28/30** | Jev |
| **0** | false blocks |
| **0** | missed scammers |
- Caption under the strip (required): "On our 30-applicant test set (fictional applicants: 12 good fits, 8 borderline, 10 scammers/bots)."
- Link: "See the eval →" to `/eval`.
- **No other metrics.** No percentages, speeds or "time saved" claims on the landing page.
- Number style: `text-5xl font-black tabular-nums`. Use `text-emerald-700` for the two zeros and `text-slate-900` for the model scores.
- (The 12/8/10 split is from `expected_decisions.csv`.)

## 6. "Why not existing tools" (sources: `gatekeeper_data/competitors.md`)
Whereby-style table. The Gatekeeper column is highlighted (`bg-emerald-50 border-x-2 border-emerald-600`) and rows are `border-b-2 border-slate-200`.
| | Combot CAS | Matrix Mjolnir / Draupnir | Discord FedBot | **Gatekeeper** |
|---|---|---|---|---|
| Platforms | Telegram only | Matrix only | Discord only | **WhatsApp + Discord** |
| Decision | Auto-ban on join, no human review ("CAS bans are non-negotiable") | Bans enforced on sight from subscribed lists | Crossban propagation (auto / manual review / notify) | **Rules-fit score + reason quoting your rule** |
| Shared list keyed on | Telegram user ID | Matrix user ID | Discord account | **HMAC phone hash + handle variants** |
| Human in the loop | ✕ | – (policy-level) | ✓ optional manual mode | **✓ every decision, with reply draft** |
| Applicant fit scoring | ✕ | ✕ | ✕ (risk engine, not fit) | **✓** |
- Footnote with sources: cas.chat · matrix.org/docs/communities/moderation · github.com/the-draupnir-project/Draupnir · fedbot.app. Keep the wording factual and non-disparaging.
- The FedBot "human-review mode" fact comes from competitors.md; credit it rather than hide it.

## 7. How it works (4 steps, `grid md:grid-cols-4`, numbered circles `h-10 w-10 rounded-full bg-slate-900 text-white font-bold`)
1. **Apply.** Applicants message your WhatsApp number or join your Discord intake.
2. **Score.** Gatekeeper checks the application against your written rules and spam signals, and returns accept / ask / decline with a reason.
3. **Cross-check.** Phone numbers are HMAC-hashed and matched against the shared blocklist of partner communities; only the hash is shared.
4. **Review.** A lead clears the queue with the keyboard (A / S / D, ⏎). Each decision sends an editable reply, and appeals stay open.

## 8. Self-host / MIT (`id="self-host"`)
- Two columns. Left side:
  - "Your community, your data. MIT-licensed. Runs on Supabase + Vercel."
  - Bullets: "Bring your own HMAC secret", "Subscribe to the blocklists you trust", "Human confirms every cross-group flag".
- Right side: a code card (`rounded-2xl bg-slate-900 text-slate-100 font-mono text-base p-6`):
  ```
  git clone <REPO_URL>
  cp .env.example .env.local   # SUPABASE_URL, SUPABASE_ANON_KEY, HMAC_SECRET
  npm i && npm run dev
  ```
  The env names are placeholders. ⚠️ Confirm them against `.env.example` in the repo before shipping.
- CTA: **Self-host (MIT)** (secondary).

## 9. Closing CTA band + footer
- **Band:** "Review. Explain. Block once, everywhere." with **Open review queue** and **Self-host (MIT)** buttons.
- **Footer** (`border-t-2 border-slate-200 py-10 text-slate-600`):
  - Left: Gatekeeper · "Built at the Grok Bot Community Engineering London Hackathon, 22 Oct 2026" · MIT License.
  - Links: Review queue · Eval · GitHub · Privacy note ("We store hashes, not phone numbers").
  - "All applicant data shown is fictional."

## 10. Sign-in page (`/login`)
- **Layout:** centred card, `min-h-screen grid place-items-center bg-slate-50`. Card is `w-full max-w-md rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm`. Wordmark above it; "← Back to home" link below.
- **State `idle`:**
  - H1 "Sign in to Gatekeeper"; sub "Community leads only. We'll email you a magic link."
  - Email input: `h-14 text-lg border-2 border-slate-300 rounded-xl px-4 focus:border-slate-900`, with label "Work email".
  - Primary full-width button **Email me a magic link**.
  - Small link below: **Use passcode instead**. It switches the form to OTP mode with a 6-digit code.
- **Magic link:**
  ```ts
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/queue`, shouldCreateUser: false },
  });
  ```
  - `shouldCreateUser: false` makes it leads only. ⚠️ This requires the leads to already exist in Supabase Auth; otherwise drop the option.
  - Create the client inline in the page with `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`, and only if `@supabase/supabase-js` is already a dependency. If it isn't, the agent must stop and report rather than edit package.json.
- **State `sent` ("Check your email"),** MagicPath / Base44 pattern:
  - Mail icon in `h-14 w-14 rounded-full bg-emerald-50 border-2 border-emerald-600`.
  - H1 "Check your email"; "We sent a sign-in link to **{email}**."
  - Checklist: ✓ "Open the link on this device", ! "Not there? Check spam".
  - "Resend in 30s" countdown, then a **Resend link** button.
  - **Enter a 6-digit code instead** link (goes to OTP mode with the email prefilled).
  - "Wrong address? Change email" link.
- **OTP mode** ("Use passcode"):
  - Input: `inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}"` with large text (`text-3xl tracking-[0.5em] text-center font-mono`).
  - If there's no email yet, show the email field too. Button **Verify code**.
  - If no code has been sent yet, the button **Send code** calls the same `signInWithOtp` (the Supabase email template must include `{{ .Token }}` for a code to appear; ⚠️ check the template).
  - Verify:
  ```ts
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (!error) router.push("/queue");
  ```
- **State `error`:** `rounded-xl border-2 border-rose-600 bg-rose-50 text-rose-900 p-4` with ✕ icon and a plain message:
  - Rate limit: "Too many requests, wait a minute."
  - Invalid or expired code: "That code didn't work or has expired. Send a new one."
  - Generic: "Couldn't send the email. Try again."
  - Keep the input values and focus the field. Use `aria-live="polite"`.
- **Loading:** button disabled, label "Sending…" or "Verifying…", with a spinner.
- **Keep the current lead-passcode form** (it unlocks `/queue` today):
  - Put it under a `<details>` disclosure "Have the event lead passcode?" at the bottom of the card.
  - Keep **the exact same form, field name (`passcode`) and submit logic** as the current `app/login/page.tsx`; only restyle it with the tokens.
- **Accessibility:** labels on all inputs, `autoFocus` on the first field, Enter submits, 17px base, contrast AA+.

---

## 11. Paste-ready Cursor prompt
```
Upgrade the Gatekeeper landing and sign-in pages per docs/DESIGN_LANDING.md. Touch ONLY app/page.tsx and app/login/page.tsx. Do NOT edit layout.tsx, any API route, middleware, package.json, or other files. Tailwind only (inline components in the same file are fine).

Tokens (match docs/DESIGN_QUEUE.md): bg-white text-slate-900 text-[17px]; secondary text ≥ text-slate-600 (never slate-400); 2px borders border-slate-200; rounded-xl/2xl; max-w-6xl mx-auto px-6. Decisions: accept bg-emerald-600 text-white, ask bg-amber-500 text-slate-950, decline bg-rose-600 text-white. Blocklist: badge bg-rose-700 text-white uppercase, card ring-4 ring-rose-600, callout bg-rose-50 border-2 border-rose-600. Discord badge bg-indigo-100 text-indigo-900 border-indigo-700. Buttons h-14 px-7 text-lg rounded-xl font-bold; primary bg-slate-900 text-white, secondary border-2 border-slate-900. Visible focus rings. motion-reduce:animate-none on all animation.

app/page.tsx (server component, plus a small "use client" HeroQueueCard defined in the same file only if needed; otherwise CSS-only animation via Tailwind arbitrary animate/delay classes):
1. Nav: wordmark, links How it works / Compare / Self-host (anchors), Sign in (/login), Open review queue (/queue).
2. Hero: eyebrow "TRUST & SAFETY FOR COMMUNITY BUILDERS"; H1 "Stop the scammer before they join your second group." (emphasise "second"); subhead "Gatekeeper scores every application against your community's rules, explains why, and checks a shared, hashed blocklist across WhatsApp and Discord communities. A human approves every decision."; CTAs "Open review queue" → /queue and "Self-host (MIT)" → const REPO_URL = "#self-host"; micro-line "Phone numbers are HMAC-hashed. Raw numbers never leave your community." Right: HeroQueueCard, a staged ~6s loop: row "MM · Max Moonshot @cryptomax_alpha1 · Discord · South London Hack Nights" with a "Scoring…" pill → chips ✕ Spam text "10x guaranteed", ✕ Rules fit "Rule 5", ✕ Blocklist → ring-4 ring-rose-600 + BLOCKLIST badge + callout "Seen in London Agent Builders, same phone hash · hmac:3f9a…" (hash prefix only, never a phone number) → big DECLINE pill + "Score 4" → toast "Declined · reply ready for review · UNDO". Tiny caption "demo data".
3. Benchmark strip with EXACTLY these four tiles and no other metrics: "29/30 GPT-6 Luna", "28/30 Jev", "0 false blocks", "0 missed scammers". Caption: "On our 30-applicant test set (fictional applicants: 12 good fits, 8 borderline, 10 scammers/bots)." Link "See the eval →" /eval.
4. id="compare" table, columns Combot CAS | Matrix Mjolnir / Draupnir | Discord FedBot | Gatekeeper (highlighted bg-emerald-50 border-x-2 border-emerald-600). Rows: Platforms (Telegram only | Matrix only | Discord only | WhatsApp + Discord); Decision (Auto-ban on join, no human review | Bans enforced on sight from subscribed lists | Crossban propagation (auto / manual review / notify) | Rules-fit score + reason quoting your rule); Shared list keyed on (Telegram user ID | Matrix user ID | Discord account | HMAC phone hash + handle variants); Human in the loop (✕ | – | ✓ optional manual mode | ✓ every decision, with reply draft); Applicant fit scoring (✕ | ✕ | ✕ | ✓). Footnote sources: cas.chat · matrix.org/docs/communities/moderation · github.com/the-draupnir-project/Draupnir · fedbot.app.
5. id="how" 4 steps: Apply / Score / Cross-check / Review (copy in the brief §7).
6. id="self-host" MIT section with the bullets and a dark code card (git clone <REPO_URL>; cp .env.example .env.local; npm i && npm run dev).
7. Closing band "Review. Explain. Block once, everywhere." with both CTAs. Footer: "Built at the Grok Bot Community Engineering London Hackathon, 22 Oct 2026" · MIT License · links Review queue / Eval / GitHub · "We store hashes, not phone numbers" · "All applicant data shown is fictional."

app/login/page.tsx ("use client"): FIRST read the current file and keep its existing lead-passcode form (field name "passcode", same submit handler/endpoint, same behaviour) intact, restyled, inside a <details> "Have the event lead passcode?" at the bottom of the card. Above it add Supabase auth ONLY if @supabase/supabase-js is already in package.json (if not, stop and tell me; don't install). Client: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) created in the file. States: "idle" (H1 "Sign in to Gatekeeper", sub "Community leads only. We'll email you a magic link.", labelled email input h-14 text-lg border-2, button "Email me a magic link", small link "Use passcode instead"); "sent" (mail icon in emerald circle, H1 "Check your email", "We sent a sign-in link to {email}.", checklist ✓ Open the link on this device / ! Not there? Check spam, 30s resend countdown then "Resend link", link "Enter a 6-digit code instead", link "Change email"); "otp" (email field if empty, input inputMode numeric autoComplete one-time-code maxLength 6, text-3xl tracking-[0.5em] text-center font-mono, button "Send code" if not yet sent else "Verify code"); "error" (rounded-xl border-2 border-rose-600 bg-rose-50 text-rose-900, aria-live polite, keep inputs). Magic link: supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/queue`, shouldCreateUser: false } }). Code: supabase.auth.verifyOtp({ email, token: code, type: "email" }) then router.push("/queue"). Map errors: rate limit → "Too many requests, wait a minute."; invalid/expired → "That code didn't work or has expired. Send a new one."; else "Couldn't send the email. Try again." Loading labels "Sending…"/"Verifying…" with disabled buttons. "← Back to home" link under the card.

Done when: npm run build passes; / renders all 8 sections with only the four benchmark numbers; /login shows idle → sent → otp → error states; the existing passcode form still unlocks /queue.
```
