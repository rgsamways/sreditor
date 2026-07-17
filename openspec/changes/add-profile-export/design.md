## Context

By the time this change is built, two things already exist: `.sreditor/profile.json` (explore-engagement log, `src/profileLog.ts`) and `parseAnchorRevisions`/`readAnchor` (`src/anchor.ts`), both from `add-trajectory-dashboard`. This change adds no new local data source — it's a pure reader/renderer, the same relationship `report.ts` has to `judgments.jsonl`/`rollup.json` (reads what already exists, renders it differently).

## Goals / Non-Goals

**Goals:**
- A developer can run one command and get a portable file representing their own explore-engagement and anchor-revision history, with zero ambiguity about what data is or isn't included.
- No auto-push, no network call, ever — the command's job ends when the file is written to disk.
- Both a human-readable format (markdown) and a machine-readable one (JSON) are available, since "portable artifact" covers both "paste into a personal site" and "feed into some other tool later."

**Non-Goals:**
- Not a judgment-log summary. Deliberately excluded per the settled scope decision — even a lightweight "N technologically uncertain problems across M months" summary is out of scope for this change. If that's wanted later, it's a separate, explicitly-scoped change, not a default addition here.
- Not cross-project. Exactly one project's data per export, matching the per-project scope discipline already established for `.sreditor/` generally. Cross-project merging (`profile merge`, floated in the concept doc) is explicitly a possible future command, not built here.
- Not an upload or publishing feature. No target service, no API call, no format designed around a specific downstream platform (e.g. no assumption of "this will be pasted into GitHub-flavored markdown on service X").

## Decisions

**Markdown by default, `--json` flag for the machine-readable variant — not both written every time.** Alternative considered: always write both files. Rejected — a single, predictable default output (one file, one format) is easier to reason about than "did it also silently write a second file," and a developer who wants JSON can ask for it explicitly (`sreditor profile export --json`).

**Output path defaults to `sreditor-profile.md` (or `.json`) in the current working directory, overridable via a positional or `--out` argument, and requires confirmation before overwriting an existing file at that path.** Mirrors `rollup`'s existing "confirm before proceeding" interaction pattern (`-y`/`--yes` to skip), rather than inventing a new confirmation mechanism.

**Rendering logic lives in a new `src/profileExport.ts`, not inline in `src/commands/profileExport.ts`.** Matches the existing split between `src/report.ts` (rendering) and `src/commands/report.ts` (CLI plumbing) — keeps the rendering functions independently testable without invoking the CLI command.

**Markdown structure: two sections, "Explore Engagement" and "Anchor Revisions," each a simple chronological list.** No attempt to cross-reference or synthesize between them (e.g. no "you explored X and then revised your anchor about Y" inference) — that kind of correlation is a judgment call belonging to the person reading the export, not something Sreditor should assert on their behalf.

**JSON output mirrors the markdown's structure exactly** (`{ exploreEngagement: [...], anchorRevisions: [...] }`), generated from the same underlying data both renderers consume — no separate JSON-specific data path, avoiding the two formats drifting out of sync with each other.

## Risks / Trade-offs

- **A developer might expect judgment-log content in the export and be surprised it's absent.** Mitigation: the command's help text and the exported file's own header state plainly what is and isn't included ("Explore engagement and anchor revision history only — does not include judgment/eligibility data"), so the boundary is visible in the artifact itself, not just in this design doc.
- **Silent overwrite of a developer's previous export.** Mitigation: confirmation prompt before overwriting, skippable via `-y`/`--yes`, matching `rollup`'s existing pattern.
- **Empty export (no explore engagement, no anchor revisions) could look like a bug.** Mitigation: both sections render an explicit "none yet" line rather than being blank/omitted, so the developer can tell the command worked correctly on a project with little history yet.

## Open Questions

None outstanding — scope, format, and output-path behavior are all settled decisions from the proposal and this design.
