# TestSprite Hackathon Season 3 — Master Reference

> Single source of truth for this repo's hackathon entry. Pulled verbatim from
> the official page `https://www.testsprite.com/hackathon-s3` and the
> `@testsprite/testsprite-cli` GitHub repo. Last verified: Jul 4, 2026.

## TL;DR

- **Name:** Season 3 — "CLI Launch & Loop Engineering"
- **Tagline:** Build the Loop. Your agent writes the code; the open-source
  TestSprite CLI checks it.
- **Prize pool:** $5,000 total
- **Build window:** Jun 30 (5:00 PM PDT) → Jul 7 (4:59 PM PDT), 2026
- **Winners revealed:** Jul 13, 2026 on X & Discord
- **My local deadline (Africa/Cairo, UTC+3):** Jul 8, 2026, 02:59 AM EEST
- **Today:** Jul 4, 2026 → ~4 days left in the build window.

## The two ways to win

1. **Project Awards — $3,000 across 5 winners.** Best projects built with the
   CLI in a real testing loop. Judged on the loop, not polish or pitch.
2. **CLI Improvement Bonus — $2,000 standing bounty.** Separate from judging.
   Cash for merged PRs improving the CLI. Doesn't affect your Project Award
   score. Open-ended; runs until the pool is exhausted.

## The loop (4 steps, one repeats)

| # | Role   | Step          | What happens                                              |
|---|--------|---------------|-----------------------------------------------------------|
| 01| Maker  | Write         | Coding agent ships code (Claude Code, Codex, etc.)        |
| 02| Checker| Verify        | TestSprite CLI runs real tests against live app, verdicts |
| 03| Maker  | Fix           | Agent reads failure bundle, fixes root cause              |
| 04| Checker| Verify Again  | Rerun. Pass banks. Back to top.                           |

> "A loop with no real checker doesn't fail loudly. It hallucinates progress."

## Prerequisites (the checklist)

| Requirement      | Status     | Notes                                                   |
|------------------|------------|---------------------------------------------------------|
| TestSprite CLI   | Required   | `npm i -g @testsprite/testsprite-cli` · Node ≥ 20      |
| Public URL       | Required   | CLI tests in the cloud — NO localhost. Deploy early.    |
| Public Repo      | Required   | Source in a public GitHub repo. Commits = proof.        |
| LOOP.md          | Required   | Agent-written, one line per iteration. No log = invalid.|
| README           | Required   | App + live URL + what the loop covered.                 |
| Demo Video       | Optional   | Encouraged. Link in Discord. Boosts ranking.            |
| TestSprite acct  | Required   | Paid plan via promo code (from Discord #hackathon-info).|

## Submission (two steps, both required before deadline)

1. **In the GitHub repo:** source + agent-written `LOOP.md` + `README` with
   app and live URL.
2. **In Discord `#hackathon-submissions`:** live URL + public repo link +
   TestSprite account. Demo video optional.

## Judging (human judges)

| Points       | Criterion        | What it measures                                       |
|--------------|------------------|--------------------------------------------------------|
| 40           | Project Quality  | Craft, polish, completeness. Does the live app work?  |
| 40           | Loop Quality     | Did a real loop run & catch/fix real things? From LOOP.md + commits + runs. |
| 20 (+5)      | Innovation       | Creativity of project or loop design. +5 for CI/CD.   |
| ∞ (bonus)    | Engagement       | Discord polls, X shares, long-form write-ups.         |

## Timeline

| Date                 | Event                                            |
|----------------------|--------------------------------------------------|
| Jun 30 · 5:00 PM PDT | Launch & Setup                                   |
| Jun 30 – Jul 7       | Build & Loop                                     |
| **Jul 7 · 4:59 PM PDT** | ⏰ Submissions close                          |
| Jul 8 – Jul 12       | Review                                           |
| Jul 13               | Winners announced (X & Discord)                  |
| No end date          | CLI Improvement Bonus (until $2,000 pool empty)  |

## Join (two steps)

1. Follow `@TestSprite` on X.
2. Join the TestSprite Discord (rules, submissions, Q&A, CLI quickstart pinned
   in `#hackathon-info`).

## Local tool versions in this repo

- Node.js: v24.16.0 (≥ 20 ✓)
- npm: 11.13.0
- bun: 1.3.14
- git: 2.47.3
- TestSprite CLI: v0.2.0 (`@testsprite/testsprite-cli`, Apache 2.0)
- OS: Linux x86_64
