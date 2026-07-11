# Sreditor Deep-Dive & Farpost-Wide "Subsidy Radar" Generalization
*Captured July 9, 2026 (mobile/AFK follow-up session, continuing from the initial Sreditor design conversation and build plan saved earlier the same evening)*

This document captures a phase-by-phase working session on the Sreditor build plan, followed by a significant generalization: the same underlying pattern Sreditor uses for SR&ED could apply to every Farpost professional role, and separately to homeowners/business owners via Farpost's public front door.

---

## Phase 1 Discussion — Foundations, Revisited

### The stubbed commands, individually
- **`init`** — AI-assisted interview, drafts the anchor/"big picture" document. Runs once per project, at the start.
- **`scan`** — lists archived OpenSpec changes; a diagnostic/debug command to see what Sreditor *would* process before actually judging anything.
- **`judge`** — Layer 1: judges one or all unjudged archived changes against the CRA three-part test, appends to the log.
- **`reflect`** — appends a new dated revision to the anchor document (append-only, never overwrites).
- **`rollup`** — Layer 2: groups accumulated judgments into CRA-shaped "projects."
- **`report`** — renders rollup output as markdown/PDF/CSV.

### Additional commands proposed this session
- **`status`** — at-a-glance health check: count of changes, judged vs. unjudged, anchor last-revised date, running token/cost spend. Expected to be the most frequently run command.
- **`config`** — set/view API key env var name, model choice, project paths, without hand-editing JSON.
- **`doctor`** — pre-flight check (API key present, OpenSpec folder found, anchor exists) before running anything real.
- **`export-log`** — raw, undecorated dump of everything, for handing directly to a human consultant rather than trusting the AI's own rollup.

### Tool-agnosticism (should Sreditor work beyond OpenSpec?)
Decision direction: yes, and cheaply. Instead of hardcoding OpenSpec's folder layout inside `scan`/`judge`, build a small **source adapter** module — its only job is "give me a list of change-artifacts and their text content" in a standard shape Sreditor defines internally. One adapter is written for OpenSpec now; new adapters (for spec-kit or future tools) can be added later without touching judgment logic. Low cost to build this way from day one; protects against OpenSpec's format changing or a competing spec-driven tool gaining more traction.

### SQLite vs. JSON-lines
Confirmed: SQLite is not free — it adds schema migrations, corruption-recovery considerations, and a higher bar for manual inspection, in exchange for real querying and better performance at scale. **Decision: JSON-lines (`judgments.jsonl`) for v1.** Zero maintenance, fine at solo-dev/small-team scale, can migrate to SQLite later via a one-time script if `rollup` ever gets slow.

### Cross-project bridging (for eventual Farpost umbrella use)
Real problem, worth solving now: if Sreditor only operates on one project's `openspec/` folder, judgments across Farpost, Sreditor itself, and Field Docs become disconnected "island logs." Two options considered:
1. **Per-project logs + explicit `sreditor merge --projects x,y,z` command** — each project's log stays naturally scoped to its own repo (better provenance for audit purposes); merging is a deliberate, visible action taken only at filing time.
2. **A central log location** (e.g. `~/.sreditor/logs/`) with project-name tagging per entry — simpler at filing time but couples log storage to one machine/location rather than living with the code it describes.

**Leaning:** Option 1 (per-repo logs, explicit merge step) as the more honest architecture for a solo founder running multiple related projects under one CCPC.

---

## Phase 5 Discussion — Reports & the Real CRA Standard Format

Confirmed there is a genuine, well-defined industry-standard format worth building `report` directly against: **CRA Form T661, Part 2.**

- Part 2 contains three mandatory narrative fields, each with a strict CRA word limit:
  - **Line 242 (max 350 words):** the technological uncertainty that made the work necessary
  - **Line 244 (max 700 words):** the work performed — hypotheses, experiments, tests, results, conclusions, in chronological order
  - **Line 246 (max 350 words):** the technological advancement achieved
- These map near-exactly onto Sreditor's existing judgment fields (`uncertainty_statement`, `investigation_steps`, `advancement`) — `report` should render each pre-trimmed to CRA's word count, in CRA's expected order, ready to paste directly into the form.
- Stakes are real: of claims that get audited, roughly 60% are denied or substantially reduced, and the gap between approved and denied claims is almost always in the narratives/documentation quality, not the underlying eligibility of the work itself.
- CRA explicitly wants narratives in **technical language and style**, not marketing language. Example contrast surfaced during research: "we built a real-time processing pipeline that handles 50,000 events per second" is a product description (weak); describing an investigation into whether known architectures could maintain latency under loads exceeding published benchmarks is the technical narrative CRA rewards (strong). This distinction should be explicitly built into the Layer 1 judgment/rewriting prompt.
- **A second competitor was surfaced during this research: "Chrono Platform"** — connects to dev tools (commits, PRs, tickets) and produces CRA-ready T661 documentation automatically, positioned very similarly to Sredio. Not yet deep-dived; flagged as a follow-up (a "Chrono analysis" companion to the existing Sredio analysis) for a future session.

---

## Phase 6 Discussion — npm Donations & Revenue Model

### Can Sreditor ask for donations on npm?
Yes, confirmed via npm's own official open-source terms — this is explicitly permitted, not a gray area.
- Add a `funding` field to `package.json` (e.g. `{ "type": "opencollective", "url": "..." }`); users can then run `npm fund` to see it, and npm proactively surfaces "N packages are looking for funding" during installs.
- npm's policy explicitly allows information on how to pay/donate/support development, and logos/links to sponsoring orgs.
- What's *not* allowed: packages that display ads at runtime/install, or packages that function primarily as an ad with negligible real code. A `funding` field plus a README mention is well within bounds.
- Practical note: since bring-your-own-key is already the sustainability model, a donation link is a bonus for goodwill/maintenance support, not something the cost model depends on.

### Open-core revenue brainstorm (paid features layered on the free core)
Guiding principle established: **the judgment itself stays free forever, no asterisks** — that is the moat and the trust story. Paid features should sell *convenience*, never *accuracy or thoroughness*, or the "free and honest" positioning against Sredio collapses.

**Low-risk, fits the ethos:**
- Hosted cost/usage dashboard across multiple projects (prettier version of local `status`)
- Managed API proxy tier — for users who don't want to manage their own Anthropic key, Robin runs the calls at a markup over raw token cost (same model as Anthropic's own cost+margin structure, one layer up)
- Priced budget alerts / Slack-Teams notifications on top of cost tracking

**Medium-risk, needs care:**
- "Consultant handoff" export package — polished, CRA-formatted bundle with supporting evidence, priced per-filing. Risk: starts looking like "cheaper Sredio" if not careful to keep the free core as the real differentiator.
- Prompt/calibration tuning as a paid service for companies with unusual work — edges toward the consulting-relationship territory Sredio's full-service tier occupies.

**Caution flagged:** never let the free tier's judgment quality feel deliberately limited to upsell a paid tier — that specific move would be the one thing that could genuinely damage trust in a tax-adjacent tool.

### Cost/token tracking as an automated feature
Since Sreditor already makes every API call, it can capture real token usage (input/output) directly from each Claude API response with near-zero extra engineering, appending it alongside each judgment entry.
- Enables `status` to show running totals: tokens used this period, rough dollar estimate at current pricing, average tokens per judgment.
- Enables per-project cost visibility once cross-project bridging (Phase 1) exists — see which project is actually costing the most in API spend, not just which has the most SR&ED activity.
- A pre-`rollup` cost estimate/confirmation step was proposed, since rollup processes the whole accumulated judgment set in one larger call.
- Framed as part of the trust story, same spirit as publishing the judgment prompt openly — real, running cost transparency reinforces the "free and honest" positioning; a tool that quietly racks up charges would undercut it.
- Optional idea: a soft budget cap in `config` ("warn me if this month's estimated spend exceeds $X").

### Consultant-facing tier (a second, distinct product/buyer)
Key insight: developers are price-sensitive and use this rarely (once a year); SR&ED consultants use tools like this constantly across many clients, and their billable time is the actual product they sell — a much easier pitch to charge for.

Concepts discussed:
- **Multi-client dashboard** — one place to see every client's judged/rolled-up projects, flagged by confidence level, ready for review.
- **"Explain your reasoning" mode** — full reasoning chains visible, not just final CRA-formatted output, so a consultant can interrogate/adjust before it reaches a client.
- **White-label export** — deliverables branded as the consultant's own firm, a normal B2B SaaS paid feature.
- **Bulk/API access** for firms wanting to pull judgments programmatically into their own internal tools.

Honest framing noted: this doesn't compete with the developer-facing free core — it's a second product riding the same judgment engine, sold to a different buyer with different willingness to pay. Also honestly noted: Sredio's real money is arguably in exactly this kind of full-service tier sold to claim-filers, not their software tier sold to developers — so growing a consultant tier means, at some point, deciding whether Sreditor stays a portfolio/passion project or quietly becomes a second real Farpost product line, deserving a different level of seriousness and time investment.

### Personal motivation context
Robin was interviewed by an SR&ED consulting firm and was passed over for a role. This is explicitly named as a motivating factor ("in a nice way") behind building Sreditor as a proof of capability beyond what that interview process saw.

---

## Farpost-Wide Generalization: The "Sred-Like" Pattern Applied to Every Role

Core pattern identified (Robin's framing, refined in conversation): **quietly document a professional's real work well enough to surface money or recognition they're already owed but not tracking.** This is a generalization of Sreditor's specific SR&ED mechanism, and it maps onto Farpost's existing dynamic professional roles registry (F00–F17) — each role likely has different regulatory/financial programs sitting mostly unclaimed because nobody has time to track them contemporaneously.

Concrete angles discussed per role:

- **Contractors/builders (Jeff Patterson's role):** apprenticeship grants and skilled-trades incentive programs (federal/Ontario) often require documented hours/task logs — same forgotten-then-badly-reconstructed failure mode as SR&ED. Green retrofit/energy-efficiency rebate programs frequently require photo/documentation trails at time-of-work — directly overlaps with what the field documentation service already produces.
- **Realtors (Ray Krupa's anchor role):** continuing education (CE) credit tracking for licensing renewal. Regional market-report generation from listings — a "harvest data you're already producing" pattern, same shape as Sreditor mining OpenSpec.
- **Insurance brokers (Stephen Moller's role):** loss-prevention/risk-mitigation credit programs some insurers offer for documented property inspections — evidence already exists in field documentation, just not packaged for the specific program.
- **Building inspectors/thermal imaging/energy auditors:** provincial or utility-sponsored audit subsidy programs often require standardized reporting formats — same "translate what's already captured into the format a program wants" problem.

**Governing insight:** every one of these follows Sreditor's exact shape — work is already happening and already being documented somewhere (field capture, specs, inspections); a government or industry program exists that rewards that specific kind of documentation; nobody bridges the two because it's tedious and role-specific. This is framed as one governing capability ("Farpost surfaces the subsidy/credit trail hiding in work already done"), applied across roles — consistent with the existing Farpost principle "Farpost documents, it does not evaluate." Sreditor becomes a working prototype/proof-of-concept for a pattern that could eventually live inside the platform itself, one role at a time.

Robin's reaction: identified this as "my 'hooks' for professional usage that go above and beyond charging a monthly subscription or take rate on feature sets" — i.e., a potential new category of Farpost value proposition distinct from the existing Take-Rate Standard model.

---

## Homeowner / Business Owner Angle: "Rebate Radar" at Farpost's Front Door

Extending the same pattern to end users rather than professionals, prompted by Robin asking whether Farpost could help subsidize homeowners/business owners directly.

### Real, currently-live programs surfaced (as of July 2026 research) demonstrating the landscape's volatility and richness:
- **Ontario Home Renovation Savings Program (HRSP):** up to $7,500 (cold-climate heat pump) or $12,000 (geothermal), $100/opening for windows/doors, up to $7,700 for insulation; running through November 30, 2026; two paths (assessment-required bundle path vs. no-assessment single-upgrade path).
- **Oil to Heat Pump Affordability Program:** up to $15,000 federally for oil-heated homes switching to heat pumps; application deadline July 31, 2026 in several provinces.
- **Toronto/municipal Heritage Grant Programs:** matching funds for designated heritage properties' conservation work (masonry, windows, slate roofs); strict annual deadlines (2026 cycle was due March 13, 2026).
- **Canada Greener Homes Affordability Program (CGHAP):** successor to the now fully-closed original Greener Homes Grant; direct-install model for low/median income households; Ontario had not yet signed on as of early 2026.
- Common thread across every program guide reviewed: **photos of insulation depth, air-sealing details, equipment labels, and before/after conditions are explicitly what saves a claim when documentation gets messy** — precisely the output Farpost Field Documentation already produces.

### Proposed feature concept: "Farpost Rebate Radar"
1. Takes a building's existing Farpost record (age, location, heating type, documented upgrades)
2. Cross-references currently active regional/utility/municipal programs (the hard, valuable part, since programs change constantly — this requires a maintained, queryable dataset, not a one-time list)
3. Surfaces: "you likely qualify for X, here's what documentation you already have vs. still need"

Stays within the "Farpost documents, it does not evaluate" principle — not filing claims or guaranteeing eligibility, just surfacing program + gap, same restrained posture as the professional-facing version.

### Front-door placement (later refinement)
Robin's insight: this doesn't need a login or an existing building record to be useful — "what rebates exist right now for my region and situation" is valuable to a complete stranger browsing before ever becoming a Farpost user. This makes it a genuine top-of-funnel/public front-door feature, not something buried behind onboarding. Proposed front-door flow: visitor provides rough region/building type/heating source → sees what's live right now → sees what evidence would be needed → sees what Field Docs already covers.

### Maintenance honesty flagged
This is explicitly a higher-maintenance dataset than most Farpost data — programs open/close/change amounts on short notice (e.g., the original Greener Homes Grant closed to new applicants in Feb 2024; its companion loan program was de-funded entirely in the 2025 federal budget). A stale rebate database actively misleads a homeowner, a materially bigger trust risk than a stale SR&ED prompt. Requires either:
- A real, scheduled update cadence — potentially AI-assisted, with an agent periodically re-verifying each program's official source page hasn't changed, flagging anything stale for manual review before public display, or
- A strong, unavoidable "confirm current details on the official program page" disclaimer built into every surfaced result — likely both should exist together, not one or the other.

Mechanically identified as the same category of problem as the existing "40-Year Pulse" StatCan data ingestion pipeline (Farpost's demographics thesis, from an earlier session) — a dataset that goes stale and needs a refresh cadence, just faster-moving in this case.

---

## Summary of New Concepts Born This Session (not previously documented)
1. Tool-agnostic adapter-layer architecture for Sreditor (OpenSpec as first adapter, not a hard dependency)
2. Cross-project log bridging model (per-repo logs + explicit merge command) for eventual Farpost-umbrella use
3. CRA Form T661 Part 2 as the concrete target format for `report` (lines 242/244/246, word limits, technical-vs-marketing language distinction)
4. Chrono Platform identified as a second competitor, not yet deep-dived
5. npm `funding` field confirmed permissible for donations
6. Open-core revenue model sketch: free core (judgment quality) vs. paid convenience layer (hosted dashboards, managed API proxy, budget alerts)
7. Consultant-facing paid tier as a structurally separate product/buyer from the free developer core
8. Automated cost/token tracking as a near-zero-cost feature riding on existing API calls
9. **Major generalization:** the Sreditor pattern ("surface money/recognition already owed but untracked, from work already being documented") applied across every Farpost professional role — a new category of value proposition distinct from the existing Take-Rate Standard
10. **Homeowner/business-owner "Rebate Radar" concept** — same pattern applied at Farpost's public front door, positioned as top-of-funnel rather than a logged-in-user feature, with an explicit data-staleness/trust risk flagged as needing active mitigation

## Context Note
Robin described this session as a "jaw dropping" and significant realization moment — the professional-role generalization in particular was identified in the moment as a genuinely new strategic hook for Farpost's value proposition, separate from and additive to existing subscription/take-rate monetization thinking.
