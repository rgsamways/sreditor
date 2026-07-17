## Context

Today, `checkWordLimits`, the CRA line labels, and the filing-ready/excluded split live only inside `src/report.ts`, called from `src/commands/report.ts` to produce a markdown file. `readRollupOutput`/`rollupFile` (`src/rollup.ts`) and `judgmentsFile`/`readJsonl` (`src/paths.ts`, `src/persistence/jsonl.ts`) already know how to load `.sreditor/rollup.json` and `.sreditor/judgments.jsonl` from disk. There is currently no HTTP server anywhere in this codebase, and no web-framework dependency (`package.json` has four runtime dependencies: `@anthropic-ai/sdk`, `commander`, `cross-spawn`, `zod`).

## Goals / Non-Goals

**Goals:**
- Give a developer an interactive, browsable view of data that already exists locally, with zero new remote data path.
- Reuse `report.ts`'s existing word-limit and filing/excluded logic rather than re-deriving it for the browser.
- Keep the dependency footprint minimal, consistent with this project's existing stance.

**Non-Goals:**
- Not a hosted product. No deployment target, no auth, no multi-user concerns — this is a single local developer looking at their own local files.
- Not an editor. This version is read-only: no re-running `judge`/`rollup`, no editing judgment text from the browser.
- Not a new data format. The server reads exactly the files `judge`/`rollup`/`report` already produce; it does not introduce a new on-disk schema.

## Decisions

**Node's built-in `http` module, not Express/Fastify/etc.** The server's entire job is: serve a handful of static files (HTML/CSS/JS) and a few read-only JSON endpoints backed by functions that already exist. Alternative considered: add Express for routing convenience. Rejected — this project has stayed deliberately dependency-light (four runtime dependencies so far, `cross-spawn` was added only because raw `child_process` genuinely couldn't handle Windows `.cmd` shims safely; there's no equivalent hard requirement here), and a handful of routes is easy to hand-route with `http.createServer` plus a `URL` parse, without pulling in a framework for its own sake.

**Bind to `127.0.0.1` explicitly, never `0.0.0.0`.** Non-negotiable given the whole point of building this as "local serve" instead of "hosted upload" is to guarantee nothing becomes network-reachable. Pick an ephemeral free port (`listen(0)`) by default so it never collides with something else the developer is running, and print the actual URL (e.g. `http://127.0.0.1:53211`) rather than assuming a fixed port.

**Extract `report.ts`'s reusable logic before adding a consumer, not duplicate it.** `checkWordLimits`, `WORD_LIMITS`, and the filing-ready/excluded partitioning currently done inline in `renderReportMarkdown` should be callable independently of markdown rendering, so `ui` can request "give me the filing-ready projects and excluded projects, already split, with word-limit checks" as data, and render it as HTML/JSON instead of markdown, without a second implementation of that split logic. Concretely: the partition-and-check step gets pulled out of `renderReportMarkdown` into its own exported function that both `report.ts` and the new `ui` server call.

**Static frontend as plain HTML/CSS/JS, no bundler.** Alternative considered: a small React/Vite app. Rejected for v1 — the UI surface (a filterable table, a detail pane, a rollup view) doesn't need component-framework complexity, and adding a frontend build step (Vite, a `dist/ui` output, bundling config) is real added complexity for a first version whose entire job is rendering already-shaped JSON. Worth revisiting only if the UI's complexity later outgrows plain DOM manipulation.

**Auto-open the browser, but print the URL regardless.** Use a simple cross-platform open (e.g. shelling out to the OS's own `start`/`open`/`xdg-open`, already a pattern this codebase knows how to do safely via `cross-spawn` for cross-platform shell differences) as a convenience, but always print the URL too in case auto-open fails or isn't wanted (e.g. over SSH).

## Risks / Trade-offs

- **A developer could mistake "local-only" for "safe to leave running forever."** Mitigation: the server should exit cleanly on Ctrl+C same as any CLI dev server, and the printed startup message should say plainly that it's local-only and should be stopped when done, rather than implying it's meant to run persistently.
- **Port/browser-open behavior varies by OS.** Mitigation: fail gracefully if auto-open doesn't work (print the URL, don't crash the server) — this is table stakes for any local dev server, not a novel risk.
- **Stale data if `judge`/`rollup` runs again while `ui` is open.** Mitigation: read files fresh on each request rather than caching in memory at startup — this is a read-only viewer, so simplicity here matters more than performance for a use case that's a handful of requests from one browser tab.

## Open Questions

- Should the detail view for a single change also show its corroborating signals (`scc`/`jscpd`/`sem`) if the underlying tools were used at judge time? Leaning toward yes for v2 if there's appetite, but v1 can ship without it since that data isn't currently persisted per-judgment (see `src/tools/corroboration.ts` — signals are gathered fresh each `judge` run, not saved to `judgments.jsonl`) — out of scope for this change specifically.
