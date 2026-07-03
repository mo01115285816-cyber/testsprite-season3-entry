# LOOP.md — TestSprite Hackathon Season 3

> This file is the canonical proof that the write → verify → fix → verify loop actually ran.
> It is **agent-written**, one plain-English line per iteration.
> Judges read this first. Do NOT hand-write iterations; the coding agent appends them as the loop runs.
>
> Format per line (one iteration = one line):
> `iter-NN | maker: <what the agent shipped> | verify: <what the CLI ran / verdict> | fix: <what broke & how it was fixed> | banked: <test-id(s) saved to the durable suite>`
>
> Template below — the agent will append real iterations once the loop starts running against the live app.

---

## Loop Header

- **Project name:** <to be set once we pick the idea>
- **Live URL:** <to be set once deployed>
- **Public repo:** <to be set once pushed to GitHub>
- **TestSprite project ID:** <proj_xxxxxxxx — to be set after `testsprite project create`>
- **Coding agent:** Claude Code (Z.ai Code agent)
- **Checker:** TestSprite CLI v0.2.0
- **Build window:** Jun 30 – Jul 7, 2026 (PDT)
- **Timezone of logs:** Africa/Cairo (EEST, UTC+3)

---

## Iteration Log

<!-- The coding agent appends one line per loop iteration below this marker.
     Example (replace with real entries as the loop runs):

iter-01 | maker: scaffolded Next.js app + landing page route | verify: testsprite test create (FE, checkout-flow.plan.json) → run → exit 1, step 2 "add to cart" failed (404 on /api/cart) | fix: implemented POST /api/cart route, returned 200 | banked: test_3a9f21c7

iter-02 | maker: added cart item count badge in header | verify: testsprite test rerun test_3a9f21c7 → exit 0 passed | banked: test_3a9f21c7 (re-banked)

iter-03 | maker: implemented checkout form with validation | verify: testsprite test create (FE, checkout-submit.plan.json) → run → exit 1, step 4 "submit with empty email" expected error toast, got silent failure | fix: added zod validation + toast on error | banked: test_7b2e88a1

iter-04 | maker: wired TestSprite checker into GitHub Actions CI/CD (+5 Innovation) | verify: testsprite test run --all --project proj_xxxxxxxx --wait → exit 0 all passed | banked: full suite re-banked via CI
-->

---

## Summary (updated by agent at end of build)

- **Total iterations:** 0
- **Tests banked in durable suite:** 0
- **Real bugs caught & fixed by the loop:** 0
- **CI/CD integration:** not yet wired
- **Final loop verdict:** pending
