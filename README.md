# NEXUS — AI-Powered Arabic-First IDE

> Built for **TestSprite Hackathon Season 3 — CLI Launch & Loop Engineering**.
> NEXUS is the Maker side of the write → verify → fix → verify loop. The Checker is the open-source TestSprite CLI, which runs real behavioral tests against the live app in the cloud.

## Live app

- **URL:** https://my-project-one-brown-97.vercel.app
- **Status:** deployed and live for the entire build window.

## What NEXUS does

NEXUS is an Arabic-first IDE in the browser with three integrated surfaces:

1. **Code Editor** — syntax-aware editor with line numbers, search/replace (regex, case-sensitive, whole word), copy-range, and an AI formatter.
2. **Live Preview** — real-time HTML/React preview with three device mockups (desktop, tablet, mobile) and a Chrome-DevTools-style CSS element inspector.
3. **AI Agent** — a 3-mode streaming chat agent (CHAT advisor / CODE engineer / UI-ARTIST designer) that routes requests, generates code, and writes it directly into the editor.

### Unique innovations

- **Arabic-to-code translation engine** — write `<حاوية>` and NEXUS compiles it to `<div>`; `استيراد` becomes `import`. The full Arabic HTML/JSX keyword map lives in `src/lib/diagnostics.ts`.
- **AI security analyzer** — `/api/lint` runs deep taint-flow analysis, attack chaining, CVSS scoring, CWE classification, and PoC generation against any pasted code.
- **Premium taste-skills design system** — applied 5 skills from tasteskill.dev (taste-skill, redesign-skill, soft-skill, minimalist-skill, output-skill): grain overlay, tinted colored shadows, custom cubic-bezier motion, magnetic press feedback, staggered entrance animations, focus-visible rings, skip-to-content link, reduced-motion support.

## The loop (the heart of this entry)

This project was built using a real verification loop, not a one-shot build:

1. The coding agent writes/ships code.
2. `testsprite test create --plan-from ./testsprite_tests/plans/*.plan.json` describes a behavior and runs it in a real cloud browser against the live app.
3. If it fails, `testsprite test failure get <test-id>` returns a self-consistent failure bundle.
4. The agent fixes the code, then `testsprite test rerun <test-id>` replays it.
5. Every passed test is banked into a durable suite.

The full iteration log lives in **[`LOOP.md`](./LOOP.md)** — 12 iterations including a genuine bug-fix cycle (accessibility bug in LivePreview device buttons caught and fixed).

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + custom NEXUS design system
- Google Gemini API (`@google/genai`) for the 3 AI routes
- TestSprite CLI v0.2.0 (checker, Apache 2.0)
- 5 taste-skills from tasteskill.dev

## Local development

```bash
# install deps
bun install

# run the dev server (port 3000)
bun run dev

# lint
bun run lint
```

## TestSprite setup (checker side)

```bash
# one-time: configure API key + install the verify skill for the coding agent
npm install -g @testsprite/testsprite-cli
testsprite setup --from-env --yes --agent claude

# run a test from the durable suite
testsprite test run afb59edb-c894-45a8-a85f-f5662c71ce9c \
  --project 67ad548f-0ec1-4d16-8c9f-b6dd6288d42a \
  --wait --output json
```

## CI/CD (worth +5 Innovation points)

`.github/workflows/testsprite.yml` gates every PR/push on the TestSprite NEXUS load test. Required GitHub Secrets (configured):

- `TESTSPRITE_API_KEY` — TestSprite API key.
- `TESTSPRITE_PROJECT_ID` — the project id (`67ad548f-0ec1-4d16-8c9f-b6dd6288d42a`).

Last workflow run: ✅ success — https://github.com/mo01115285816-cyber/testsprite-season3-entry/actions/runs/28698519466

## Test plans

All TestSprite test plans live in `testsprite_tests/plans/`:

| # | Plan | Behavior covered |
|---|------|------------------|
| 01 | homepage-loads | Smoke test — page renders |
| 02 | nexus-loads | NEXUS branding, tabs, editor visible |
| 03 | tab-switching | Editor → Preview → Agent → Editor |
| 04 | preview-device-switching | Desktop/Tablet/Mobile mockups |
| 05 | icon-helper-modal | Icon library modal + controls |
| 06 | editor-typing | Type code + line numbers update |
| 07 | compress-modal | File compression tool |
| 08 | download-dropdown | Export options menu |
| 09 | linter-panel | Diagnostics panel + tabs |
| 10 | chat-agent-greeting | Agent greeting + input + send |

## Hackathon reference

Full rules, timeline, judging rubric, and prerequisites: see **[`HACKATHON.md`](./HACKATHON.md)**.

## License

MIT for the project source. The TestSprite CLI is Apache 2.0 (separate repo).
