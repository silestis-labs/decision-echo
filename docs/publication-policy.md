# Publication policy

Decision Echo uses two independent repositories:

- **decision-echo:** product code, tests, setup instructions, public documentation and approved synthetic examples. Preserve real development history and keep every tracked file suitable for eventual publication. The repo remains private until publication is authorized.
- **decision-echo-internal:** private wiki, research, planning, source materials and agent coordination. Keep this repository private; do not copy its Git history into the product repo.

## Local layout

The product checkout contains an ignored `internal/` checkout with its own `.git` and remote. It is not a submodule. Public clones do not require it. Check the working directory and remote before every Git operation; stage explicit reviewed paths.

## Commit and release checks

Keep credentials out of both repositories. Review exact staged filenames/diffs and binary additions. Public assets need redistribution rights; incorporated reference code needs its required notices. No project license has been selected yet.

The product repo excludes private source directories, internal notes, local agent configuration, generated recordings and credentials. `.gitignore` does not remove tracked files or old history. Before publication review the complete product history, tags, release assets and workflow artifacts. If credentials were ever committed, rotate them; deleting a file alone does not undo exposure.

Publish useful internal learnings as new reviewed, self-contained summaries. Do not export the whole internal folder. The public application must be usable without internal files.

The primary agent coordinates commits and publishing under user authorization. Workers do not independently push, merge or change repository visibility. Hackathon submission uses the product repo's public code/docs link when publication is authorized.
