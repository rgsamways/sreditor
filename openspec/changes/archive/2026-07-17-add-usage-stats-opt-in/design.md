## Context

`.sreditor/` already holds `anchor.md`, `judgments.jsonl`, and `rollup.json` (see `src/paths.ts`'s `sreditorDir`), all read/written via small, direct `node:fs` helpers (`src/anchor.ts`, `src/persistence/jsonl.ts`, `src/rollup.ts`) — no config-file abstraction exists yet, and none is needed beyond a small new one for this feature. `src/ui/data.ts`'s `getCoverage` already computes archived/judged/unjudged/rolled-up counts; `src/report.ts`'s `partitionProjects` and `checkWordLimits` already compute the filing-ready/excluded split and word-count-vs-limit ratios. This change's aggregation step should call those directly rather than recompute the same numbers a third way.

## Goals / Non-Goals

**Goals:**
- Make the opt-in decision fully informed: `stats show` must print the literal payload before any developer opts in.
- Make the allowlist structurally enforced, not just documented — the zod schema itself should make it impossible to construct a payload containing a string field beyond the version string.
- Make submission fully non-blocking — a network failure, timeout, or DNS error must never affect `judge`/`rollup`'s own exit code, output, or speed in any noticeable way.

**Non-Goals:**
- Not the remote API, its Postgres schema, or hosting — those are separate infrastructure work, provisioned separately.
- Not per-change or per-project data of any kind — only whole-project aggregate counts.
- Not a default-on feature, ever, under any circumstance.

## Decisions

**A dedicated `.sreditor/config.json`, not reusing `anchor.md`'s pattern.** The anchor is a human-authored markdown document; this is machine-managed structured state (a boolean and a UUID). A small JSON file with `{ "statsOptIn": boolean, "installId": string }` is the natural fit, read/written with the same direct `node:fs` style already used for `rollup.json` (`JSON.parse`/`JSON.stringify`, no new dependency). `.sreditor/*` is already git-ignored, so no `.gitignore` change is needed.

**`node:crypto`'s built-in `randomUUID()` for the install id**, generated once, the first time `stats on` runs, and persisted — not regenerated on every run (which would make aggregate counts unable to distinguish "one project submitting many times" from "many projects submitting once," undermining the population-level data researchers/auditors would actually want).

**Zod schema as the actual enforcement mechanism, not a lint rule or code review convention.** Define the payload type as a zod object with only `z.number()`, `z.string().uuid()`, and a fixed-shape version string field — there is structurally no field in the schema capable of holding free text, so a future accidental addition of, say, a project name would fail to typecheck against the schema rather than silently ship. Alternative considered: a manual "don't include X" checklist in a code comment. Rejected — this is exactly the class of mistake a schema can prevent mechanically instead of relying on someone remembering a rule.

**Fire-and-forget submission via a timeout-bounded `fetch`, wrapped so all failures are swallowed.** `judge` and `rollup` call a `submitStatsIfOptedIn(cwd)` function at the very end of their existing work, after their real output is already complete; the function checks the opt-in flag first (near-zero cost when off, the common case) and, only if on, fires the POST with a short timeout (e.g. `AbortSignal.timeout(3000)`) and a `.catch(() => {})` — no retry, no queue, no effect on the calling command either way.

**`stats show` computes the payload through the exact same aggregation function used for real submission**, so what a developer inspects before opting in is guaranteed identical in shape to what would actually be sent — not a separate, potentially-drifting preview implementation.

## Risks / Trade-offs

- **A developer could still misread "aggregate stats" as riskier than it is, or the reverse — trust it more than warranted before reading the schema themselves.** Mitigation: `stats show` prints the literal payload, not a description of it, and the schema/aggregation code lives in this repo in plain TypeScript, same as every judgment prompt.
- **Endpoint not live yet.** Mitigation: submission failures are already required to be silent/non-blocking regardless of cause, so pointing `judge`/`rollup` at `api.sreditor.ca` before it exists is harmless — this is one of the reasons non-blocking failure handling is a hard requirement, not just a nicety, from day one.
- **Aggregate counts could theoretically be fingerprinted across submissions using `installId` to infer something about a specific company over time (e.g., a sudden spike in archived changes).** Mitigation: no field ties `installId` to any identity, no company/project name is ever sent, and the whole payload is coarse enough (whole-project counts, not per-change) that this risk is already about as low as it can be while still being useful aggregate data — worth naming as a known, accepted trade-off rather than pretending the risk is exactly zero.

## Open Questions

- Should `stats off` also delete the locally-stored `installId`, or just flip the flag (keeping the same id if the developer opts back in later)? Leaning toward keeping the id (simpler, and re-opting-in with a fresh id doesn't materially change the privacy posture either way) — worth confirming during implementation, not blocking on it.
