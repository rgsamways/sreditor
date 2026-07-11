## Context

Sreditor mines OpenSpec's archived change artifacts to judge SR&ED eligibility. Before any judgment logic exists, the project needs a CLI shell, a way to enumerate change artifacts without hardcoding one spec-driven-development tool's layout, and a persistence format simple enough to inspect by hand. This is also the first change archived after adopting OpenSpec for Sreditor's own repo, so it doubles as a backfill of work already completed directly.

## Goals / Non-Goals

**Goals:**
- A stable `SourceAdapter` interface that all future judgment/rollup logic depends on instead of OpenSpec's file layout directly.
- A persistence format (JSON-lines) with zero migration/maintenance overhead for a solo-dev v1.
- Non-LLM commands developers can run immediately to confirm the tool is wired up correctly, before any API key is needed.

**Non-Goals:**
- No LLM-backed judgment yet (`init`/`judge`/`reflect`/`rollup`/`report` are later phases).
- No second source adapter yet — the interface is deliberately unvalidated by a second real implementation until one is needed.
- No SQLite migration path being built now; deferred until/unless `rollup` performance demands it.

## Decisions

- **JSON-lines over SQLite for v1**: zero schema-migration or corruption-recovery burden, trivially inspectable with plain text tools, adequate at solo-dev/small-team scale.
- **Adapter interface returns raw file text, not parsed structure**: keeps the adapter boundary thin; section-parsing (e.g. pulling a "Technical Uncertainty" heading out of a proposal) is judgment logic's job in a later phase, not the adapter's.
- **TypeScript + ESM, bundled with `tsup` rather than raw `tsc`**: avoids Node's `NodeNext` module resolution requiring `.js` extensions on every relative import, at the cost of an esbuild-based build step instead of the TS compiler directly.

## Risks / Trade-offs

- The `SourceAdapter` interface is speculative until a second adapter (e.g. spec-kit) actually exists — risk of the abstraction being wrong in a way that only shows up when that second adapter is attempted. Accepted because the interface is small and cheap to change.
- JSON-lines will need a deliberate migration if `rollup` ever needs to query across a large accumulated history; deferred, not solved, by this change.
