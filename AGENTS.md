# Decision Echo: Agent Instructions

## Product

Build an extensible expert-apprentice product: capture expert work, clarify decision rules, produce a reviewed evidence-backed Work Map, and teach a learner through a new case. ElevenLabs Expert Workflows is the selected challenge. Notion task planning is the first application direction, not the product boundary. Maintain the full product ambition while sequencing integration.

Use English for maintained documentation and reports. Distinguish proposals, implemented behavior and verified runtime results. Do not claim universal replay, universal autosave interception or model training from a recording.

## Developer and framework onboarding

Read [CONTRIBUTING.md](CONTRIBUTING.md) for checkout, branches, two-repository workflow and handoff. [Agent bootstrap](docs/agent-bootstrap.md) provides an explicit framework-neutral prompt. AGENTS.md is canonical guidance, not an installed or running agent. Other frameworks must load it with their supported mechanism; wrappers should reference it rather than duplicate rules. Use available coordinator/worker tools or sequential roles, and discover actual runtime limits.

## Coordination

The primary Codex agent owns requirements, dependencies, shared contracts, integration and user-facing results. Specialist subagents receive bounded assignments and report back. Respect actual runtime concurrency limits; do not assume ten human developers or ten concurrent agents.

- Assign objectives, dependencies, exclusive file ownership, acceptance criteria and checks before dispatch.
- Parallelize independent modules; sequence shared dependencies and contract changes.
- The primary owns shared schemas, manifests, lockfiles and integration points unless explicitly delegated.
- Workers report changed paths, decisions, actual verification, skipped checks and blockers.
- Workers must preserve other agents' changes and must not independently push, merge, deploy or change remotes.
- Review reports and diffs, then run relevant integration checks. Use isolated worktrees when needed and supported.
- Read applicable installed skills before executing them. gstack planning/review/QA/checkpoint skills can help, but installation and tool availability must be verified on each machine. Skill instructions do not override user authorization.

## Publication boundary

Treat every tracked file and commit as eventually public. Follow [publication policy](docs/publication-policy.md).

Do not commit private recordings, photos, challenge PDFs, transcripts, internal wiki/research, credentials, local agent state or unapproved third-party material. `.gitignore` is a convenience, not a confidentiality guarantee: check the exact staged diff, filenames and any binary files before committing. Never force-add excluded material to bypass the boundary.

Publish only reviewed, self-contained documentation, code and approved synthetic examples. Check licenses before incorporating reference code. Do not invent a project license or assume rights to source materials. Keep secrets out of renderers, recordings, prompts, logs and Git.

Off-record must stop all capture/upload modalities and reject stale buffered work. Controlled pre-commit guarantees require controlled application write paths. Validate learned rules against changed expert input and unseen cases.

## Local context

When `internal/AGENTS.md` exists, read it for detailed internal requirements and wiki navigation. `internal/` is an independent private checkout, ignored by this product repo and not a submodule. Internal commits must target its own remote. Its presence is optional; public clones must remain usable without it.

Product code, tests and releasable documentation are committed here with real development history. Internal wiki, research and original materials are versioned only in the private internal repository. Preserve both repositories' independent histories and check the working directory/remote before staging or pushing.
