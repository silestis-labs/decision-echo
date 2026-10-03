# Decision Echo

An AI apprentice that learns expert workflows from screen recordings and voice, then guides others across desktop apps.

Decision Echo is being designed for the ElevenLabs Expert Workflows challenge at HackNation. Its intended flow is to observe an expert, clarify the reasoning behind their decisions, produce an evidence-backed Work Map, and coach another person through a new case.

The proposed product centers on a browser workspace, with optional Chrome extension and macOS companion, voice interviewing and application adapters. Notion task planning is the first intended workflow; the skill model is designed to extend to other applications.

## Project status

Architecture and implementation planning are in progress. A working application, installation instructions and validated integrations are not yet available. This repository does not claim completed capture, teaching or automation functionality.

The [requirements and acceptance contract](docs/requirements.md) separates mandatory challenge gates, expected behavior, judging evidence and full-suite extensions. All runtime gates are currently unbuilt.

The [platform architecture and stack recommendation](docs/platform-architecture.md) describes Cloudflare hosting, local capture, ElevenLabs voice and backend model choices.

A [proposed implementation plan](docs/implementation-plan.md) records the next review outputs, shared contracts and dependency-aware build tasks.

The [customer journey](docs/customer-journey.md) specifies browser-first access, expert capture/review and learner practice, including the capabilities of each optional client.

## Development

A primary Codex agent coordinates specialist subagents, reviews their reports and integrates their changes. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for developer/agent onboarding. See [AGENTS.md](AGENTS.md) for coordination rules, [agent bootstrap](docs/agent-bootstrap.md) for other frameworks, and [publication policy](docs/publication-policy.md) for what belongs in this repository.

Public examples and future demo data should be synthetic. Internal research, the wiki and approved source materials are versioned separately in a private knowledge repository. Credentials stay out of both repositories.
