## Context

The original design conversation named "transparency as trust moat" as a real differentiator: if the judgment prompts are open to read, a developer, their accountant, or even a CRA reviewer can inspect the actual reasoning criteria being applied, rather than trusting a black box. Phase 6 has to make that concrete in the README, not just claim it.

## Goals / Non-Goals

**Goals:**
- Make the transparency claim independently checkable by a skeptical reader, not just asserted.
- Name Sreditor's own current edges plainly (deferred tools, the quantification gap, the Vitest flake, the ineligible-only calibration set) rather than presenting v1 as more finished than it is.

**Non-Goals:**
- No `npm publish` in this change — that's a separate, explicitly-confirmed action.
- No new runtime capability.

## Decisions

- **Link to prompt source files with a short representative excerpt, not full embedded prompt text.** An embedded copy is a second source of truth that can silently drift from the actual running prompt the moment `src/llm/*.ts` is next edited — and a stale "transparency" excerpt that no longer matches the real code would undermine the trust pitch worse than not showing anything. A direct link to the real file is always accurate by construction; a short excerpt (the skeptical-not-generous framing sentence from each prompt) gives an immediate, concrete read without duplicating the whole prompt.
- **Known Limitations section names specific, already-identified items, not vague hedging.** Every item listed (corroborating CLIs, quantification gap, Vitest flake, ineligible-only calibration set) is something already found and documented during Phases 3–5, not new discovery — the point is honesty about existing edges, matching the same self-judgment standard Sreditor applies to its own archived changes.
