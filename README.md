# sreditor

A CLI that reads a project's archived [OpenSpec](https://github.com/Fission-AI/OpenSpec) changes and judges them against the CRA's SR&ED three-part test (technological uncertainty, systematic investigation, technological advancement) in near real-time, instead of reconstructing a claim from scratch at filing time — then groups eligible work into CRA-shaped "projects" and renders a report structured directly around Form T661 Part 2's line limits.

## Why not Sredio / Boast / Chrono?

Those tools mine generic project-management artifacts — tickets, commits, timesheets — reconstructing SR&ED intent after the fact from noisy signals, usually via a paid web platform with per-seat pricing. Sreditor reads structured reasoning that was already written at decision time (OpenSpec's `proposal.md`/`design.md`/`tasks.md`), runs as a CLI next to the code instead of a dashboard, and is bring-your-own-API-key — free to run, with every judgment prompt published in this repo instead of hidden behind a platform.

## Setup

```bash
npm install -g sreditor
export ANTHROPIC_API_KEY=sk-ant-...   # from the Anthropic console: Settings -> API Keys
cd your-project                        # must already use OpenSpec
sreditor doctor                        # confirms the key, source, and state directory are all ready
```

Sreditor is bring-your-own-key: every judgment/rollup/report call runs against your own Anthropic account, billed to you directly at standard API rates (no markup, no subscription). `doctor` shows exactly what's missing before you run anything that spends money.

## Workflow

```bash
sreditor init     # one-time: AI-assisted interview drafts your project's anchor document
sreditor scan     # list archived OpenSpec changes
sreditor judge    # judge unjudged changes against the CRA three-part test + drift vs. the anchor
sreditor rollup   # group judgments into CRA-shaped projects (shows a cost estimate first)
sreditor report   # render the rollup as markdown, structured around T661 Part 2's line limits
sreditor status   # at-a-glance: archived/judged counts, anchor state
sreditor reflect  # append a dated revision to the anchor once your understanding shifts
```

## Judgment prompts

The core claim of this tool — that it applies the CRA three-part test skeptically, not generously — shouldn't have to be taken on faith. All three prompts are plain TypeScript template literals in this repo, not hidden behind a platform:

**Eligibility judgment** ([`src/llm/judgment.ts`](src/llm/judgment.ts)) — the core CRA three-part test:
> "Be skeptical, not generous. Assume most software work is routine unless the text clearly shows genuine uncertainty resolved through structured investigation. Never infer uncertainty from ambition, difficulty, or effort alone."

**Drift-auditing** ([`src/llm/drift.ts`](src/llm/drift.ts)) — a second, separate call comparing each change against your stated anchor:
> "Do not output a score or a numeric rating — a legible narrative sentence is the whole point."

**Rollup** ([`src/llm/rollup.ts`](src/llm/rollup.ts)) — groups judgments into T661-shaped projects:
> "A change judged ineligible on its own may still belong in a project if the surrounding changes show it was one step in a longer investigation — do not discard ineligible changes."

Read the full files for the complete prompts, the structured output schemas, and exactly what gets sent to the model.

## Known limitations

Named plainly rather than left implicit, consistent with the same self-judgment standard Sreditor applies to its own archived changes:

- **Corroborating signal tools (`sem`, `jscpd`, `scc`) are not implemented.** These were scoped as optional, runtime-detected corroborating context for the judgment prompt (never something that determines eligibility directly), deliberately deferred past v1. See `judgeChange()` in `src/llm/judgment.ts` if picking this up.
- **The judgment/rollup prompts don't yet push for quantified metrics.** A real-example comparison against a published CRA T661 narrative during development showed that strong eligible narratives lean on hard quantified constraints (latency targets, error rates, benchmark deltas); Sreditor's prompts don't currently instruct the model to surface those when they're available in the source material.
- **The T661 register has only been checked against a deliberately ineligible calibration set.** During development, generated output was compared against a real published CRA T661 example and CRA's own "what to avoid" guidance — it held up on register (analytical "whether X could Y" framing, no marketing language), but the calibration set used was Sreditor's own build, which correctly judges itself ineligible throughout. That comparison hasn't been re-run against a real, genuinely eligible project.
- **Vitest's test suite has an intermittent worker-pool flake** on Node v25.8.0 + Windows (mitigated via `fileParallelism: false` in `vitest.config.ts`, not fully eliminated — very occasionally needs a retry).
- `report` currently outputs markdown only; CSV/PDF are deferred.
- `config` and `export-log` (see the roadmap below) aren't built yet.

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
| `init` | done | AI-assisted interview that drafts the anchor document |
| `reflect` | done | Append a dated revision to the anchor document |
| `judge` | done | Judge one or all unjudged changes against the CRA three-part test, plus drift-auditing against the anchor |
| `rollup` | done | Group the judgment log into CRA-shaped "projects", with a pre-call cost estimate |
| `report` | done | Render the saved rollup as markdown structured around CRA Form T661 Part 2's line limits, with real word counts |
| `config` | planned | Set/view API key env var, model choice, project paths |
| `export-log` | planned | Raw dump of the judgment log |

## License

MIT
