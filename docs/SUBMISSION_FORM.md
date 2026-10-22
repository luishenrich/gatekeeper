# Hackathon submission — copy/paste (field order)

Fill every `[bracket]`. Character count for “What did you build?” is **1155** (under the usual ~1200 limit).

---

## Project name

```
Greenlight
```

## Team name

```
[your team name]
```

## Contact email

```
[your email]
```

## Members  
*(each: name · Cursor email · LinkedIn or X)*

```
[Luis, full name] · [Cursor email] · [LinkedIn or X URL]
[Teammate name] · [Cursor email] · [LinkedIn or X URL]
```

## Track

```
[Track 1 — paste the exact track name from the form dropdown]
```

*(Tracks were revealed on the night. Use the dropdown string verbatim — don’t invent a subtitle.)*

## What did you build? (1155 characters)

```
Every shared-ban tool we found is locked to one platform (Telegram CAS, Matrix Mjolnir, Discord FedBot) and only asks "is this a known spammer?". Greenlight is open-source trust & safety tooling that works across communities on WhatsApp and checks fit against your own rules.
1) AI application reviewer: scores each applicant against the community's written rules and returns accept / ask / decline with a plain-English reason citing the rule.
2) Shared cross-community blocklist in Supabase: only keyed hashes (HMAC-SHA256), Row Level Security per community, and an appeal path for every block.
3) Native WhatsApp Cloud API intake: signed webhook, applicants apply in a 1:1 chat and get a reply.
4) Human in the loop: declines wait for a lead to click.
200-applicant labelled test set: 97.5% correct, all 60 scammers declined, 0 false blocks, no bot let in.
Demo: an applicant is scored and routed with a reason, then a known scammer is caught by the shared blocklist.
Built tonight with Grok Bot holding the context and Cursor agents writing the code. MIT-licensed: any community can self-host it next week with a Supabase project and a WhatsApp number.
```

## Public repo (MIT LICENSE on main)

```
https://github.com/luishenrich/gatekeeper
```

## Demo video link (under 3 minutes, unlisted YouTube or Loom)

```
[paste after recording — target ~21:10–21:30]
```

## Live demo link (optional)

```
https://gatekeeper-kinglhb.vercel.app/demo
```

**Before submit:** open `/demo` once, run both presets (normal applicant + `@cryptomax_alpha1`), then screen-record the three beats for the video.

---

## Claims to keep / cut

**Safe to say**
- Jev **195/200** (97.5%), Luna **179/200**, **0** false blocks, **0** missed scammers (accepted), ~⅓¢ per applicant.
- Declines wait for a lead to click.
- No verified shared WhatsApp-group blocklist among tools we found; Greenlight covers that gap + rules fit.

**Do not say**
- “Every miss goes to a human.”
- Discord support / Discord bot as a product feature (competitors only).
- Old 30-app “29/30 Luna” as the headline — use the **200-applicant** set.

---

## Video / talk — three beats on `/demo`

1. Normal applicant → signed WhatsApp → clear blocklist → auto reply citing the rule.  
2. `@cryptomax_alpha1` → hash match → decline **held**.  
3. Lead clicks Send → never declines on its own.  

Close: **Greenlight: let the right people in.**
