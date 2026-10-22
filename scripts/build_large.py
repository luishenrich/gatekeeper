#!/usr/bin/env python3
"""Builds applicants_large.json/.csv + expected_decisions_large.csv.
Identities are ALL fictional (invented names, Ofcom drama numbers +44 7700 900000-900999,
@example.com emails, invented handles). Real text comes only from:
 - ucirvine/sms_spam (UCI SMS Spam Collection, CC BY 4.0) via local spam_messages.json
 - thehamkercat/telegram-spam-ham (HF, WTFPL) via /tmp/tg2_spam.json (fetched rows 15000-19099)
Digit runs >=7, URLs, emails and 'Mr/Mrs X' names in real texts are scrubbed/replaced."""
import json, random, re, csv, os
random.seed(42)
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIRST = "Ada Bram Cosima Dario Elin Farid Greta Hamza Ines Jory Kemi Lorcan Mirela Nnamdi Orla Priya Quentin Rhiannon Soren Tamsin Ugo Vesna Wren Xander Yusra Zeb Anouk Bilal Calla Dmitri Esme Fenwick Gulnar Hollis Ilse Jago Kasia Lysander Maeve Niko Oona Pascal Rafferty Saoirse Teodor Una Vikram Willa Yannick Zofia Aurelio Bea Cassius Delphine Emrys Freya Gideon Hana Idris Juno Kit Leocadia Marlo Nell Osric Petra Ravi Sunniva Thorne Ulla Vida Wolfie Ysolde Zainab Amara Basil Clem Dov Eira".split()
LAST = "Quillfeather Brackenridge Mossgrove Tinderbay Halloway Farthingale Pebbleworth Ashcombe Sallowmere Kettleby Drummondale Fernsby Oakhurst Wexley Larkspur Thornquist Vellacott Brindlecombe Hartigan Mallowfield Pennywhistle Rookwood Sedgemoor Tallowmere Underhay Vantablue Whitlock Yarrowby Ziegelhoff Ambersley Corriveau Dunmore Elsworth Glanville Hensbury Inchbold Jessamy Kilbride Lowther Merriwether Northcote Ormsby Pemberley Quarrington Ravensworth Stonebridge Trevanion Upfold Varden Winterbourne".split()
used_names=set()
def person():
    while True:
        n=f"{random.choice(FIRST)} {random.choice(LAST)}"
        if n not in used_names: used_names.add(n); return n
def handle_of(n, style=None):
    f,l=n.lower().split()
    return random.choice([f"@{f}_{l[:4]}", f"@{f}.{l[:3]}", f"@{f[0]}{l}", f"@{f}builds", f"@{f}_{l[:2]}{random.randint(1,99)}"])
phones=iter(range(100,1000))
used_ph=set()
def phone(n):
    used_ph.add(n); return f"+44 7700 900{n:03d}"
def email(n): f,l=n.lower().split(); return f"{f}.{l}@example.com"
recs=[]
def add(cat, comm, dec, text, reason, source="synthetic", name=None, handle=None, ph=None, gh=None, li=None, dup=None):
    name=name or person()
    recs.append(dict(id=None, name=name, handle=handle or handle_of(name), phone=ph, email=email(name),
        github=gh, linkedin=li, application_text=text, community_applied=comm, expected_decision=dec,
        reason=reason, category=cat, cross_group_dup_of=dup, source=source))
    return recs[-1]

# ---------- GOOD FIT, community 1 (rules 1-3 met, no rule 4/5 issue) ----------
AREAS="Hackney|Peckham|Walthamstow|Brixton|Camden|Islington|Deptford|Stratford|Clapham|Shoreditch|Kentish Town|Bermondsey|Tottenham|Wimbledon|Ealing|Greenwich|Lewisham|Hammersmith|Bethnal Green|Stoke Newington|King's Cross|Battersea|Croydon|Finsbury Park".split("|")
WORK=[("a tool-calling agent that reconciles supplier invoices against purchase orders","I can share our eval set of 400 messy invoices"),
("a RAG assistant over NHS clinical guidelines for a hospital trust pilot","happy to talk about retrieval evals with clinicians in the loop"),
("an open-source library for replaying and diffing agent traces","I'd like to demo the trace viewer at a demo night"),
("a voice agent that triages calls for a small plumbing firm","keen to compare notes on latency and barge-in handling"),
("a multi-agent setup that writes and runs dbt tests","I can run a session on sandboxing agents that touch databases"),
("evals for browser agents filling in council planning forms","looking for people who've tried computer-use models in production"),
("a Slack agent that answers on-call questions from our runbooks","I'll bring our hallucination post-mortem as a lightning talk"),
("an MCP server that exposes our internal pricing API to Claude-style agents","want feedback on auth patterns for MCP"),
("a coding agent that migrates legacy Python 2 services","I can share what broke and what our test harness caught"),
("a small open-source framework for typed agent tools in TypeScript","would love contributors and to give a 10-minute demo"),
("an agent that drafts tenancy-dispute letters for a housing charity","need advice on guardrails and red-teaming"),
("memory for long-running research agents using a graph store","can share benchmarks comparing summarised vs raw memory"),
("a retrieval pipeline over 20 years of local newspaper archives","happy to help newcomers with chunking and OCR clean-up"),
("an agent that reviews pull requests for accessibility issues","would like to pair with someone on eval design"),
("a fine-tuned small model that routes support tickets before an agent picks them up","I'll share cost numbers versus a frontier model"),
("a scheduling agent for a network of community kitchens","looking for people who've done constraint solving with LLMs"),
("synthetic data generation for testing financial-crime agents","can talk about privacy-safe test data"),
("an evaluation dashboard for LLM judges with human agreement scores","would like to demo it and get critique"),
("a Discord bot that runs agentic code reviews for a student society","hoping to bring two teammates to the next hack night"),
("a robotics planning agent on a Raspberry Pi arm","happy to bring the arm to a demo night"),
("guardrails that stop agents leaking PII in tool outputs","can share our regex + classifier approach"),
("an agent that turns meeting transcripts into Jira tickets with links back to source","want to learn how others measure task success"),
("local-first agents running on llama.cpp for a law firm that can't use cloud APIs","keen to swap notes on quantisation trade-offs"),
("a translation agent for refugee legal paperwork with a human review step","would love volunteers who know eval methodology"),
]
ROLES=["ML engineer at a London logistics startup","Backend developer at a fintech in Canary Wharf","Final-year UCL computer science student","PhD student at Imperial working on planning","Freelance Python developer","Staff engineer at a London health-tech company","Data scientist at a housing association","Self-taught developer who left accounting last year","CTO of a four-person startup near Old Street","Researcher at a King's College lab","Software engineer at a London games studio","Bootcamp graduate now working as a junior AI engineer","Platform engineer at a media company in White City","Solo founder (pre-revenue, not fundraising)","Engineer at a climate-data nonprofit"]
FRAMES=[
 "{role}. I'm building {w}. Based in {a}. {g}.",
 "Hi! I live in {a} and spend most evenings on {w} (repo: github.com/{gh}). {g}.",
 "{role}, {a}-based. Current project: {w}. {g} — and I mostly want to learn from people shipping real agents.",
 "What I build: {w}. Where: {a}, London. Why join: {g}, and I've been to two of your demo nights already as a guest.",
 "I've spent the last six months on {w}. {g}. I work from {a} so Thursday meetups are easy for me.",
 "{role} in {a}. Shipped v1 of {w} last month, v2 is in progress. {g}.",
 "Short version: London ({a}), building {w}, {g}.",
]
for i in range(65):
    n=person(); w,g=random.choice(WORK); a=random.choice(AREAS); f,l=n.lower().split(); gh=f"{f}-{l[:5]}-demo"
    t=random.choice(FRAMES).format(role=random.choice(ROLES),w=w,a=a,g=g[0].upper()+g[1:],gh=gh)
    has_gh=random.random()<0.7
    add("good_fit",1,"accept",t,f"Concrete AI/agent project described, London ({a}), offers to share/demo; no pitch (rules 1, 2, 3).",
        name=n, ph=phone(next(phones)), gh=gh if has_gh else None, li=None if has_gh else f"linkedin.com/in/{f}-{l}-demo")
# ---------- GOOD FIT, community 2 (organisers) ----------
ORGS=[("a monthly Rust hack night in Peckham","about 60 regulars"),("Women Who Ship, an evening coding meetup in Brixton","roughly 300 members"),("the Deptford Python Social","around 120 people on the list"),("a weekly AI agents co-working night in Croydon","15-25 people each week"),("Clapham Data Drinks","about 200 members"),("a student hackathon at a South Bank university","350 attendees last year"),("Lewisham Civic Tech","around 80 members"),("a monthly LLM paper-reading group in Elephant & Castle","40-ish people"),("Southwark Indie Hackers","about 150 members"),("a hardware hack night at a Wimbledon makerspace","30 regulars"),("Brixton Frontend Folk","about 220 members"),("a beginners' JavaScript club in Streatham","50 members"),("Greenwich Game Jam","90 participants per jam"),("a quarterly accessibility hackathon in Kennington","about 100 people"),("Tooting Tech Breakfasts","around 70 members")]
for org,size in ORGS:
    t=random.choice(["I run {o} — {s}. Looking for venue swaps and speakers.","Co-organiser of {o}, {s}. Would love to coordinate dates so we don't clash with other South London events.","I organise {o} ({s}). Happy to share our venue contacts and sponsor list."]).format(o=org,s=size)
    add("good_fit",2,"accept",t,"Organises a named London tech community and answers the screening question with size (community 2 rules 1, 2).",ph=phone(next(phones)))
# ---------- BORDERLINE (ask) ----------
B=[
 ("I'm really into AI and read every newsletter. Would love to be part of the community!",1,"Plausible human but no specifics about what they build (rule 2) — ask what they're working on."),
 ("Passionate about the future of agents. Keen to network and learn.",1,"Buzzwords without any concrete project (rule 2) — ask."),
 ("Product manager at a London bank exploring how we could use agents. Haven't built anything myself yet.",1,"London but not yet building (rule 1) — ask what they want to build/learn."),
 ("Account executive at an LLM observability vendor in London. I'd like to understand what builders struggle with.",1,"Sales role (rule 4) — ask to confirm no cold DMs/pitching."),
 ("Senior technical recruiter covering AI roles in London. I also follow the space closely.",1,"Recruiter (rule 4) — ask to confirm jobs only in #jobs."),
 ("Partner at a seed fund in Mayfair; we're looking at agent infrastructure companies.",1,"Investor (rule 4) — ask to confirm no deal-sourcing DMs."),
 ("I build LangGraph agents for a Berlin startup and contribute to an OSS eval library. Fully remote, rarely in the UK.",1,"Strong builder but remote/outside London (rule 3) — ask about attendance."),
 ("Building a RAG chatbot for my company in Manchester. Could come down for big events maybe twice a year.",1,"Builder but not London-based (rule 3) — ask."),
 ("Started learning Python a month ago, followed a tutorial to make my first chatbot.",1,"Beginner; building is very early, no link (rules 1-2) — ask for what they've made."),
 ("Data analyst, curious about agents. Mostly Excel and a bit of SQL right now.",1,"Not yet building with AI (rule 1) — ask."),
 ("Founder of an AI consultancy; we help companies adopt agents. Would love to meet potential partners.",1,"Possible sales/business-development intent (rule 4) — ask to confirm participation not pitching."),
 ("I make YouTube videos reviewing AI tools and want to find guests from the community.",1,"Content creator; unclear if they build and may solicit members (rules 1, 4) — ask."),
 ("Hi, please add me.",1,"No information at all (rules 1-2) — ask."),
 ("Friend of a member told me to apply :)",1,"No information on building or location (rules 1-3) — ask."),
 ("I work in growth marketing at an AI startup and would like to share our launches with builders.",1,"Marketing/promo intent (rule 4: promo only in #show-and-tell with demo) — ask."),
 ("Engineer at a Lisbon agency building voice agents; I'm in London about four times a year.",1,"Builder, off-location (rule 3) — ask about attendance."),
 ("Moving to London in January; currently in Toronto building evals for a search team.",1,"Builder not yet London-based (rule 3) — ask."),
 ("Talent partner at a VC platform team; I'd like to keep a pulse on AI engineers in London.",1,"Recruiting/VC role (rule 4) — ask."),
 ("Student, interested in AI ethics. I don't code much but want to understand agents.",1,"Not building (rule 1) — ask what they'd like to learn/contribute."),
 ("I sell GPU cloud capacity and many of your members probably need compute. I won't spam, promise.",1,"Sales role (rule 4) — ask to confirm no cold DMs."),
 ("AI enthusiast, London. Let's connect!",1,"London but no specifics (rule 2) — ask."),
 ("Building something stealth in the agents space, can't say more yet. Based in Islington.",1,"No specifics about what they build (rule 2) — ask for whatever they can share."),
 ("Remote-only freelancer doing prompt engineering for clients in the US.",1,"Remote-only (rule 3) and vague work — ask."),
 ("Head of AI partnerships at a consultancy; looking to meet builders for our client projects.",1,"Business-development/recruiting angle (rule 4) — ask."),
 ("UX designer in Hackney, I prototype agent interfaces in Figma but don't write code.",1,"London, adjacent to building; unclear if they build with AI (rule 1) — ask."),
 ("I used ChatGPT to write my dissertation and want to learn more.",1,"No building activity (rule 1) — ask."),
 ("Hello, I am interested in your group.",2,"No screening answer (community 2 rule 2) — ask which community they run."),
 ("I'd like to join to find speakers.",2,"Doesn't say which community they run (community 2 rules 1-2) — ask."),
 ("I run a paid prompt-engineering course and would like to share it with organisers occasionally.",2,"Paid course promo (community 2 rule 3) and no community named — ask."),
 ("I help organise events, mostly online.",2,"Not clear it's a London community; no name/size (community 2 rules 1-2) — ask."),
 ("Event sponsor manager at a dev-tools company; we fund meetups in London.",2,"Sponsor, not an organiser (community 2 rule 1) — ask."),
 ("I organise a meetup in Bristol and want to start one in London next year.",2,"Not yet organising in London (community 2 rule 1) — ask."),
 ("Venue manager at a co-working space in Vauxhall; we host lots of tech events.",2,"Venue host, not organiser (community 2 rule 1) — ask."),
 ("I'm a member of a few South London meetups and want to help.",2,"Attends but doesn't organise (community 2 rule 1) — ask."),
 ("Founder of a ticketing app for meetups, would love to show it to organisers.",2,"Product promotion (community 2 rule 3) — ask to keep promo to the weekly thread."),
 ("Co-run a crypto developer meetup in Bermondsey, ~40 people; we talk about Solidity tooling, not trading.",2,"Organiser with screening answer, but crypto topic warrants a quick check against zero-tolerance rule (rule 4) — ask."),
 ("I organise hackathons.",2,"No community name, location or size (community 2 rules 1-2) — ask."),
 ("Recruiter who sponsors pizza at hack nights; want to meet organisers.",2,"Recruiter, not organiser (community 2 rule 1) — ask."),
]
# 12 more borderline community-1 variants with rule-3 / rule-4 mixes
MORE=[("Developer advocate at a US vector DB company, based in New York, building sample agents for our docs.","Builder but remote (rule 3) — ask."),
("I lead a sales engineering team in London selling an agent platform; I do write demo agents myself.","Builds, but sales role (rule 4) — ask to confirm no pitching."),
("Angel investor and ex-engineer in Richmond; I still hack on weekend RAG projects.","Investor role (rule 4) — ask to confirm intent."),
("Tech lead in Edinburgh building tool-use agents; I'd attend online if possible.","Outside London (rule 3) — ask."),
("I'm an AI 'automation' freelancer on Upwork, I build Zapier flows with GPT.","Some building but vague and possible solicitation (rules 2, 4) — ask."),
("Want to learn agents. Can you recommend where to start?","No specifics or location (rules 1-3) — ask."),
("Hiring manager for an AI team in Soho; I'd like to meet candidates at events.","Recruiting intent (rule 4) — ask."),
("I'm a journalist covering AI for a London paper and would like to attend demo nights.","Not a builder; press presence needs confirmation (rules 1, 4) — ask."),
("Building an agent for my own small e-commerce store in Leeds.","Builder, not London (rule 3) — ask."),
("CS teacher at a secondary school in Hounslow; I want to bring agent projects to my students but haven't built one.","London, not yet building (rule 1) — ask."),
("Ops person at a startup; I set up our AI customer support tool (vendor product).","Configures a vendor tool, unclear if builds (rules 1-2) — ask."),
("Dutch student doing an exchange semester in London until March, learning RAG.","Temporarily in London, early-stage builder (rules 1, 3) — ask."),
]
for t,c,r in B: add("borderline",c,"ask",t,r,ph=phone(next(phones)))
for t,r in MORE: add("borderline",1,"ask",t,r,ph=phone(next(phones)))
assert sum(1 for x in recs if x['category']=='borderline')==50

# ---------- SCAMMERS ----------
scam_phone=iter(range(600,900))
def scrub(t):
    t=re.sub(r'https?://\S+|www\.\s?\S+|\b[\w.-]+\.(?:com|net|co\.uk|biz|org|tv|in)\S*', 'prize-claim.example', t, flags=re.I)
    t=re.sub(r'\b[\w.+-]+@[\w-]+\.\w+','claims@example.com',t)
    t=re.sub(r'(?:\+?\d[\d\s-]{6,}\d)', lambda m: f"07700 900{random.randint(950,999)}", t)
    t=re.sub(r'\b(mr|mrs|ms|sir)\.?\s+[a-z]+(\s[a-z]+)?', r'\1 [name removed]', t, flags=re.I)
    return re.sub(r'\s+',' ',t).strip()
sms=json.load(open(f"{D}/spam_messages.json"))['messages']
keep=re.compile(r'won|winner|prize|claim|awarded|cash|selected|guaranteed',re.I)
bad=re.compile(r'sex|horny|shag|dogging|naked|babe|xxx|darling|rodger|admirer|date',re.I)
sms_sel=[m['sms'] for m in sms if keep.search(m['sms']) and not bad.search(m['sms'])]
sms_sel=list(dict.fromkeys(sms_sel))[:15]
for t in sms_sel:
    n=person(); add("scammer",random.choice([1,1,2]),"decline",scrub(t),"Prize/claim scam text with premium-rate call/URL lure — phishing (rule 5).",source="ucirvine/sms_spam",name=n,handle=f"@{n.split()[0].lower()}_{random.randint(100,999)}",ph=phone(next(scam_phone)))
tg=json.load(open('/tmp/tg2_spam.json'))
kw=re.compile(r'invest|profit|btc|bitcoin|crypto|forex|trade|earn|income|monzo|payment|binary|usdt|returns',re.I)
tg_sel=[r['text'] for r in tg if kw.search(r['text']) and r['text'].isascii() and 40<len(r['text'])<400 and not re.search(r'@\w|t\.me|informative session',r['text'])]
tg_sel=list(dict.fromkeys(tg_sel))[:12]
for t in tg_sel:
    n=person(); add("scammer",random.choice([1,2]),"decline",scrub(t),"Investment/'earn fast' or money-mule lure typical of Telegram scam spam (rule 5: guaranteed returns / fraud).",source="thehamkercat/telegram-spam-ham",name=n,handle=f"@{n.split()[0].lower()}_profits{random.randint(1,99)}",ph=phone(next(scam_phone)))
SYN=[
 ("Earn 5% DAILY with our AI arbitrage bot, guaranteed returns, withdraw anytime. Join the VIP channel before spots run out!","Guaranteed crypto/AI-bot returns (rule 5)."),
 ("Hi builders! I'm a forex mentor, my students make £3k/week. Message me 'READY' for a free signal.","Forex 'guaranteed' income lure (rule 5)."),
 ("New AI token presale live, 50x expected, whitelist closes tonight — DM for the contract address.","Crypto pump with urgency (rule 5)."),
 ("We are recruiting remote AI annotators, £900/day, no interview. Please send a photo of your passport and your sort code to start onboarding.","Fake recruiter asking for ID/bank details (rule 5)."),
 ("HR team here: you have been shortlisted for an AI engineer role. To process payroll send your driving licence and bank login.","Fake recruiter / credential phishing (rule 5)."),
 ("FREE OpenAI credits for members!! tinyurl.com/free-credits-xyz tinyurl.com/gpu-bonus-xyz","Link spam with URL shorteners (rule 5)."),
 ("Check my agents course bit.ly/agentz-xx and my discount bit.ly/promo-xx and my group bit.ly/grp-xx","Multiple shortened links in application (rule 5)."),
 ("This is the London Agent Builders admin team. Your membership is pending, verify your WhatsApp at lab-admin-verify.example.com within 24h.","Impersonates admins + phishing link (rule 5)."),
 ("Official moderator here — we are migrating the group, re-enter your Discord login at discord-migrate.example.com.","Admin impersonation + credential phishing (rule 5)."),
 ("Your community account has been flagged. Confirm your card details at secure-member-check.example.com to avoid removal.","Phishing for card details (rule 5)."),
 ("Investment opportunity: put £500 in my AI hedge fund and get £5000 back in 7 days. 100% risk free.","Guaranteed-return investment scam (rule 5)."),
 ("Looking for people with Monzo or Revolut accounts to receive payments for my business, you keep 30%.","Money-mule recruitment (rule 5: fraud)."),
 ("I help builders like you make passive income with USDT staking — 200% monthly, add me on WhatsApp.","Crypto guaranteed returns + off-platform lure (rule 5)."),
 ("Hello sir, I am account manager from Binance support, please share your 2FA code so we can secure your wallet.","Impersonation + phishing for 2FA (rule 5)."),
 ("Join our AI startup as co-founder! Small onboarding fee of £250 refunded after first salary.","Advance-fee fake job (rule 5)."),
 ("Get 1000 Discord members instantly for your server, cheap prices, cutt.ly/members-xx","Link shortener + spam service (rule 5)."),
 ("Recruiting for Meta AI, $12,000/month remote. Reply with your full name, DOB, NI number and bank account.","Fake recruiter harvesting ID/bank details (rule 5)."),
 ("Exclusive: our quant AI never loses. Minimum deposit £250. Results guaranteed or your money back. t.ly/quant-xx","Guaranteed returns + shortened link (rule 5)."),
 ("Dear member, the admin asked me to collect £10 annual fee from everyone, send via PayPal friends & family.","Admin impersonation / payment fraud (rule 5)."),
 ("I'm a crypto recovery expert; if you lost funds to scams I can recover them for a small upfront fee.","Recovery scam / advance fee (rule 5)."),
 ("Win an iPhone 18 for joining! Claim at rb.gy/claim-xx now, only 3 left!!!","Prize lure + URL shortener (rule 5)."),
 ("Pre-approved loan for hackathon founders, £20k with no checks — pay the £99 release fee first via gift cards.","Advance-fee loan scam (rule 5)."),
 ("Selling verified LinkedIn and GitHub accounts with history, perfect for job applications. DM.","Fraudulent account trading (rule 5)."),
 ("Your AI agent can earn you £800/day trading memecoins automatically, guaranteed. Free setup call.","Guaranteed crypto income (rule 5)."),
]
for t,r in SYN:
    n=person(); add("scammer",random.choice([1,1,2]),"decline",t,r,name=n,handle=random.choice([f"@{n.split()[0].lower()}_vip",f"@official_{n.split()[0].lower()}",f"@{n.split()[0].lower()}{random.randint(1000,9999)}"]),ph=phone(next(scam_phone)))
sc=[x for x in recs if x['category']=='scammer']
print('scammers',len(sc), 'sms',len(sms_sel),'tg',len(tg_sel))
sc=sc[:50]
recs=[x for x in recs if x['category']!='scammer']+sc
# ---------- BOTS ----------
BOTS=[
 "Hello dear, I am very interested in your group. Hello dear, I am very interested in your group. Please accept.",
 "As a passionate AI enthusiast, I am excited to delve into the transformative landscape of artificial intelligence and leverage synergies within this vibrant community.",
 "I am interested. I am interested. I am interested.",
 "Greetings! As an AI language model, I would be delighted to join your esteemed community and contribute meaningfully.",
 "nice group pls accept nice group pls accept nice group pls accept",
 "In today's fast-paced digital world, AI is revolutionizing industries. I am eager to embark on this journey and unlock my full potential in this dynamic ecosystem.",
 "Application: {{name}} wants to join {{community}}. Interests: {{interests}}.",
 "Hi Hi Hi Hi Hi Hi please add me thanks thanks",
 "Certainly! Here is a compelling application for your community: I am a motivated individual passionate about innovation, collaboration and growth.",
 "Join request #48213 auto-submitted. Join request #48214 auto-submitted.",
]
for i,t in enumerate(BOTS):
    n=person(); add("bot",random.choice([1,2]),"decline",t,"Copy-paste / bot-generated or templated text with no substance (rule 5).",name=n,handle=f"@user{random.randint(10**7,10**8)}",ph=phone(900+i))
# ---------- CROSS-COMMUNITY REPEATS ----------
c1scam=[x for x in recs if x['category']=='scammer' and x['community_applied']==1][:10]
crossd=[]
for s in c1scam:
    h=s['handle']; v=random.choice([h+"1", h.replace('_','.'), h+"_uk", h.replace('_','')+"x"])
    crossd.append((s,v))
# ids
for i,x in enumerate(recs): x['id']=f"L{i+1:03d}"
for s,v in crossd:
    n=person()
    add("scammer",2,"decline",s['application_text'] if random.random()<0.5 else "Hello South London organisers! "+s['application_text'],
        f"Same phone as {s['id']} (declined in community 1, on shared blocklist), handle variant {v}; same rule-5 scam text (community 2 rule 4).",
        source=s['source'],name=n,handle=v,ph=s['phone'],dup=s['id'])
    recs[-1]['id']=f"L{len(recs):03d}"
json.dump(recs,open(f"{D}/applicants_large.json","w"),indent=1,ensure_ascii=False)
cols=list(recs[0].keys())
with open(f"{D}/applicants_large.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader(); [w.writerow({k:("" if v is None else v) for k,v in r.items()}) for r in recs]
with open(f"{D}/expected_decisions_large.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["id","expected_decision","reason"]); [w.writerow([r['id'],r['expected_decision'],r['reason']]) for r in recs]
from collections import Counter
print(len(recs),Counter(r['category'] for r in recs),Counter(r['expected_decision'] for r in recs),Counter(r['source'] for r in recs),sum(1 for r in recs if r['cross_group_dup_of']))
