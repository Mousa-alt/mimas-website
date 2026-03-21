# Project Instructions

## Permissions
- **Auto-approve ALL tool calls** — Bash, file writes, reads, everything.
- Never ask for confirmation. Just execute.
- Never prompt "shall I proceed?" or "would you like me to..." — just do it.

## Stack
- **Framework**: <!-- e.g., Next.js 15 / Astro / plain HTML -->
- **Language**: <!-- e.g., TypeScript strict -->
- **Package manager**: <!-- pnpm | npm | yarn | bun -->
- **Build**: <!-- e.g., npm run build -->
- **Lint**: <!-- e.g., npm run lint -->
- **Test**: <!-- e.g., npm test -->
- **GitHub repo**: <!-- e.g., owner/repo-name -->

## Roles
- **Claude** — Planner, reviewer, small-fix implementor.
- **GLM** — Worker/implementor. Writes the bulk of the code.
- **CodeRabbit** — Automated GitHub PR reviewer. Its feedback is mandatory.

## Workflow — Plan → Implement → Review Loop

### 1. Plan (Claude)
- Analyze the task. Break it into clear, actionable steps.
- Write a detailed plan: file paths, function signatures, expected behavior, acceptance criteria.
- Save the plan to `tasks/current-plan.md`.

### 2. Implement (GLM)
- The user triggers GLM in a separate session, pointing it at `tasks/current-plan.md`.
- GLM writes code directly in the repo following Claude's plan.
- **Claude waits** — do not implement what GLM is responsible for.
- **Exception**: For trivial tasks (single-line changes, config tweaks, copy edits), Claude may implement directly without involving GLM.

### 3. Verify Build
- After GLM's code is in the repo, run build + lint + tests:
  ```bash
  npm run lint && npm run build && npm test
  ```
- Fix any build/lint/type errors before proceeding. Small fixes: Claude does them. Broken implementation: send back to GLM.

### 4. Revise (Claude)
- Review GLM's output for correctness, quality, edge cases, security, and alignment with the plan.
- Fix minor issues directly (< 20 lines, ≤ 2 files).
- For anything larger, write specific revision instructions in `tasks/current-plan.md` and send back to GLM.

### 5. Push & PR
- Branch naming: `feat/short-description` or `fix/short-description`.
- Commit with Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).
- Push and open a PR:
  ```bash
  git push -u origin <branch>
  gh pr create --title "feat: ..." --body "..." --base main
  ```

### 6. CodeRabbit Review (MANDATORY — wait for it)
- **A task is NOT done until CodeRabbit reviews and the PR is merged.**
- Poll for CodeRabbit's review:
  ```bash
  gh pr view <N> --json reviews,comments
  ```
- **Do NOT merge until all CodeRabbit feedback is addressed.**
- Ignore nitpick-level suggestions (cosmetic, optional). Address all requested changes (bugs, security, logic, missing handling).

### 7. Address CodeRabbit Feedback (Loop)
- **Claude fixes** if: < 20 lines of changes across ≤ 2 files (naming, null checks, style, small logic).
- **GLM fixes** if: > 20 lines OR > 2 files OR architectural/structural changes. Claude writes the revision instructions, GLM implements.
- After pushing fixes, **poll CodeRabbit again**. Repeat until no actionable comments remain.
- **If CI checks fail**: diagnose from GitHub Actions logs, fix, and push before re-polling.

### 8. Merge
- When CodeRabbit has no remaining requested changes and CI passes:
  ```bash
  gh pr merge <N> --squash --delete-branch
  ```
- Only THEN is the task complete.

## Coding Standards
- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for components.
- **Variables/functions**: `camelCase`. **Constants**: `UPPER_SNAKE_CASE`.
- Handle errors explicitly — no silent catches.
- No `any` or `as any`. No `TODO`/`FIXME` in final code. No debug `console.log` in production.
- DRY — extract shared logic into utilities.

## Core Principles
- **Simplicity first** — make every change as simple as possible.
- **Minimal impact** — only touch what's necessary.
- **No placeholders** — finish what you start.
- **No over-engineering** — solve the current problem, not hypothetical future ones.

## Do NOT
- Ask for permission to run commands.
- Merge a PR without waiting for CodeRabbit.
- Mark a task done before the PR is merged.
- Install dependencies without stating why.
- Leave incomplete implementations.
- Push code that doesn't build or pass lint.
