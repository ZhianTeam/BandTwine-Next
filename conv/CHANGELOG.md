# [1.0.0] - 2026-08-05
> **TL;DR**
> First stable release.

## Features
- **Mostly no HITL**: Auto detect `./bandtwine_src/*.json`
- Split / Combined are **supported**
- **Successful tests**:
  - Metadata → KDL config.kdl
  - Nodes → Twee 3 story.twee
  - `{var.*}` → `<<print $*>>`
  - `{cond.*}` → `<<if>>...<<else>><</if>>`
  - `{random.*}` → random choices
  - `{img.*}` → `[img[...]]`
  - `{0}`, `{1}` → `[[text|target]]`
  - Actions → SugarCube

## Issues
- Legacy-specific features unsupported (`addListener`, `removeListener`, `advanceTime`)
- JavaScript Conversion / Image URI may inaccurate
- No CSS & userScript migration now
