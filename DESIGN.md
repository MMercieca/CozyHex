# CozyHex — Design Document

> **Working title.** Final name TBD. Treat `CozyHex` as a placeholder throughout this doc and the codebase.

---

## 1. Pillars

A cozy mobile puzzle game intended to provide a visual unwind — an alternative to doom-scrolling, useful for managing low-grade anxiety. The "high" is in solving; high scores and beat-the-clock are explicitly out of scope.

Three load-bearing pillars:

1. **Cozy texture.** No time pressure, no penalties beyond *try again*, no manipulative engagement loops. A paid app that owes the player a complete experience and then leaves them alone.
2. **Order-of-operations puzzling.** The puzzle is "in what order do I commit these moves so they don't trip over each other?" Wrong order produces invalid state, made cozy by trivial restart.
3. **Procedurally generated puzzles.** The designer should not know the answer to every puzzle they ship. Procgen produces the bulk of the content; a small curated layer shapes onboarding.

## 2. Originality posture

The mobile puzzle market is saturated. Strict mechanical originality (a never-seen primitive) is unrealistic; **achievable originality is in the *combination*.** The mechanic gestalt — *cascading paint propagation + order-dependent blocking + prism-mediated geometry on a hex grid + colour-target matching with multi-tier elegance scoring* — is, as best we can identify, vacant on mobile. Each individual ingredient exists somewhere; the combination does not.

## 3. Core mechanic

### 3.1 Skeleton

**Sequential propagation puzzle.** The player presses pre-placed coloured **sources** in some order. Each press fires a **beam** that propagates across a hex board following geometric rules, painting tiles its colour as it goes, until something stops it. The board state evolves between firings; later beams see the board changed by earlier beams. Wrong order = unsolvable state.

### 3.2 Board

- **Hex grid**, axial coordinates `(q, r)`. Radius `R` ⇒ all `(q, r)` with `max(|q|, |r|, |q+r|) ≤ R`. Cell count = `1 + 3R(R+1)`.
- **Variable size per puzzle**, range R=2 (19 cells) to R=4 (61 cells). Board size is one of several procgen difficulty knobs.
- Six directions: E `(+1, 0)`, NE `(+1, -1)`, NW `(0, -1)`, W `(-1, 0)`, SW `(-1, +1)`, SE `(0, +1)`.

### 3.3 Tile types

- **Neutral.** Default. Paintable. Blocks a beam once painted.
- **Source.** Has a colour and a fixed firing direction. Single-use (fires once per puzzle attempt). Source cells themselves are *not* painted by beams — beams begin one cell out from the source.
- **Target.** Has a required colour. When a beam reaches a target, it paints the target and **stops**. A target painted the wrong colour is irrecoverable.
- **Anti-target (trap).** A target the player must *avoid* painting. Hitting one downgrades a *Solved* outcome to "not perfect" but doesn't fail the level.
- **Prism.** Pre-placed redirector. Two flavours:
  - **P-bend** (basic): bends a beam by 60° (relative bend, clockwise convention).
  - **P-split** (advanced): forks one beam into multiple output directions. Each output is full colour (no intensity accounting).

### 3.4 Beam propagation

- A beam fires from a source one cell outward in the source's direction.
- It travels in a straight line through neutral tiles, painting each as it passes.
- On reaching a **prism**, it redirects per the prism's rule.
- On reaching a **target**, it paints the target and stops. Cells past the target are not painted.
- On reaching a **painted tile** (any colour), it stops *before* entering. The blocking tile is unchanged.
- On reaching the **board edge**, it exits cleanly. No reflection (E-exit base; E-wrap reserved as a post-campaign difficulty knob).
- **No fuel limit.** Beams travel until they hit one of the above.
- **Atomic painting.** Full beam path (including all reflections) is computed first; commits all-at-once. Avoids self-collision mid-flight.

### 3.5 Prism details

- Bend angle is **relative** (e.g. "60° clockwise from entry direction"), not absolute. Same prism behaves differently based on entry direction.
- For P-split, output ports are pre-defined per prism type; orientation matters.
- Prisms are not paintable. Beams pass through the prism cell (the cell itself doesn't take colour).

### 3.6 Per-colour budget

Each puzzle has a fixed per-colour source count, *implied by the count of sources of each colour in the puzzle definition*. No separate `budget` field.

### 3.7 Subset-firing

The player is **not required to fire every source**. A puzzle with 5 sources may be solvable with 3; the other 2 are decoys. This is essential — it gives the elegance metric meaning and creates the "should I fire this?" decision branch.

## 4. Goals and feedback

### 4.1 Three-tier outcome

| Tier | Definition |
|---|---|
| **Solved** | Every target ended up its required colour. |
| **Perfect** | Solved + no anti-target was painted. |
| **"My solution too"** | Solved + final board state matches the *elegant canonical* solution (procgen-tagged). Recognition wink, not a higher tier. |

The three are evaluated automatically on every state change.

### 4.2 Auto-check

The instant all targets are correctly painted, the level ends. **No submit button.** If the player wants to chase Perfect after accidentally tripping a trap, they manually restart.

### 4.3 Fail modes

- **F1 (sources exhausted, unsolved).** All sources fired, targets not all correct. Auto-detected (cheap check). Sources and targets visibly **dim**, and a *Retry* affordance appears. No judgmental copy.
- **F2 (irrecoverable mid-puzzle).** A target was painted the wrong colour, or all paths to a remaining target are blocked. **Not auto-detected.** Forward simulation is too costly and too parental. The player figures it out and retries voluntarily.
- **Hitting an anti-target.** Not a fail. A small "sad flutter" animation marks the trap as painted; the level continues. Has the side effect of disqualifying the *Perfect* tier.

### 4.4 Elegance metric

The canonical "elegant" solution is **shortest first** (fewest sources fired), **most-symmetric path second** as tiebreak. Procgen finds it via BFS over firing subsets, pruned by current best length. For ties, score solutions by symmetry of the final painted-cell set (e.g. sum of distances from board centre's axis of symmetry); pick the most symmetric.

## 5. Difficulty knobs

Procgen tunes a small set of knobs to target a difficulty tier:

| Knob | Range / values | Effect |
|---|---|---|
| `N` source count | 2–12 | Dominant. Decision space is `~∑(N choose k)·k!`. |
| `K` colours used | 1–4 | Visual / accessibility / per-colour budget structure. |
| Board radius | 2–4 | Spatial complexity. |
| Anti-targets | 0–3 | Forces routing away from traps. |
| Prisms (P-bend) | 0–4 | Geometric complexity. |
| Prisms (P-split) | 0–2 | Significantly harder; reserved for ring 4+. |
| Decoy sources | implicit (sources beyond minimum) | "Should I fire this?" decisions. |

**Recommended tier mapping (initial, calibrated empirically in Phase 3):**

| Tier | N | K | Radius | Mechanics |
|---|---|---|---|---|
| Easy | 2–4 | 1–2 | 2 | sources + targets only |
| Medium | 4–7 | 2–3 | 2–3 | + anti-targets, P-bend |
| Hard | 6–10 | 2–3 | 3 | + P-split, larger boards |
| Expert | 8–12 | 3–4 | 3–4 | all mechanics, dense boards |

## 6. Game structure

### 6.1 Two modes

- **Campaign.** A finite, curated progression. 61 levels arranged on a hex-of-hexes meta-map.
- **Infinite mode.** A pool of ~5,000 procgen puzzles spanning all tiers. Player picks tier, gets next puzzle, repeats.

No daily puzzles, no leaderboards, no accounts, no Game Center, no social hooks in v1.

### 6.2 Campaign map

Hex-of-hexes (radius 4) = 61 puzzles.

| Ring | Cells | New mechanic | Compounds with |
|---|---|---|---|
| 0 (centre) | 1 | sources + targets, single colour | — |
| 1 | 6 | per-colour budget, multiple colours | — |
| 2 | 12 | anti-targets | budget |
| 3 | 18 | P-bend prisms | budget + traps |
| 4 | 24 | P-split prisms; difficulty ramp | all above |

Player-chosen direction (12b) and edge wrap (E-wrap) are **not** introduced in campaign; they live in infinite mode as a higher difficulty ceiling.

### 6.3 Hand-authoring vs procgen

Posture: **all puzzles procgen-derived; hand-authoring is an escape hatch only if procgen can't deliver minimal first-encounter puzzles.** Designer plays generated output, marks keepers, sequences the campaign from selected ones. Hand-authored count: assume zero, escape to small handful only if proven necessary.

### 6.4 Shipping model

- **D1 — output shipped in binary.** Procgen runs at dev-time on the developer machine; output JSON is committed and bundled with the app. App contains no runtime procgen logic in v1.
- ~5,000 puzzles for infinite + 61 for campaign ≈ ~5 MB of static data.
- Truly infinite procgen (D2) deferred indefinitely.

## 7. Procgen

### 7.1 Algorithm: hybrid

- **Backward construction** for the skeleton: pick a target board state and an intended firing sequence; reverse-engineer source positions, prism placements, and target locations.
- **Forward decoration** for difficulty: add decoy sources, anti-targets, additional prisms; verify with simulation that the canonical solution is still the elegant one and no shorter alternative exists.
- **Brute-force solver** validates every output: BFS over firing subsets confirms solvability and identifies the elegant solution.

### 7.2 Difficulty model

A weighted feature score, calibrated empirically:

```
score = w_N · N
      + w_K · K
      + w_prism · prism_count
      + w_split · split_prism_count
      + w_anti · anti_target_count
      - w_solutions · log(valid_solution_count)
      + w_radius · board_radius
```

Initial weights guessed; tuned in Phase 3 by regressing against playtest difficulty labels. Score binned into Easy / Medium / Hard / Expert.

### 7.3 Workflow loop

```
1. procgen --tier=<T> --count=<N> --out=./drafts/<T>.json
2. playtest --pack=./drafts/<T>.json
3. (designer plays, rates each: keep / drop / too-easy / too-hard / good-for-tutorial)
4. cull --pack=./drafts/<T>.json --feedback=./feedback.json --out=./puzzles/<T>.json
5. (designer adjusts procgen weights, re-runs)
```

Designer never edits puzzle JSON by hand.

## 8. Tech stack

### 8.1 Platform

iOS first. Android port deferred — RN architecture makes it cheap later if traction warrants it.

### 8.2 Frameworks

- **React Native** as the app shell. (Bare RN, matching the existing `alien-tech` umbrella; not Expo. Final call deferred to PRD — see §8.4.)
- **react-native-skia** for the puzzle scene (hex grid rendering, beam paths, bloom animations).
- **react-native-reanimated 3** for gesture-driven UI animations.
- **react-native-gesture-handler** for tap-and-hold detection.

### 8.3 Repo layout

> The exact repo layout is **deferred to the PRD**. Two viable shapes:
>
> - **Sibling RN app inside `alien-tech/CozyHex/`** matching the existing umbrella pattern (`Rivers`, `RotationTech`, `SlidingTech`). Engine code in `CozyHex/src/engine/`. Procgen as a Node CLI under `CozyHex/src/procgen/`. No monorepo refactor.
> - **pnpm monorepo** (`packages/core` + `packages/procgen` + `packages/puzzles` + `apps/mobile`) with cleaner separation but more upfront restructuring.

Whichever shape is chosen, the **invariant** is:

- A pure-TS engine package (no RN dependencies) used by both the app and procgen.
- A Node-runnable procgen CLI that outputs JSON puzzle packs.
- Generated puzzles committed to git and bundled into the app at build time.
- **A single source of truth for simulation** — one beam-propagation implementation, used identically by procgen-validation and runtime gameplay. No drift.

### 8.4 Bare RN vs Expo

Existing umbrella is bare RN. Sibling-app approach implies bare RN. Standalone monorepo could go either way. PRD will pick. Bare RN is the lower-friction default given the umbrella precedent.

## 9. Player interaction

### 9.1 Core gestures

- **Quick tap on source** = fire (commit). Beam animates, paint commits.
- **Tap-and-hold on source** = preview. A ghost beam shows the path the beam *would* take given current board state.
- Toggleable in settings (preview off = harder mode).

### 9.2 Undo

**Full reset only.** No step-back undo. Once a beam fires, it commits. Preview is the pre-commit safety; restart is the post-commit safety. Step-back undo would let the player brute-force orderings, undermining the puzzle.

### 9.3 Animation timing

- **Beam animation:** 500–800ms per firing. A glowing head glides along the path; tiles bloom (radial outward) to colour as the head crosses them.
- **Prism flare:** brief (~120ms) flare at the prism cell as the beam enters; beam continues without pause in the new direction.
- **Target hit:** sparkle + soft tone.
- **Trap hit:** small dim "sad flutter"; level continues.
- **Solve celebration:** tier badge fades in (~1.2s), warm tone for *Solved*, fuller chord for *Perfect*, extra "kept-tone" note for *My solution too*. *Next* / *Replay* affordance appears after badge.
- **F1 fail:** sources and targets dim; *Retry* affordance appears. No judgmental copy.

### 9.4 Input during animation

- Block input during beam animation.
- **Tap anywhere on the board** during animation = skip current animation to completion. Tapping a source after skip-completion fires that source.

## 10. First-run / tutorial

### 10.1 Welcome

A single soft welcome screen: title centred, idle-pulsing empty hex grid, *Tap to begin*. Returning players skip this entirely.

### 10.2 Gesture teaching

The first puzzle shows a persistent hint: *Hold to preview.* Hint disappears only when the player successfully tap-and-holds. Then a second hint appears: *Tap to fire.* Disappears when the player commits a press. Subsequent puzzles have no hints. Adaptive to the player; no time-based fade.

### 10.3 Mechanic introduction

**Pure structural teaching.** First-encounter puzzles are minimal — when the player meets a prism for the first time, the puzzle is constructed so the prism is the *only* thing to figure out. No modals, no callouts. The campaign rings are the curriculum.

This places a real burden on procgen: it must support tight parameter constraints (e.g. "1 source, 1 target, 1 prism, no other mechanics") to produce these minimal teach-puzzles.

### 10.4 Settings access

Settings live on the campaign map only. **No in-puzzle settings access.** In-puzzle UI is just the puzzle. To pause, return to campaign map.

## 11. Persistence

### 11.1 What's saved

- Campaign progress: per-puzzle best tier (*Solved* / *Perfect* / *My solution too*), discovered-at timestamp.
- Infinite mode: cumulative count of solved puzzles per tier. No per-puzzle history.
- Settings: preview toggle, sound on/off, haptics on/off, animation skip preference.
- Onboarding flags: has the player seen the welcome screen, completed first-puzzle gestures.

**Not tracked:** attempt count per puzzle (anti-cozy).

### 11.2 Where

Device-local only (AsyncStorage or MMKV). **No iCloud sync in v1.** iCloud may be added later if a purchase-unlock model requires preserving entitlements across devices.

### 11.3 Account model

**No accounts. Ever.** No Game Center, no sign-in-with-Apple, no email.

### 11.4 Reset

A *Reset all progress* button in settings, behind a confirmation dialog.

## 12. Monetization (parked)

Three options remain open:

- **A.** Premium one-time purchase (~$3.99). Pay once, own everything.
- **A′.** Free campaign + paid infinite mode unlock (~$2.99–$3.99).
- **B.** Free everything + tip jar.

Decision deferred. Architecture **must** support any of the three:

- A single boolean `infiniteModeUnlocked` in persistence.
- Code paths gate on this boolean rather than assume "everything is always available."
- For dev / playtest, default to `true`.
- IAP (StoreKit / RevenueCat) integration is **not** built until the model is decided.

**Excluded permanently:** ads of any kind. Cozy-incompatible.

## 13. Puzzle data schema

```jsonc
{
  "id": "sample-decoy-001",
  "boardRadius": 2,                    // R; cells = 1 + 3R(R+1)
  "palette": ["red", "blue"],          // colours used in this puzzle
  "sources": [
    { "cell": [0, -2], "color": "blue", "direction": "SE" },
    { "cell": [1, -2], "color": "red",  "direction": "SE" },
    { "cell": [-2, 0], "color": "red",  "direction": "E"  }
  ],
  "targets": [
    { "cell": [1, 1], "requires": "red"  },
    { "cell": [0, 2], "requires": "blue" }
  ],
  "antiTargets": [],
  "prisms": [],                        // see §3.5 for prism types
  "canonicalSolution": {
    "firings": [
      { "sourceIndex": 1 },            // source[1] = red SE @ (1, -2)
      { "sourceIndex": 0 }             // source[0] = blue SE @ (0, -2)
    ],
    "length": 2
  },
  "difficulty": {
    "tier": "easy",
    "score": 4.2                       // procgen's computed score
  }
}
```

- `cell` is axial `[q, r]`.
- `direction` is one of `"E" | "NE" | "NW" | "W" | "SW" | "SE"`.
- `sourceIndex` references the `sources` array by position.
- `canonicalSolution.firings` is the elegant ordering (shortest, symmetry tiebreak).
- Per-colour budget is implied by the count of sources of each colour.

## 14. Sample puzzle: "The Decoy"

Used as the Phase-0 sample for sanity-checking the data model and simulation.

- **Board:** R=2 (19 hexes).
- **Palette:** red, blue.
- **Sources:** 3 (`R₁→` at `(-2, 0)` red E; `R₂↘` at `(1, -2)` red SE; `B↘` at `(0, -2)` blue SE).
- **Targets:** `T_R` at `(1, 1)` requires red; `T_B` at `(0, 2)` requires blue.
- **No prisms, no anti-targets.**

**Elegant solution:** fire `R₂` then `B` (or `B` then `R₂` — order doesn't matter between these two because their paths don't conflict). 2 firings. `R₁` is a pure decoy: firing it paints `(0, 0)` red, which blocks `B`'s path to `T_B`.

**Why it's the right Phase-0 sample:**

- Exercises every primitive: beam propagation, paint commit, beam termination on target, beam termination on painted cell, target-colour validation, F1 detection.
- Validates subset-firing — elegant solution leaves a source unfired.
- Small enough to verify by hand; suitable for unit tests.

## 15. Build phases

| Phase | Focus | Rough duration |
|---|---|---|
| **0** | Sample puzzle render + shared engine: types, hex math, beam simulation, prism logic, target/trap eval, elegance scorer. Heavy unit testing. | 1–2 weeks |
| **1** | Procgen Node CLI. Hybrid backward + forward generation. Brute-force solver for validation. Difficulty score. | 2–3 weeks |
| **2** | Minimal RN playtest harness. Hex grid via Skia, beam animation, tap-to-fire, tap-and-hold preview, tier badge. Loads JSON puzzle packs; lets designer rate puzzles. | 1–2 weeks |
| **3** | Calibration. Generate, play, rate, tune procgen weights, regenerate. **The design phase.** Don't underestimate. | 4–8 weeks elapsed |
| **4** | Campaign curation (overlaps Phase 3). Pick 61 puzzles from calibrated procgen output; sequence by ring. | parallel |
| **5** | Generate infinite pool (~5,000 puzzles) with locked weights. Commit. | ~1 week |
| **6** | App polish: welcome screen, campaign hex map, settings, sound, haptics, final animations, splash, app icon. | 3–4 weeks |
| **7** | TestFlight beta; iterate on player feedback. | 2–4 weeks |
| **8** | Launch. | — |

**Total rough budget: 4–6 months part-time**, dominated by Phase 3.

### Phase 0 first deliverable

Render the sample puzzle (§14) — both initial state and post-solution state — as a static image (or text representation, or simple Skia component) before any code commits to the puzzle schema. The image is the contract; tweaks discovered while drawing it propagate to the data model before procgen is built.

## 16. Deferred mechanics roster

Mechanics intentionally not in v1, with reserved expansion paths:

| Mechanic | Reserved for |
|---|---|
| Split prisms (P-split) | Ring 4 of campaign |
| Player-chosen firing direction | Post-campaign / infinite mode |
| Edge wrap (toroidal beams) | Post-campaign / infinite mode |
| Pass-through targets | Post-launch difficulty escalator |
| Reflecting targets | Post-launch difficulty escalator |
| Cover-the-board goal type | Bonus mode / alt puzzle type |
| Daily puzzle | Indefinitely deferred |
| iCloud sync | If monetization needs it |
| Android port | If iOS traction warrants |

Excluded permanently:

- **P-combine prisms** — colour blending breaks colourblind accessibility.
- **Tile rotation as a mechanic** — overlaps with Rivers and RotationTech; user wants new ground.
- **Ads** — cozy-incompatible.
- **Accounts of any kind** — friction-incompatible with cozy.

## 17. Accessibility

- **Colourblind-safe palette.** ≤4 distinct colours, each carrying a *secondary channel* (shape/symbol on source/target/beam) — not hue alone. Deuteranopia-safe palette as the base.
- No P-combine, no colour blending — colour is never the sole carrier of meaning.
- Preview toggle in settings; defaults to on.
- Plan in Phase 6 (not perfect, must work): Dynamic Type for all text, motion-reduction setting (skip animations to snap), VoiceOver for menu navigation.
- Localization deferred to post-launch (game has minimal text).

## 18. Risks and watch-points

1. **Phase 3 is design, not tuning.** The temptation to skim it and ship will be strong; resist. The shape of "what makes a good puzzle in this mechanic" only emerges from playing dozens of generated outputs.
2. **Order-mattering puzzles with valid solutions are not trivial geometry.** Many natural-feeling layouts are unsolvable. Procgen's brute-force solver must validate every output. Build it in Phase 0; never skip validation.
3. **The decoy mechanic is load-bearing.** It's how puzzles get hard, how subset-firing earns its keep, and how the elegant-solution badge becomes meaningful. Validate decoys feel right early in playtest.
4. **RN + Skia performance on lower-end devices.** Profile a 12-source puzzle scene by end of Phase 2 on the oldest target device. Catching framerate issues early is cheaper than retrofitting.
5. **Hand-authored teach puzzles may be needed after all.** Assume zero, but be ready to author a small handful per ring if procgen can't deliver minimal first-encounter puzzles.

## 19. Things to revisit if playtest surprises us

- Step-back undo (we chose full-reset; might soften).
- Auto-detect F2 (we chose not to; might add a "stuck?" affordance).
- Hint persistence in early levels (we chose gesture-gated; may need to fade after N puzzles regardless of gesture success).
- Hand-authored teach puzzle count (zero assumed; iterate).
- Per-colour blend / mix (excluded for accessibility; revisit if a non-hue-dependent blend mechanic surfaces).

---

## Appendix A — Design decision log

| # | Question | Decision |
|---|---|---|
| 1 | What was Rivers? | Rotation puzzle, route boat to port via pipe shapes. Provides context — rotation mechanics already explored twice (Rivers + RotationTech). |
| 2 | What does "original" mean; is rotation off the table? | Originality via novel mechanic OR novel combination. Rotation kept available as a tool, not a primary mechanic. |
| 3 | Structural skeleton? | Sequential propagation (skeleton 4F). Player commits actions; world propagates; state freezes; order matters. |
| 5 | Lantern / frost-path categorisation | They're propagation puzzles, not route-drawing. Schema revised to include 4F. |
| 6 | How local is a press? | Cascading propagation. |
| 7 | What makes presses non-commutative? | Painted tiles permanently block future beams. |
| 8 | How does a beam propagate? | Beam (straight line until obstacle). Sources fixed in position. |
| 9 | What stops a beam? | Painted tile, target, board edge. No fuel limit. Atomic painting. |
| 10 | Geometry | Hex grid. 6 directions, 60°/120° prism angles. |
| 11 | What is "solving"? | Hit all targets correctly. Perfect tier (no traps). "My solution too" (matches elegant canonical). Anti-targets confirmed. |
| 12 | What is a "move"? | Order only (sources pre-placed with fixed direction). Player-chosen direction reserved as advanced. |
| 12.1 | Beam at edge | Exit. Edge wrap reserved. |
| 12.3 | "My solution too" | Matches the *elegant canonical*. |
| 13 | Level structure | Curated campaign + infinite mode. Daily puzzle deferred indefinitely. |
| 13.1 | Campaign shape | Hex-of-hexes, R=4 = 61 levels. Each ring introduces a new mechanic. |
| 14 | Hand-authored vs. procgen | Procgen-first; hand-authoring only if proven necessary. |
| 14′ | Build-time vs. runtime procgen | Output shipped in binary. ~5,000 + 61 puzzles. |
| 15.1 | Palette size | 4 colours total, 1–3 per puzzle. |
| 15.2 | Board size | Variable, R=2 to R=4, as a difficulty knob. |
| 15.3 | Source count `N` | 2–12 range, tiered. |
| 16 | Subset-firing | Sources can be left unfired (decoys). |
| 16.2 | Result detection | Auto-check. |
| 16.3 | Fail detection | F1 only. F2 not auto-detected. |
| 17.1 | Undo | Full reset only. |
| 17.2 | Preview | Tap-and-hold preview, quick tap commits. Toggleable. |
| 18.1 | Platform | iOS first. |
| 18.2 | Framework | React Native + react-native-skia + Reanimated 3 + Gesture Handler. |
| 18.3 | Procgen location | Node CLI in shared TS codebase. |
| 19.1 | Procgen algorithm | Hybrid backward-skeleton + forward-decoration. |
| 19.2 | Difficulty model | Weighted feature score, calibrated empirically. |
| 19.3 | Elegance | BFS for shortest, symmetry score for tiebreak. |
| 20.1 | Beam animation timing | 500–800ms cozy beams. |
| 20.2 | Tile paint reveal | Bloom. |
| 20.3 | Solve / fail feedback | Solve = warm badge + sparkle + tone. F1 = dim + retry. Trap = sad flutter. |
| 20.4 | Input during animation | Block + tap-board to skip. |
| 21.1 | First-launch flow | Soft welcome screen. |
| 21.2 | Gesture hint | Gesture-gated. |
| 21.3 | Mechanic intro | Pure structural. |
| 21.4 | Settings access | Campaign map only. |
| 22 | Monetization | Parked. Architecture supports A / A′ / B via single boolean. |
| 23.1 | What's saved | Campaign progress, infinite cumulative, settings, onboarding flags. No attempt counts. |
| 23.2 | Where saved | Device-local only in v1. |
| 23.3 | Reset / accounts | Reset-all in settings. No accounts. |
| 24 | Build order | Phases 0–8. |
| 24a | Source cell painted? | No. Beam starts one cell out. |
| 24b | Beam past target? | Stops at target. Pass-through / reflecting reserved as future knobs. |

---

## Appendix B — Glossary

- **Source.** A pre-placed tile that, when pressed, fires a beam in a fixed direction with a fixed colour.
- **Target.** A tile that requires being painted a specific colour. Beam stops on hit.
- **Anti-target / trap.** A target the player must avoid painting. Painted = level still solvable, but not Perfect.
- **Prism.** Pre-placed redirector. Bends or splits beams.
- **Beam.** A straight-line propagation event, painting tiles as it travels.
- **Painted tile.** A previously-neutral tile that's now coloured. Blocks future beams of any colour.
- **Decoy source.** A source whose firing makes the puzzle unsolvable. The elegant solution leaves it unfired.
- **Elegant canonical.** The shortest valid solution (with symmetry tiebreak) for a given puzzle. Procgen tags one per puzzle.
- **Subset-firing.** The player is not required to fire every source.
- **F1 fail.** All sources fired, targets not all correct. Auto-detected.
- **F2 fail.** Mid-puzzle irrecoverable state. Not auto-detected.
- **The Decoy.** The Phase-0 sample puzzle (§14).
- **CozyHex.** Working title.
