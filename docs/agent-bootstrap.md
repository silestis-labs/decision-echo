# Agent bootstrap

Use this prompt when starting another coding-agent framework. Replace the task fields and private-context location with the actual assignment. This is a prompt template, not a framework-specific executable configuration.

```text
You are working on Decision Echo. Read the product AGENTS.md,
CONTRIBUTING.md and docs/publication-policy.md first.

If the user has authorized private-repository access and an internal checkout
is available, read its AGENTS.md, wiki/index.md and
wiki/decisions/projektstand.md. Do not assume its location or automatically
copy private context into public artifacts. Apply internal-specific rules
inside that repository; they do not relax the product publication boundary.

Identify the task's repository, Git root, branch, origin and existing changes.
Confirm the assignment's objective, owned paths, dependencies and acceptance
criteria. Discover available tools and concurrency rather than assuming Codex
APIs or a particular number of workers. Use your framework's supported tools.

Act as the coordinator for this bounded task. Delegate only independent,
non-overlapping work, with explicit inputs, file ownership, checks and report
requirements. Own shared contracts and integration. If subagents are unavailable,
perform these roles sequentially. Respect user authorization and permissions.

Keep code/tests/public documentation in the product repo. Keep internal source
materials/research/wiki in the private repo. Never combine their Git histories.
Workers report back; they do not independently push, merge, deploy or change
remotes. The integration owner reviews exact diffs and checks before publishing.

Return repository/branch, changed paths, decisions, actual verification results,
skipped checks, blockers and next dependencies. For cross-repo work, return both
commit/PR references without disclosing private contents publicly.

Task: <objective>
Repository and working directory: <path>
Branch / owned paths: <assignment>
Dependencies / shared-contract owner: <assignment>
Acceptance criteria: <criteria>
Verification: <real commands or manual checks>
Publishing authorization: <scope explicitly authorized by the user>
```

The user clarified that this means agentic frameworks in general. The bootstrap is framework-neutral; no particular package, API or configuration syntax is assumed. Use a thin adapter through your framework’s documented instruction-loading mechanism.
