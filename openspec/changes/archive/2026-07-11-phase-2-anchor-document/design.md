## Context

Sreditor's drift-auditing design needs a developer-authored "big picture" anchor document to compare later work against. This change builds the only two commands that touch it: `init` (create) and `reflect` (append a dated revision). It's also the first change to make a real Anthropic API call, so the LLM-calling pattern established here (structured output, pure prompt-building functions, a hardcoded model constant) is what Phase 3's judgment engine reuses.

## Goals / Non-Goals

**Goals:**
- Enforce "developer-authored, AI assists only in framing" as a hard constraint, not a documented policy: the AI never writes to `.sreditor/anchor.md` directly, and every draft passes through an explicit developer confirmation step.
- Enforce append-only as a hard constraint: `init` refuses if an anchor already exists; `reflect` only ever appends, never rewrites prior sections.
- Establish the LLM-calling pattern (model choice, structured output, prompt-as-pure-function) once, cleanly, for Phase 3 to build on.

**Non-Goals:**
- No judgment engine (`judge`/`rollup`/`report`) — that's Phase 3+, and the design docs are explicit that its prompt deserves dedicated design/calibration time, not to be rushed in alongside this.
- No in-place draft editing (`$EDITOR` spawning) — v1 confirm flow is accept-or-abort only; deferred as a nice-to-have.
- No `config` command / configurable model — the model and effort level are hardcoded constants for now.

## Decisions

- **Model: `claude-sonnet-5`, `effort: "medium"`.** Researched against current Anthropic pricing/model guidance rather than assumed. `init`/`reflect` are short conversational-drafting tasks, not deep agentic reasoning; Sonnet 5 is strong enough to phrase CRA-shaped "genuine uncertainty" language correctly at a fraction of Opus cost, which matters directly for a bring-your-own-key tool where cost transparency to the end user is part of the trust story.
- **Structured output (`client.messages.parse()` + `zodOutputFormat()`) over freeform prose.** Matches the project-wide principle (from the original design conversation) that every LLM output in Sreditor is structured and programmatically parseable, never freeform — same shape the Layer 1 judgment output will use.
- **Hard-constraint enforcement over documented policy.** `init` technically refuses to run if `.sreditor/anchor.md` already exists, and the AI is only ever invoked through the confirm-before-write flow with no path to writing the file itself. A policy that only lives in documentation is exactly the kind of thing that erodes under time pressure; a technical refusal doesn't.
- **`node:readline/promises` over a prompt library.** Zero new dependency for a three-question sequential interview; consistent with the "nothing exotic" tooling stance already established in Phase 1.

## Risks / Trade-offs

- A fixed three-question interview is a bet that it reliably elicits CRA-shaped answers across different kinds of projects. If manual verification shows generic, non-CRA-shaped drafts, the question wording (not the architecture) is what needs revisiting — flagged as a possible fast-follow, not blocking this change.
- No in-place editing means a developer who wants to fix one word in an otherwise-good draft has to decline and rerun the whole interview. Accepted for v1; the anchor file is plain markdown, so hand-editing after the fact is always available as an escape hatch.
