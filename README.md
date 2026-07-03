# <Project Name> — TestSprite Hackathon Season 3

> Built for **TestSprite Hackathon Season 3: CLI Launch & Loop Engineering**.
> This repo is the Maker side of the write → verify → fix → verify loop. The
> Checker is the open-source TestSprite CLI, which runs real behavioral tests
> against the live app in the cloud.

## Live app

- **URL:** <to be filled once deployed>
- **Status:** deployed and live for the entire build window.

## What this project does

<One-paragraph description — to be filled once we pick the idea.>

## The loop (the heart of this entry)

This project was built using a real verification loop, not a one-shot build:

1. The coding agent writes code.
2. `testsprite test create --plan-from ./testsprite_tests/plans/*.plan.json` →
   describes a behavior to guarantee and runs it in a real cloud browser.
3. If it fails, `testsprite test failure get <test-id>` returns one
   self-consistent failure bundle (failing step + screenshots + DOM + root
   cause + recommended fix).
4. The agent fixes the code, then `testsprite test rerun <test-id>` replays it.
5. Every passed test is banked into a durable suite that compounds as the
   project grows.

The full iteration log lives in **[`LOOP.md`](./LOOP.md)** — agent-written,
one line per iteration, backed by the commit history + platform run history.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (New York)
- Prisma ORM (SQLite)
- TestSprite CLI v0.2.0 (checker, Apache 2.0)

## Local development

```bash
# install deps
bun install

# run the dev server (port 3000)
bun run dev

# push the prisma schema
bun run db:push

# lint
bun run lint
```

## TestSprite setup (checker side)

```bash
# one-time: configure API key + install the verify skill for the coding agent
npm install -g @testsprite/testsprite-cli
testsprite setup --from-env --yes --agent claude

# create the project on TestSprite (returns proj_xxx)
testsprite project create \
  --type frontend \
  --name "<Project Name>" \
  --url "<live-url>"

# describe a behavior and run it
testsprite test create \
  --project proj_xxxxxxxx \
  --type frontend \
  --plan-from ./testsprite_tests/plans/main-flow.plan.json \
  --run --wait --output json

# if it failed, pull the failure bundle, fix, then replay
testsprite test failure get test_xxxxxxxxxxxx --out ./.testsprite/failure
testsprite test rerun test_xxxxxxxxxxxx --wait --output json
```

## CI/CD (worth +5 Innovation points)

`.github/workflows/testsprite.yml` gates every PR/push on the full TestSprite
suite. Required GitHub Secrets:

- `TESTSPRITE_API_KEY` — your TestSprite API key.
- `TESTSPRITE_PROJECT_ID` — the `proj_xxx` from `testsprite project create`.

## Hackathon reference

Full rules, timeline, judging rubric, and prerequisites:
see **[`HACKATHON.md`](./HACKATHON.md)**.

## License

MIT for the project source. The TestSprite CLI is Apache 2.0 (separate repo).
