## 1. README

- [x] 1.1 What Sreditor does + 1-2 line differentiation vs Sredio/Boast/Chrono
- [x] 1.2 Bring-your-own-key setup instructions
- [x] 1.3 "Judgment Prompts" section: link + short excerpt per prompt (judgeChange, compareDrift, rollup)
- [x] 1.4 "Known Limitations" section

## 2. package.json

- [x] 2.1 Add `funding` field — skipped per Robin: no real donation URL exists yet, adding one now would point at nothing
- [x] 2.2 Confirm license metadata and `bin` entry are accurate; also added `repository`/`homepage`/`bugs`/`author`/`keywords` (verified real values, not guessed)

## 3. CI

- [x] 3.1 Add `.github/workflows/ci.yml` (typecheck, build, test on push/PR, with a retry on the known Vitest flake)

## 4. Verification

- [x] 4.1 Re-read the finished README as a skeptical outside reader would — found and fixed a dangling "comparison above" reference and an overly-specific unverified API-key URL
- [x] 4.2 Confirmed CI workflow YAML syntax by manual review (no YAML tooling available locally); confirmed `npm run typecheck`/`build`/`test` all still pass after the package.json edits; confirmed `npm pack --dry-run` produces a clean, correctly-scoped tarball
