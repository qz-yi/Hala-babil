---
name: Hilla Connect Workflow Conflict
description: Two workflows compete for port 8080 in the Expo monorepo
---

## Rule
Only the artifact-managed workflow `artifacts/hilla-connect-v2: expo` should be active. The `Hilla Connect` workflow is a duplicate and always fails.

## Why
Both run `pnpm --filter @workspace/hilla-connect-v2 run dev` on port 8080. The artifact workflow starts first; the other tries the same port and is blocked.

## How to apply
When the user reports the app not starting, check that `artifacts/hilla-connect-v2: expo` is running — not `Hilla Connect`. The artifact workflow is the canonical one. Never try to restart `Hilla Connect` as a fix.
