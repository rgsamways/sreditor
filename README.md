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

## Optional corroborating signals

`judge` can optionally shell out to three external tools, if they're installed, for extra context alongside a change's own artifact text. None of them ever determine `eligible` directly — they're background context the model is explicitly instructed to treat as non-authoritative. `sreditor doctor` shows which are detected; none are required, and judgment quality is unchanged if none are installed.

| Tool | What it adds | Install |
|---|---|---|
| [`scc`](https://github.com/boyter/scc) | Size/complexity stats for the files a change touched | download a release binary, or `go install github.com/boyter/scc/v3@latest` |
| [`jscpd`](https://github.com/kucherenko/jscpd) | Copy/paste duplication detection (low duplication + real complexity is a weak proxy for genuine investigation vs. routine work) | `npm install -g jscpd` |
| [`sem`](https://github.com/ataraxy-labs/sem) | Entity-level (function/class) diff of what actually changed, not raw line diffs | `brew install sem-cli`, or download a release binary |

Sreditor correlates an archived change to a real diff by finding the git commit that added its `openspec/changes/archive/<id>/` folder and diffing that commit against its parent — verified against this project's own real archive history. **Known limitation:** this only captures the final archiving commit; if your own workflow spans multiple commits between implementing and archiving a change, earlier commits aren't included. `scc`/`jscpd` also run against the *current* working-tree state of the changed files, not their state at the time of the historical commit.

## Known limitations

Named plainly rather than left implicit, consistent with the same self-judgment standard Sreditor applies to its own archived changes:

- **Quantified-metrics instruction is implemented but unverified.** The judgment and rollup prompts now explicitly instruct the model to carry forward specific numbers (latency figures, error rates, benchmark deltas) from the source text rather than describing them in the abstract — a real-example comparison against a published CRA T661 narrative showed strong eligible narratives lean on this kind of concrete grounding. This hasn't been tested against real eligible/quantified data yet, only added as a prompt instruction — see the calibration-set limitation below.
- **The T661 register has only been checked against a deliberately ineligible calibration set.** During development, generated output was compared against a real published CRA T661 example and CRA's own "what to avoid" guidance — it held up on register (analytical "whether X could Y" framing, no marketing language), but the calibration set used was Sreditor's own build, which correctly judges itself ineligible throughout. That comparison hasn't been re-run against a real, genuinely eligible project.
- **Canada's CRA SR&ED program only.** This is not a general international R&D tax credit tool — the three-part test, drift-auditing framing, and `report`'s T661 line structure are all specific to CRA's actual rules and form. Other jurisdictions' programs are out of scope.
- **OpenSpec is the only implemented source adapter.** The `SourceAdapter` interface (`src/adapters/`) was designed to be tool-agnostic so other spec-driven workflows (e.g. spec-kit) could plug in later, but only the OpenSpec adapter actually exists today — Sreditor only works on projects that already use OpenSpec.
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
