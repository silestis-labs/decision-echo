# Decision Echo

An AI apprentice that learns expert workflows from screen recordings and voice, then guides others across desktop apps.

Decision Echo is being designed for the ElevenLabs Expert Workflows challenge at HackNation. Its intended flow is to observe an expert, clarify the reasoning behind their decisions, produce an evidence-backed Work Map, and coach another person through a new case.

The proposed product combines a macOS companion, a web workspace, voice interviewing and application adapters. Notion task planning is the first intended workflow; the skill model is designed to extend to other applications.

## Project status

Architecture and implementation planning are in progress. A working application, installation instructions and validated integrations are not yet available. This repository does not claim completed capture, teaching or automation functionality.

## Development

A primary Codex agent coordinates specialist subagents, reviews their reports and integrates their changes. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for developer/agent onboarding. See [AGENTS.md](AGENTS.md) for coordination rules, [agent bootstrap](docs/agent-bootstrap.md) for other frameworks, and [publication policy](docs/publication-policy.md) for what belongs in this repository.

Public examples and future demo data should be synthetic. Internal research, the wiki and approved source materials are versioned separately in a private knowledge repository. Credentials stay out of both repositories.
