# Setup Status — TestSprite Hackathon Season 3

> Snapshot of the environment as prepared on **Jul 4, 2026**.
> Everything I could install locally is done. The remaining items need
> YOUR accounts / credentials — listed in the "What I need from you" section.

## ✅ What I already did (environment is ready)

### 0. API key connected & verified ✅
- Key verified against `https://api.testsprite.com` (production env).
- Account: **MOHAMED SAYED** (mo01115285816@gmail.com).
- Scopes granted: `read:projects, read:tests, read:me, write:tests, run:tests, write:projects`.
- Current plan: **Free** (150 credits ≈ 75 frontend runs). Upgrade with promo code for hackathon.
- Stored in protected `.env.local` (chmod 600, never committed).
- Ran `testsprite setup --from-env --yes --agent claude` → installed:
  - `.claude/skills/testsprite-verify/SKILL.md`
  - `.claude/skills/testsprite-onboard/SKILL.md`
- The agent (me) now knows exactly how to drive the loop: draft plan.json
  (frontend) or Python+requests (backend), `test create --run --wait`, pull
  failure bundle, fix, `test rerun`.

### 1. Verified the local toolchain
| Tool      | Version   | Required?         | Status |
|-----------|-----------|-------------------|--------|
| Node.js   | v24.16.0  | ≥ 20 (CLI needs 20.19+ / 22.13+ / 24+) | ✅ |
| npm       | 11.13.0   | for global install | ✅ |
| bun       | 1.3.14    | dev server        | ✅ |
| git       | 2.47.3    | for commit history (proof the loop ran) | ✅ |

### 2. Installed TestSprite CLI globally
```bash
npm install -g @testsprite/testsprite-cli
```
- Installed at: `/home/z/.npm-global/bin/testsprite`
- Version: **0.2.0**
- License: Apache 2.0 (open source)
- Verified working in `--dry-run` mode (no API key needed for that).

### 3. Mapped the full CLI command surface
Available commands (verified via `--help`):
- `testsprite setup` — configure API key + install agent skill (one command)
- `testsprite auth status` — verify credentials
- `testsprite project create / list / get / update`
- `testsprite test create / list / run / rerun / failure get / steps / result`
- `testsprite agent install / list` — installs the verify-loop skill into your coding agent
- `testsprite usage` — credit balance & plan info

Supported agent targets for the verification skill:
`claude`, `cursor`, `cline`, `antigravity`, `codex`.

### 4. Created the hackathon file structure
```
/home/z/my-project/
├── LOOP.md                          ← the canonical loop log (agent-written, judges read first)
├── HACKATHON.md                     ← full rules/timeline/rubric reference
├── SETUP_STATUS.md                  ← this file
├── .env.example                     ← template of env vars to fill
├── .github/
│   └── workflows/
│       └── testsprite.yml           ← CI/CD workflow (+5 Innovation bonus)
├── testsprite_tests/
│   ├── README.md                    ← explains the plan-file format
│   └── plans/                       ← FE test plan .plan.json files go here
└── .gitignore                       ← updated to protect TestSprite secrets
```

### 5. Pre-wrote the CI/CD workflow
`.github/workflows/testsprite.yml` gates every PR/push on TestSprite — exactly
the "+5 Innovation" path described on the official hackathon page. It just
needs two GitHub Secrets set (`TESTSPRITE_API_KEY`, `TESTSPRITE_PROJECT_ID`)
once you have them.

---

## 🔑 What I need from YOU (the human-only items)

These are things only you can provide because they require accounts in your
name. Once you give me any of them, I'll wire the rest in automatically.

### A. TestSprite account + API key  (BLOCKING — needed before the loop can run)
1. Go to **https://www.testsprite.com** → click **Get Started Free**.
2. Create an account (free tier gives 150 credits/month, but the hackathon
   needs a **paid plan** — see step 3).
3. **Get the promo code** for a free paid plan:
   - Join the TestSprite Discord → look in `#hackathon-info` channel.
   - The promo code upgrades your account to paid for the hackathon.
4. Once on a paid plan, go to **Settings → API Keys** and create a key.
   - It looks like: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. **Give me the API key** (I'll store it in `.env.local`, never committed).

### B. Discord account  (BLOCKING — required to submit)
1. Join the TestSprite Discord server (link on https://www.testsprite.com/hackathon-s3).
2. Tell me your Discord username. Submissions go in
   `#hackathon-submissions` (live URL + repo link + TestSprite account).

### C. X (Twitter) account  (recommended — engagement points + winner reveal)
1. Follow **https://x.com/TestSprite**.
2. Tell me your X handle. Engagement points come from sharing test results.

### D. GitHub account + public repo  (BLOCKING — required for submission)
Two options:
- **Option 1 (easiest):** Give me a GitHub Personal Access Token (classic,
  with `repo` scope). I'll create the public repo + push the code for you.
- **Option 2 (manual):** You create an empty public repo named whatever you
  want (e.g. `testsprite-s3-entry`) and give me the repo URL. I'll prepare
  the push; you run the final `git push` with your own credentials.

The repo must be **public** and the commit history must show the loop ran.

### E. Deployment platform  (BLOCKING — required for live URL)
The CLI tests in the cloud, so the app must be reachable from the public
internet (no `localhost`). Pick ONE and give me the account/token:
- **Vercel** (recommended for Next.js — free tier is enough). Give me a
  Vercel token, or deploy manually and give me the URL.
- **Netlify**, **Railway**, **Render**, **Cloudflare Pages** — any public
  host works. Just give me the final `https://...` URL.

The live URL has to stay up for the entire build window.

### F. Promo code from Discord  (needed with A)
The hackathon explicitly says the paid plan is unlocked "via promo code"
distributed in Discord `#hackathon-info`. Grab it and paste it to me.

---

## 🚦 What happens AFTER you give me the items above

In order, I'll:
1. `cp .env.example .env.local` and fill in your `TESTSPRITE_API_KEY`.
2. Run `testsprite setup --from-env --yes --agent claude` — this:
   - verifies your key with the server,
   - installs the `testsprite-verify` + `testsprite-onboard` skills into
     `.claude/skills/` so the coding agent (me) knows how to drive the loop.
3. Pick the project idea together (next conversation step).
4. Scaffold / build the app.
5. Deploy it to get a public URL.
6. `testsprite project create --type frontend --name <name> --url <live-url>`
   → save the returned `proj_xxx` into `.env.local`.
7. Start the loop: write code → `testsprite test create --plan-from ...` →
   `test run --wait` → `test failure get` → fix → `test rerun` → bank.
8. The agent (me) appends one line per iteration to `LOOP.md` automatically.
9. Set the two GitHub Secrets and let `.github/workflows/testsprite.yml`
   gate every push (+5 Innovation).
10. Final submission: post live URL + repo + TestSprite account in Discord
    `#hackathon-submissions` before **Jul 7, 4:59 PM PDT**.

---

## ⏰ Time check

- Now: **Sat, Jul 4, 2026 — ~02:40 AM EEST (Africa/Cairo)**
- Deadline: **Jul 7, 4:59 PM PDT = Jul 8, 02:59 AM EEST**
- Remaining: **~4 days**
- Status: environment ready, waiting on your accounts/keys to start the loop.
