# Sreditor — Design Conversation Summary
*Captured July 9, 2026 (mobile/AFK session, follow-up to an unsaved Tuesday laptop session)*

## What Sreditor Is
A CLI tool, built as a portfolio piece for robinsamways.ca/.com, that harnesses an AI agent (Claude, via API) to identify and document SR&ED (Scientific Research & Experimental Development)-eligible work as a developer builds a project — in near real-time, not reconstructed after the fact. It is built on top of OpenSpec (the spec-driven-development CLI Robin already uses with Claude Code for Farpost), harvesting the structured artifacts OpenSpec already produces (`proposal.md`, `design.md`, `tasks.md`) rather than mining generic project-management tools retroactively.

Ties directly into the SR&ED process Robin has already been running manually on Farpost (SRED-001 through SRED-024+ log entries, CCPC incorporation in motion, existing SR&ED consultant relationship).

## Competitive Positioning vs. Sredio (sred.io)
Researched July 9, 2026. Sredio is a funded, Toronto-based startup with two tiers:
- **Software tier:** connects to 24+ existing dev/PM tools (Jira, GitHub, Azure DevOps, Harvest, Microsoft Dynamics), passively mines activity, auto-generates weekly prefilled SR&ED reports for team review/confirmation.
- **Full-service tier:** their own SR&ED experts assemble, write, and file the entire claim, with audit-defense support and real-time financial dashboards.

**Assessment:** Sreditor is a narrow, differentiated competitor, not a value-add to Sredio. Key differences:
- Sredio mines *generic* artifacts (tickets, commits, timesheets) reconstructing SR&ED intent after the fact from noisy signals. Sreditor mines *OpenSpec proposals* — artifacts already written with structured reasoning (uncertainty, design rationale, systematic tasks) at the moment of decision-making. Contemporaneous documentation reads as more credible to CRA reviewers than claims assembled near a filing deadline.
- Sredio is going broad/enterprise (24+ integrations, dedicated staff, full-service filing, external funding, actively hiring). Sreditor's wedge is the specific, growing niche of solo developers/small CCPCs using spec-driven-development workflows who want something free, cheap, and self-serve — a market Sredio isn't structurally built to serve well.
- **Chosen pitch:** free (bring-your-own-API-key, not donations — this was explicitly decided over the donations model to avoid Robin absorbing API costs for other users), self-serve, and focused on keeping "technical uncertainty" front-of-mind *throughout* a project's entire build rather than reconstructing it at year-end.

## Technical Uncertainty / CRA Three-Part Test (baseline logic Sreditor must encode)
1. **Technological uncertainty** — could a competent professional in the field have figured out the solution in advance using standard practice? If not, uncertainty existed.
2. **Systematic investigation** — was there a structured process (hypothesis, experimentation, iteration, analysis) rather than trial-and-error or routine engineering?
3. **Technological advancement** — did the work generate new knowledge, even if the overall project failed?

Prompt design principle locked: the AI must be instructed to be **skeptical, not generous** — assume most software work is routine unless the text clearly shows genuine uncertainty resolved through structured investigation. Must never infer uncertainty from ambition or difficulty alone.

## Tech Stack (agreed, nothing exotic)
- **Runtime:** Node.js (matches OpenSpec's own ecosystem)
- **CLI framework:** Commander.js (same library OpenSpec itself uses)
- **File I/O:** Node's built-in `fs` module
- **LLM integration:** Anthropic's API (`@anthropic-ai/sdk`), bring-your-own-key model
- **Structured output:** prompt Claude to return JSON (`eligible: boolean`, `uncertainty_statement`, `investigation_steps`, `advancement`, `confidence: high/medium/low`, `reasoning`) — never freeform prose, so results can be programmatically sorted/flagged
- **Persistence:** local log file or SQLite for accumulated judgments over time
- **Distribution:** npm package (`npm publish`), same install pattern as OpenSpec (`npm install -g`)

## OpenSpec Extension Model (how Sreditor plugs in)
OpenSpec explicitly supports third-party schema bundles distributed as standalone repos (same pattern as GitHub spec-kit's community extension catalog). Sreditor doesn't fork OpenSpec — it's a standalone companion CLI that reads the same file structure OpenSpec produces (`openspec/changes/archive/*/proposal.md`, `design.md`, `tasks.md`) without needing an official plugin API. A custom OpenSpec schema/rules config could also be layered in later to nudge proposals toward consistently including SR&ED-relevant language (e.g., a "Technical Uncertainty" heading) at the source.

## Architecture: Two-Layer Judgment Model
**Layer 1 — Per-change, in near real-time:**
Every individual archived OpenSpec change is judged against the CRA three-part test as soon as it's archived. This is the behavioral core of the product — it trains developers to recognize SR&ED-shaped thinking as they work, not just at filing time. This is the direct differentiator against Sredio's retroactive-mining model.

**Layer 2 — Periodic rollup, at filing time:**
A second, separate LLM call looks across the set of stored Layer 1 judgments (not raw file content) and groups related ones into CRA-shaped "projects" — the level CRA actually wants claims framed at. A change that looks routine in isolation may get pulled into a project because surrounding changes show it was one step in a longer investigation.

Order matters: Layer 1 must run continuously throughout the project, not just as an input to Layer 2 at the end — the continuous habit-forming feedback loop is described as "the product's real soul," with the rollup as just the CRA-filing packaging step.

## Drift-Auditing
Distinct concern raised by Robin from direct experience: AI agents (and by extension, developers) can design well at the micro level but lose the "big picture" over the course of a long build — one reasonable-seeming step at a time drifting from the original stated goal. This directly weakens SR&ED claims too, since CRA wants a coherent narrative ("we set out to solve X, investigated, learned Y") — quiet scope drift undermines that story even when each individual piece looks fine.

### Big Picture / Anchor Document
- Developer-authored (not AI-inferred) — Robin was explicit that the "big picture" document should be up to the developer to create as best they can, with Sreditor assisting in the *framing*, not generating it wholesale.
- `sreditor init` — an AI-assisted onboarding interview run before any OpenSpec work begins on a new project. Short back-and-forth designed to sharpen a vague idea into an anchor document, using CRA-shaped language from minute one:
  - "What are you trying to build, in one sentence?"
  - "What's the part of this you're genuinely unsure how to solve — not just haven't gotten around to, but don't actually know the answer to yet?"
  - "How would you know if you'd solved it? What would 'it worked' look like?"
- Once saved, the anchor document must be a **fixed, static reference** — the AI must never "helpfully" adjust it on its own. It is not maintained by the AI's memory; it's a static file, which is what protects the drift-detection process from suffering the same big-picture-losing failure mode it's meant to guard against.

### Per-Change Drift Comparison
Every Layer 1 judgment also runs a second, distinct prompt: does this change still serve the original anchor's stated goal, or has it drifted — and if so, how? Output must be a plain-language narrative sentence (e.g., "Original goal was offline-first sync for field inspectors. This change adds a payment webhook — unrelated to the original scope, likely belongs to a separate project"), not just a numeric alignment score, so drift is visible and legible directly in the log, not buried in a metric.

### Append-Only Revision Model (resolves the "when should developers be allowed to revise the big picture" tension)
Key risk identified: if developers can freely rewrite the anchor mid-project, they may retroactively smooth the story once they already know the answer — making the record look curated rather than contemporaneous, which is exactly what would make a claim *less* credible to CRA.
Key counter-risk: real SR&ED work legitimately involves revising your hypothesis as you learn things; forcing a rigid, never-revised anchor punishes honest evolution and mischaracterizes genuine systematic investigation.

**Resolution (locked):**
- The anchor document is **versioned, never overwritten**. Every revision creates a new dated entry alongside the original.
- Revision is **optional, no mandatory pause/revise cadence or ritual** — a forced checkpoint would just become a rubber-stamped, unthinking checkbox. Instead, a lightweight `sreditor reflect` command is available whenever the developer senses their own understanding has genuinely shifted.
- Critically: the revision entry itself becomes SR&ED evidence, not a cleanup mechanism. A dated, un-erasable "Original hypothesis was X. On [date], revised to Y because early implementation revealed Z" is precisely the trace of technological uncertainty being resolved through investigation that strengthens a claim.

## Sreditor Architecture Summary (v1 shape, as of this session)
1. `sreditor init` — AI-assisted interview at project start, drafts the anchor/"big picture" document (goal, uncertainty, success criteria)
2. Anchor document is versioned/append-only — `sreditor reflect` adds dated revisions, never overwrites
3. Per-change judgment (Layer 1) — every archived OpenSpec change judged against CRA's three-part test *and* compared against the current anchor for drift, in near real-time
4. Drift surfaced as plain-language narrative, not just a score
5. Periodic rollup (Layer 2) — groups related judged changes into CRA-shaped "projects" at filing time
6. Bring-your-own-API-key — keeps distribution genuinely free/sustainable for Robin, cost is on the individual developer running it

## Prototype Code Discussed (illustrative, not final)
A minimal Commander.js-based CLI skeleton was walked through step by step during this session, covering:
- Basic CLI entry point structure and the `#!/usr/bin/env node` shebang
- A `scan` command reading `openspec/changes/archive/` directory contents via Node's `fs` module
- Reading individual `proposal.md` file contents (`fs.readFileSync`)
- A generic `extractSection(content, headingName)` helper function that locates a markdown heading and extracts the text block until the next heading — the mechanical basis for later pulling out labeled sections like "Technical Uncertainty," contingent on Robin enforcing consistent heading names via an OpenSpec schema/rules config
No code has been committed or run yet — this was a conceptual/educational walkthrough only, done while Robin was away from his laptop (driving, then a restaurant, then a waiting room).

## Next Steps (not yet started)
1. Get to laptop, decide where the Sreditor codebase lives (likely alongside or referencing the robinsamways.ca portfolio site work and the Salesforce client-credentials-flow portfolio piece built Tuesday — neither of which has been committed/pushed live yet either).
2. Build the actual `sreditor init` interview flow and anchor document format.
3. Design and test the actual CRA-eligibility judgment prompt (Layer 1) — this is described as mattering more than the surrounding code/plumbing.
4. Design the drift-comparison prompt as a second, distinct call alongside Layer 1.
5. Build the rollup/grouping prompt (Layer 2) for filing-time project assembly.
6. Decide on persistence format (flat log file vs. SQLite) for accumulated judgments.
7. Revisit Tuesday's uncommitted robinsamways.ca work (Salesforce contact/account demo, LOS example) to get it live before or alongside Sreditor's own build.
