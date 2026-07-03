# testsprite_tests/

This folder holds TestSprite-related artifacts for the hackathon loop:

- `plans/` — frontend test plan JSON files (`.plan.json`) fed to
  `testsprite test create --plan-from ./plans/<name>.plan.json`.
  Each plan describes a user behavior to guarantee, in plain steps.
- The durable test suite itself lives on TestSprite's cloud (every
  passed test is "banked" there). This folder is the local mirror of
  the plans that produced those banked tests.

## Plan file format (frontend)

A minimal plan describes the target URL and the ordered steps the
TestSprite agent will execute in a real cloud browser:

```json
{
  "name": "checkout-flow",
  "description": "User adds a product and completes checkout",
  "steps": [
    { "action": "navigate", "target": "/" },
    { "action": "click",    "target": "button[data-testid='add-to-cart']" },
    { "action": "click",    "target": "a[href='/checkout']" },
    { "action": "fill",     "target": "input[name='email']", "value": "test@example.com" },
    { "action": "click",    "target": "button[type='submit']" },
    { "action": "expect",   "target": "[data-testid='success-toast']", "value": "visible" }
  ]
}
```

The exact schema is documented in the CLI's `DOCUMENTATION.md`. The
agent will write the real plans here once we pick the idea and the loop
starts running.
