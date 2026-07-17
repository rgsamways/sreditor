## Context

Three data sources already exist independently and this change's whole job is presenting them together, not inventing new ones:
- **Anchor revisions**: `reflect` (`src/commands/reflect.ts`) already appends dated `## Revision YYYY-MM-DD` sections to `.sreditor/anchor.md` via `appendRevision` (`src/anchor.ts`). `anchor.ts` currently only exposes `countRevisions`/`lastRevisionHeading` (counts/latest, not a full parsed list) — this change needs the full ordered list with each section's body.
- **Judge/rollup history**: already fully readable via `getJudgmentsList`/`getRollupView` (`src/ui/data.ts`), which the existing `sreditor ui` History/Rollup tabs already render (see `add-local-ui` tasks 6.2).
- **Explore engagement**: does not exist yet — `add-explore-command` deliberately keeps `explore` stateless locally (no de-dup fingerprint, no cache, per that change's explicit v1 scope). This change introduces the one new local write required to make "explore engagement over time" a real, showable signal.

`src/ui/data.ts` and `src/commands/ui.ts` (server + endpoints) and the static frontend (`src/ui/html.ts`) are the existing extension points — this change adds to them, following the same pattern `add-local-ui` itself used when it added the History/Rollup tabs after the initial judgments table.

## Goals / Non-Goals

**Goals:**
- One coherent, chronological, per-project trajectory view combining explore engagement, anchor revisions, and judge/rollup history, inside the existing local UI.
- The new local write (`.sreditor/profile.json`) follows the exact same direct-`node:fs`, no-abstraction convention as `.sreditor/config.json` (`src/statsConfig.ts`) — no new dependency, no new persistence pattern.
- Structural separation preserved: `probe`/`judge`/`rollup` never read `.sreditor/profile.json`, matching the same rule already enforced for `explore`'s own isolation.

**Non-Goals:**
- Not cross-project. Each project's `.sreditor/profile.json` and trajectory view are self-contained; no aggregation across repos (that's `profile export`'s eventual territory, and even there it's dev-initiated file merging, not automatic).
- Not a new anchor storage format. Anchor revisions stay exactly as `reflect` already writes them (dated markdown sections); this change only adds a *reader*, not a new writer or schema for `anchor.md`.
- Not a change to `explore`'s printed output, disclaimer, or isolation-from-judgment-pipeline requirements — the one addition (appending to `profile.json`) is a side effect after explore's existing job is already done, same relationship `judge`/`rollup`'s telemetry submission has to their own real work.

## Decisions

**`.sreditor/profile.json`, shape:**
```
{
  "exploreEngagement": [
    { "ranAt": "2026-07-20T14:03:00.000Z", "cardIds": ["...", "..."], "tags": ["llm-agents"] }
  ]
}
```
One entry appended per successful `sreditor explore` run (mirroring how `judgments.jsonl` gets one line per judgment — append-only, read-all-then-render on the dashboard side, no in-place mutation). Read/write helpers (`readProfileLog`/`appendExploreEngagement`) go in a new `src/profileLog.ts`, matching `src/statsConfig.ts`'s style exactly (existsSync guard, mkdirSync if needed, JSON.parse/stringify).

**Anchor revision parsing added to `src/anchor.ts`, not a new module.** Add `parseAnchorRevisions(anchorText): { heading: string; date: string | null; body: string }[]` — splits on `^## ` sections (reusing the same regex shape `countRevisions`/`lastRevisionHeading` already use), extracts a date from the heading if it matches `Revision YYYY-MM-DD` (same date-from-string-not-from-mtime approach already used for the rollup timeline's change-id dates per `add-local-ui` task 5.5), and returns each section's body verbatim. Sections without a parseable date (e.g. the initial anchor heading, which isn't a dated revision) get `date: null` and are shown in the trajectory view without a timeline position, not dropped.

**One new aggregation function, `getTrajectoryView(cwd)`, added to `src/ui/data.ts`** — combines `readProfileLog(cwd)`, `parseAnchorRevisions(readAnchor(cwd) ?? '')`, and the judge/rollup data already returned by `getJudgmentsList`/`getRollupView`, merged and sorted into one chronological list of typed entries (`{ kind: 'explore' | 'anchor-revision' | 'judgment' | 'rollup', at: string, ... }`). This mirrors how `getRollupView` already merges judgment records with rollup project data rather than the frontend doing the join.

**New endpoint `/api/trajectory`, new "Trajectory" tab, following the exact existing tab-and-endpoint pattern** (`add-local-ui`'s Rollup/History tabs each pair one endpoint with one tab). No new server framework, no new frontend build step — plain DOM rendering matching the rest of `src/ui/html.ts`.

**`profile.json` is git-ignored by the same existing `.sreditor/*` pattern** — no `.gitignore` change needed, same as `config.json`.

## Risks / Trade-offs

- **`explore` and `add-trajectory-dashboard` ship as separate changes but touch the same file (`src/commands/explore.ts`).** Mitigation: this change's only edit to that file is one line calling `appendExploreEngagement` after explore's existing print logic — implemented after `add-explore-command` is merged, not concurrently, per the handoff's suggested sequencing.
- **A developer could read "trajectory dashboard" as implying Sreditor tracks them across projects or over the network.** Mitigation: the UI itself already states (per `add-local-ui`) that it's local-only; this change doesn't alter that framing, and `profile.json` never leaves `.sreditor/`.
- **Anchor sections without a parseable date (the initial anchor, or a manually-edited heading) could be mis-sorted if naively parsed as datable.** Mitigation: `parseAnchorRevisions` treats an unparseable date as `null` explicitly and the trajectory view renders those separately (e.g. "anchor established" at the start) rather than guessing a date.

## Open Questions

- Whether `exploreEngagement` entries should record just `tags` shown or full card summaries. Leaning toward tags + ids only (lighter weight, and the dashboard can show "explored: llm-agents, vector-search on 2026-07-20" without duplicating explore-api's own content locally) — can be revisited during implementation without a spec change since it's a payload-shape detail, not a behavior change.
