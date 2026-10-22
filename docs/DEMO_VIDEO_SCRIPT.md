# Greenlight: demo video script (about 2:30)

The recorder (`record-demo.mjs`) plays these scenes in this order and shows on-screen captions. Read the voiceover over the silent recording, or record it live in QuickTime while the script runs.

| Time | Screen | Voiceover |
|---|---|---|
| 0:00 | Landing hero, animated queue card | "Community leads in London get flooded with applications, and some of them are scammers who hop from group to group. Greenlight is an open-source gatekeeper for communities." |
| 0:12 | Scroll: benchmark | "We tested it on 200 labelled applicants. Jev got 195 right. Zero good people were blocked and zero scammers were let in." |
| 0:20 | Scroll: features | "People apply where they already are, on WhatsApp or a web form. Scammers are shared across communities as a hash, never a phone number. And a human approves every decline." |
| 0:30 | /demo: known scammer, Send via WhatsApp | "Here's a live WhatsApp application from a known scammer, @cryptomax_alpha1, applying to South London Hack Nights." |
| 0:40 | Timeline animates | "The webhook signature is verified. The phone hash matches the shared blocklist: this person was already confirmed as a scammer in London Agent Builders. Then the model scores the message against this community's own written rules and cites the rule it broke." |
| 0:58 | Waiting for a lead | "Nothing is sent automatically for a decline. It waits for a human." |
| 1:05 | /apply: strong applicant | "Anyone can also apply on the web. A real builder gets a clear decision with the reason, the rule it used, and the signals: spam, GitHub, StopForumSpam, and the blocklist." |
| 1:20 | Lead signs in → /queue | "The community lead opens the queue. Blocklist hits come first, and every recommendation explains itself." |
| 1:30 | Press D, edit, Enter, undo toast | "One key to decline. The reply is drafted, the lead can edit it, and Enter sends it after a six-second undo window." |
| 1:45 | /dashboard | "The dashboard shows today's decisions, the scammers stopped across communities, and the time saved." |
| 1:52 | /rules | "Each community writes its own rules in plain language, and that is exactly what the model reads." |
| 2:00 | /eval | "All the numbers are public. Jev 195 out of 200, GPT-6 Luna 179. Every miss went to Ask, never to Accept." |
| 2:12 | Landing | "Greenlight is MIT licensed. Self-host it, share a blocklist with your neighbours, and let builders straight in." |

## How to record
1. Use the production URL once PR #7 is deployed, so the scorer and the WhatsApp demo run for real. Mock mode shows "Mock response" text.
2. Run the recorder from a terminal. The passcode is read from your environment, so it is never written to a file:
   `GK_URL=https://<deployed-url> GK_PASSCODE='<lead passcode>' node record-demo.mjs ~/Desktop/greenlight-video`
3. The output is `~/Desktop/greenlight-video/greenlight-demo.mp4` (1280×720, silent). Add the voiceover in QuickTime, iMovie or CapCut.
