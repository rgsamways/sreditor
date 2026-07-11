# sreditor

A CLI that reads a project's archived [OpenSpec](https://github.com/Fission-AI/OpenSpec) changes and judges them against the CRA's SR&ED three-part test (technological uncertainty, systematic investigation, technological advancement) in near real-time, instead of reconstructing a claim from scratch at filing time.

Unlike tools that mine generic project-management artifacts (tickets, commits) after the fact, sreditor reads structured reasoning that was already written at decision time — OpenSpec's `proposal.md`/`design.md`/`tasks.md` — and is bring-your-own-API-key, so it's free to run.

## Status

Early scaffolding. Currently implemented: `scan`, `status`, `doctor` — no LLM-backed judgment yet.

## Development

```bash
npm install
npm run dev -- scan     # run directly against the current directory via tsx
npm run build            # bundle to dist/ with tsup
npm test                  # run the vitest suite
npm run typecheck
```

## Commands (v1 roadmap)

| Command | Status | Purpose |
|---|---|---|
| `scan` | done | List archived OpenSpec changes |
| `status` | done | Archived/judged/unjudged counts, anchor state |
| `doctor` | done | Pre-flight check (Node version, source detected, API key, writable state dir) |
| `init` | planned | AI-assisted interview that drafts the anchor document |
| `judge` | planned | Judge one or all unjudged changes against the CRA three-part test |
| `reflect` | planned | Append a dated revision to the anchor document |
| `rollup` | planned | Group judgments into CRA-shaped "projects" |
| `report` | planned | Render rollup output, pre-trimmed to CRA Form T661 Part 2's line limits |
| `config` | planned | Set/view API key env var, model choice, project paths |
| `export-log` | planned | Raw dump of the judgment log |