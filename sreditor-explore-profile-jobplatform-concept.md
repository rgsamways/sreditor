# Sreditor: Explore, Profile, and the "Uncertainty-Verified" Job Platform Idea
*Captured July 16, 2026. Parked concept — not scheduled work. Sreditor is at 0.1.0, functioning, not yet npm-published.*

---

## Starting point: the caution being addressed

Earlier design work flagged a real risk — Sreditor (or any AI layer behind it) suggesting technical paths *in order to* manufacture SR&ED eligibility inverts the CRA three-part test. Uncertainty has to be genuine and pre-existing, not tax-motivated. This doc is the resolution: a way to give developers forward-looking inspiration without ever touching the evidentiary chain (`probe` → `judge` → `rollup` → `report`).

---

## 1. `sreditor explore`

A new, clearly separate CLI command. Originally named "dream," then "inspire," settled on **"explore"** — matches the plain/clinical tone of the existing verbs (`probe`, `judge`, `rollup`, `report`) and frames the developer as the active party ("you explore, it just surfaces material") rather than the tool doing something to them.

**Core rule:** `explore` output never touches the judgment log. Not written to JSONL, never fed into `probe`/`judge`/`rollup` as context. It's inspirational browsing, not evidence — same epistemic status as reading a paper or an HN thread. If a developer builds something after seeing an `explore` card, that work still has to earn its own eligibility through normal `probe`/`judge` on its own merits.

**Presentation format:** passive info cards, explicitly disclaimed at the top ("Exploration — not eligibility guidance"). Cards describe the state of the field ("no dominant solved pattern yet"), never the developer's opportunity ("you should build this"). No directive verbs. Each card cites its source (paper, trending repo, changelog).

**Backend:** a curated datastore, refreshed periodically (daily/few-times-weekly) from arXiv, papers-with-code, GitHub trending, HN front page, framework changelogs. An LLM pass clusters raw items into themes, writes summaries, tags by domain, scores "buzzy-and-unsolved." CLI just pulls current top-N per tag — no local AI needed for this command.

**Checkpoint moment:** most valuable right after a disappointing `judge` run (dev builds a few modules, checks eligibility, finds nothing qualifies). This is also the highest-risk moment for the fraud-adjacent pattern — the passive framing matters most here, so a real idea can inspire genuine future uncertainty without ever being usable as "the tool told me to do this for the credit."

**Variance over time — resolved without new state:** rather than persisting per-user shown-history (a real architecture/trust cost for a local-first, BYOK tool), rely on two independent drift axes that already exist:
- Project drift — the anchor doc and judgment history naturally change as the dev builds
- Field drift — the backend corpus rotates on its own schedule

Optional lightweight de-dup: hash the anchor-doc content that produced a given query, cache the fingerprint locally in `.sreditor/`, skip repeat cards for that specific project state. No server-side per-user tracking required.

**Optional relevance nudge:** loosely match tags against the dev's detected stack (package.json, language) to bias which cards surface first — kept as a separate, explicit opt-in from anything `probe`/`judge` touches.

---

## 2. Local "trajectory" dashboard

Prompted by: "what if there were a running, evolving learning profile for a developer?"

**Resolved shape:** lives in the same localhost web view Sreditor already serves for judgment/report output — not a hosted account/profile service. This keeps it local-first, inherits the existing BYOK/nothing-leaves-your-machine trust story for free, and avoids standing up new auth or server-side persistence.

**Scope discipline — per project, not cross-project:** each project's `.sreditor/` folder stays fully self-contained. No implicit cross-repo aggregation. The dashboard reads only from data already local to that project: `explore` engagement/cache, anchor doc revision history, `judge`/`rollup` summaries over time.

**Separation from the judgment pipeline still applies, now enforced by file layout:** dashboard/profile data should live in its own local file (e.g. `.sreditor/profile.json`) that `probe`/`judge` never open — same rule as `explore`, just enforced structurally rather than by product-surface separation.

---

## 3. `sreditor profile export`

The developer-initiated bridge between "local per-project data" and "something a person can actually use elsewhere."

- Reads one project's local trajectory data (explore engagement, anchor revisions, optionally a light summary of the judgment log — e.g., "worked on N technologically uncertain problems across M months")
- Emits a portable artifact (markdown and/or JSON)
- Sreditor's job stops there — no auto-push anywhere. The dev pastes it into a personal site, drops it in Drive, commits it to a career-log repo, whatever they want
- Cross-project aggregation, if wanted, becomes the developer's own action on already-exported files — possibly a future `sreditor profile merge file1.md file2.md` convenience command, echoing the existing cross-project `merge` command already designed for CCPC filing. Explicit and dev-initiated, not Sreditor quietly stitching repos together.
- Open decision, not yet resolved: whether export pulls only "what you were curious about and built" (explore + anchor history) or also lightly summarizes judgment-log content. The latter is more resume-compelling but is the first point where judgment-log content crosses into a different-purpose document — fine since the dev is exporting data about themselves, but worth deciding deliberately rather than defaulting into it.

---

## 4. The bigger idea: a niche "uncertainty-verified" job/resume platform

**The gap identified (checked against current GitHub-profile landscape, July 2026):** GitHub and its ecosystem of add-ons (contribution graphs, streak stats, language breakdowns, pinned-repo READMEs, stats badges) verify *volume and consistency* of activity — commits, streaks, PRs, languages used. None of it verifies *quality of thinking* — whether the work involved genuine technological uncertainty versus routine execution. That's an open, unclaimed niche: third-party-judged evidence of uncertainty-seeking, not self-reported or volume-based signal.

**The pitch, one line:** a platform where developers showcase Sreditor-exported profiles as proof they're the kind of developer who pushes into unsolved territory — aimed at companies who specifically want that (a real, currently hard-to-screen-for hiring signal), not the general job-board market.

**What it would require (a genuinely separate product):**
- Ingestion/normalization of exported profile files across different developers' projects
- A public-facing profile format skimmable in ~30 seconds
- Some trust/verification layer — a signed export from Sreditor itself, or another way to prove a profile traces back to real judged activity rather than hand-edited text
- Solving the two-sided marketplace cold-start problem: a job platform is only as good as whether employers show up, and that's an order of magnitude harder than getting one developer to find a CLI useful

**Timing argument for revisiting this — not acting now:** AI/ML hiring interest is currently very hot, and "prove you're genuinely current, not just resume-polished" is an especially sharp pitch in exactly that climate. That argues for not letting the idea go stale — but it doesn't argue for building it before Sreditor itself has real 1.0 users.

**Recommended sequencing (as discussed):**
1. Ship Sreditor to a real 1.0 — `explore`, local dashboard, `profile export` built and working
2. Get actual developers using it, especially `explore` → `profile export`
3. Watch for the real validating signal: developers asking "where do I put this" / wanting to show the export off somewhere
4. If that signal shows up, the job platform becomes a validated build, not a hunch — and the AI/ML hiring climate will very likely still be hot by then, or something adjacent will be

**Status:** parked, same treatment as BRILL — written down, not scheduled, revisit if/when Sreditor has real usage data to validate demand.
