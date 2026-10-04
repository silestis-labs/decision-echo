# Contributing to Decision Echo

This guide applies to human developers and their coding agents. The repository contains a React browser workspace, a Cloudflare Worker/Durable Object service, a Chrome extension and a native macOS capture companion. Use the checked-in manifests and the commands below.

## Access and checkout

You need Git, GitHub authentication and access to the product repository. Internal context requires separate access to the private knowledge repository. Python 3 is needed for its existing wiki check.

For an authorized developer, the recommended layout is:

```sh
git clone https://github.com/silestis-labs/decision-echo.git
cd decision-echo
git clone https://github.com/silestis-labs/decision-echo-internal.git internal
git remote -v
git -C internal remote -v
python3 internal/scripts/wiki_lint.py
```

The second clone is optional for public-only contributions. `internal/` is ignored by the product repo and has independent Git history. It is not a submodule. Never copy its `.git` or history into the product repository.

## Start a task

Read [AGENTS.md](AGENTS.md), [README.md](README.md) and [publication policy](docs/publication-policy.md). With private access, also read `internal/AGENTS.md`, `internal/wiki/index.md` and `internal/wiki/decisions/projektstand.md`. Keep originals and private source explanations in the private repository.

Before editing, inspect status and origin in each affected checkout. Use a feature branch in the correct repository and preserve unrelated changes. A task must state:

- objective and acceptance criteria;
- repository and working directory;
- assigned branch and owned paths;
- dependencies and shared-contract owner;
- relevant checks and expected completion report.

One integration owner coordinates each shared branch or workstream. Other humans can run separate coding-agent sessions on independent branches; do not let their agents compete over shared files or push over each other's changes.

## Agent frameworks

`AGENTS.md` is the canonical instruction source. It describes expectations; it does not create agents, install skills, grant permissions or synchronize repositories. Codex discovers repository guidance along the path to its working directory; nested independent repositories are not automatically scanned as extra context. [Official discovery guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

For other frameworks, explicitly load the applicable instruction files through their supported project rules, context or system-instruction mechanism. Keep tool-specific wrappers thin and point them to AGENTS.md rather than duplicating rules. No universal automatic support for all frameworks is assumed. See the [framework-neutral bootstrap prompt](docs/agent-bootstrap.md).

The coordinator delegates bounded, independent tasks; workers return paths, decisions, verification and blockers. Determine the actual environment's concurrency and tools. If subagents are unavailable, perform the same roles sequentially. Only the integration owner performs repository-level publishing under the user's authorization.

For product worktrees, remember that ignored `internal/` is not populated automatically. Supply only the relevant reviewed context or use an explicitly authorized separate private checkout. The product must remain usable without private files. When sharing context with an external service, use the team's approved access and data-handling settings.

## Skills and verification

Discover installed skills on your own machine. Useful gstack roles include plan-eng-review, review, qa/qa-only and context-save/context-restore. [Upstream gstack](https://github.com/garrytan/gstack). Installation is framework-specific and separate from this repository; read current upstream instructions before installing or running a skill. Missing optional skills do not justify silently installing global tooling or claiming their workflows passed.

Run checks relevant to the actual change. Internal knowledge changes require `python3 scripts/wiki_lint.py` from the internal checkout. Product checks are `npm run check`, followed by `npm run test:integration` with both local servers running. `npm run test:lease` verifies the actual 60-second fail-closed capture lease. For native packaging and Swift tests, follow [macOS companion](docs/macos-companion.md). Browser automation substitutes a labeled synthetic stream for the OS share picker; the extension runtime test uses a separate synthetic HTTP backend and an isolated Chromium profile. These checks do not establish provider account access or native screen-capture permission. Report skipped checks and missing dependencies honestly.

## Commit, review and handoff

Stage explicit paths. Inspect staged filenames, diffs and binary additions; do not force-add private context into the product repo. Use meaningful commits and reviewable pull requests. Product code and public documentation go to decision-echo; private knowledge goes to decision-echo-internal.

Changes spanning both repos need two independent commits/PRs. Report the paired commit IDs or links and explain dependency/order; there is no atomic cross-repo commit. Private rationale stays in the internal PR, with a self-contained public-safe summary in the product PR.

Handoff format: objective/status, repository/branch, changed paths, behavior/decisions, actual checks and results, skipped verification, blockers and next dependencies. Do not change repository visibility, merge or deploy without appropriate authorization.
