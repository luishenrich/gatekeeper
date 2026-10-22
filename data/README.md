# Gatekeeper demo dataset (Track 1) — all applicant data is FICTIONAL

| File | Contents |
|---|---|
| `rules.md` | Rules + membership criteria for 2 fictional communities: **London Agent Builders** (community 1) and **South London Hack Nights** (community 2). Rule numbers are referenced in applicant reasons. |
| `applicants.json` / `applicants.csv` | 30 fictional applicants. Fields: id, name, handle, phone (Ofcom drama range +44 7700 900xxx), email (@example.com), github, linkedin (fictional or null), application_text, community_applied (1/2), expected_decision, reason, category, cross_group_dup_of. Mix: 12 good_fit, 8 borderline, 8 scammer + 2 bot. |
| `expected_decisions.csv` | Ground truth: id, expected_decision, reason (12 accept / 8 ask / 10 decline). |
| `spam_messages.json` / `ham_messages.json` | 100 spam + 100 ham real SMS from HF `ucirvine/sms_spam` (via datasets-server rows API). HF card licence = "unknown" → demo/research use only. |
| `sfs_samples.json` | Raw StopForumSpam API responses for harmless test values and doc examples. |
| `competitors.md` | Existing shared-blocklist / cross-community ban tools, links, and gaps. |

## Cross-group scammer demo
Decline in community 1, then the same person applies to community 2:
- A21 → A22: same phone +44 7700 900901, handle `@cryptomax_alpha` → `@cryptomax_alpha1`
- A23 → A24: same phone +44 7700 900902, handle `@talent_rachel_hr` → `@talent.rachel.hr`
- A25 → A26: identical phone + handle `@best_deals_4u`
Normalise handles (lowercase, strip `._-` and trailing digits) and match on HMAC(phone) to catch the variants.

## Notes
- No real people. Phones are in the Ofcom range reserved for TV/radio drama; emails use example.com; GitHub/LinkedIn values end in `-demo` and are not real profiles (not checked for accidental collisions).
- A28 ("Generic Synthia") is deliberately ambiguous (LLM-generic text): expected `decline`, but flagging for human review is also defensible.
