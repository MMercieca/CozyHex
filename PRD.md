# PRD — CozyHex (working title)

> Companion to `CozyHex/DESIGN.md`. The design doc is the authoritative spec for *what* the game is; this PRD focuses on *how it gets built* and the user-facing acceptance criteria for v1.

## Problem Statement

Players who reach for their phones to unwind often end up doom-scrolling — pulled into engagement-optimised feeds that leave them more anxious than when they started. Existing cozy puzzle apps either run out of content quickly (premium puzzlers ship a fixed level count and end), bury the puzzle under in-app upsells (free-to-play with ads or IAP nags), or fight the cozy goal with timers, leaderboards, or punishing failure states. There's a gap between "ten minutes of calm puzzle-solving" as a stated player desire and what most mobile puzzle apps actually deliver.

Specifically, players who enjoy *order-of-operations* puzzles — figuring out the right sequence for moves where a wrong order leaves them stuck — have very few options on mobile. The category exists on PC (SpaceChem, Opus Magnum) but those are crunchy and programmer-flavoured, not cozy.

## Solution

A cozy mobile puzzle game where the player presses a small set of pre-placed coloured **sources** in some order, watching cascading colour propagation across a hex board until every **target** has been painted its required colour. Wrong order leaves a target unreachable — but failure is soft (one tap to retry) and the puzzle never punishes, hurries, or judges.

The game ships with two complementary content streams: a **curated 61-puzzle campaign** arranged on a hex-of-hexes meta-map that introduces mechanics one ring at a time, and an **infinite mode** of ~5,000 procedurally-generated puzzles spanning four difficulty tiers. The player is never bored (procgen pool is large enough to feel infinite) and never overwhelmed (campaign teaches every mechanic structurally before it appears in the wild).

The visual identity is a kaleidoscope of expanding colour: each beam glides along its path, blooming tiles to colour as it goes, freezing into a static painted board between firings. There are no timers, no scores, no leaderboards, no accounts, no ads. Just the puzzle, and the small warm pleasure of solving it.

Three solve tiers reward different player relationships with the puzzle:

- **Solved** — every target ended up its required colour.
- **Perfect** — solved without painting any **anti-target** (trap).
- **"My solution too"** — solved using the *elegant canonical* solution (shortest, with symmetry tiebreak) that procgen identified during generation. A recognition wink, not a higher tier.

## User Stories

### Player — first launch & onboarding

1. As a new player, I want a quiet, unhurried welcome screen, so that I'm not greeted by ads or upsells when I first open the app.
2. As a new player, I want to enter the campaign by tapping anywhere on the welcome screen, so that I don't have to navigate menus to start playing.
3. As a returning player, I want the welcome screen to be skipped, so that I land directly on the campaign map.
4. As a new player, I want the very first puzzle to be solvable in one obvious tap, so that I feel competent immediately.
5. As a new player, I want a hint telling me to *Hold to preview*, so that I learn the preview gesture without having to read a tutorial.
6. As a new player, I want the *Hold to preview* hint to disappear only once I've successfully held a source, so that I'm not nagged after I've already learned the gesture, and not abandoned if I haven't.
7. As a new player, I want a follow-up hint telling me to *Tap to fire*, so that I learn the commit gesture after the preview gesture.
8. As a new player, I want the *Tap to fire* hint to disappear only once I've fired a source, so that I'm gently confirmed before moving on.
9. As a returning player, I want the gesture hints to never reappear, so that I'm trusted to remember.
10. As a new player, I want each new mechanic (anti-targets, prisms, split prisms) to appear first in a puzzle constructed so that the new mechanic is the only thing to figure out, so that I can learn by playing rather than by reading modals.

### Player — campaign experience

11. As a player, I want a hex-shaped map of all 61 campaign puzzles, so that I can see my progress and what's ahead.
12. As a player, I want to see at a glance which puzzles I've completed, which I've Perfect-cleared, and which I've solved with the elegant canonical, so that I have a sense of progression.
13. As a player, I want each ring of the campaign map to introduce one new mechanic, so that I'm not overwhelmed by complexity all at once.
14. As a player, I want to be able to tap any unlocked puzzle to play it, so that I'm not forced through a strict linear order.
15. As a player, I want to replay puzzles I've already solved, so that I can chase a higher tier (e.g. attempt Perfect after a Solved) or revisit favourites.
16. As a player, I want the campaign to have a clear ending, so that completing it feels meaningful rather than open-ended.

### Player — infinite mode

17. As a player, I want an infinite mode that produces a fresh puzzle whenever I want one, so that I can unwind on any day without running out of content.
18. As a player, I want to choose a difficulty tier (easy, medium, hard, expert) for infinite mode, so that I can match the puzzle to my mood.
19. As a player, I want infinite mode to track my cumulative count of solved puzzles per tier, so that I can see my long-term play.
20. As a player, I do *not* want infinite mode puzzles to be tracked individually, so that I'm not surveilled or scored on every action.

### Player — core gameplay

21. As a player, I want to tap a source to fire it, so that committing a move requires one obvious gesture.
22. As a player, I want to tap-and-hold a source to preview where the beam would go, so that I can plan without committing.
23. As a player, I want preview to show the full beam path including reflections through prisms, so that the preview is an honest predictor of the firing.
24. As a player, I want preview to release without committing if I let go before the gesture completes a hold, so that I can change my mind cheaply.
25. As a player, I want to be able to disable preview in settings, so that experienced players can play in a harder mode.
26. As a player, I want each beam to animate visibly when I fire (500–800ms), so that I can watch the kaleidoscope spread.
27. As a player, I want each tile to bloom to colour as the beam crosses it, so that the visual identity is immediately satisfying.
28. As a player, I want a brief flare at a prism cell when a beam reflects through it, so that I see the redirection happen.
29. As a player, I want to be able to tap anywhere on the board during an animation to skip it to completion, so that I'm never stuck waiting if I want to play fast.
30. As a player, I do *not* want my taps on a source during animation to queue up, so that I'm never surprised by a delayed commit.

### Player — solving and feedback

31. As a player, I want the level to declare *Solved* the instant all targets are correctly painted, so that I'm not asked to confirm or submit.
32. As a player, I want a warm tier badge (*Solved* / *Perfect* / *My solution too*) to fade in centred over the board on success, so that the moment of solving is celebrated.
33. As a player, I want a soft tone for *Solved*, a fuller chord for *Perfect*, and an extra "kept-tone" note for *My solution too*, so that the audio reinforces the tier.
34. As a player, I want a sparkle effect on each correctly-painted target on solve, so that the moment is visually warm.
35. As a player, I want a *Next* and *Replay* affordance to appear after the badge animation, so that I choose what comes next without auto-advance.
36. As a player, I want an explicit *Retry* button always available during a puzzle, so that I can reset whenever I notice I've made a mistake.
37. As a player, I want to leave a source unfired if I choose, so that I can identify and avoid decoy sources.

### Player — failure and recovery

38. As a player, I want hitting an anti-target to *not* end the level, so that I can keep playing and still get *Solved* even if I miss *Perfect*.
39. As a player, I want hitting an anti-target to show a small dim "sad flutter" on the trap tile, so that I notice without being scolded.
40. As a player, I want the level to gently surface a *Retry* affordance when I've fired all my sources and haven't solved, so that I'm offered a clean restart.
41. As a player, I want sources and targets to dim when I run out of moves, so that the visual signals "this attempt is over" without judgmental copy.
42. As a player, I want fail copy to be neutral ("Try a different order?") rather than punishing, so that I'm not shamed for experimenting.
43. As a player, I do *not* want the game to detect mid-puzzle that I've made an irrecoverable mistake, so that I'm not interrupted with parental "you're stuck" messaging.
44. As a player, I want full restart to be the only undo, so that each move is deliberate and the puzzle's order-mattering mechanic stays meaningful.

### Player — accessibility

45. As a colourblind player, I want each colour to also carry a distinct shape or symbol on sources, targets, and beams, so that I can identify colours without relying on hue.
46. As a colourblind player, I want the game's palette to use a deuteranopia-safe colour set by default, so that I don't have to dig through settings to play.
47. As a player, I want a motion-reduction setting that snaps animations to completion instantly, so that I can play if I'm sensitive to animated motion.
48. As a player, I want all text to respect Dynamic Type, so that I can play comfortably with my preferred system font size.
49. As a low-vision player, I want VoiceOver to navigate menus correctly, so that I can at least access settings and menus without sight.

### Player — settings and persistence

50. As a player, I want settings to be accessible from the campaign map but not from inside a puzzle, so that the in-puzzle UI stays distraction-free.
51. As a player, I want a sound-on/off toggle, so that I can play silently when needed.
52. As a player, I want a haptics-on/off toggle, so that I can disable vibration when undesired.
53. As a player, I want a preview-on/off toggle, so that I can choose harder play.
54. As a player, I want a *Reset all progress* button buried behind a confirmation dialog, so that I can wipe my save without it being a one-tap accident.
55. As a player, I want my campaign progress to persist across app launches, so that I never lose my place.
56. As a player, I do *not* want to be asked to create an account, sign in, or link to social services, so that I can just play.
57. As a player, I want my best tier per campaign puzzle to be saved (Solved / Perfect / My solution too), so that my progression is recorded.

### Designer (Matt) — procgen workflow

58. As the designer, I want a CLI command that generates N puzzles at a target difficulty tier and writes them to a draft JSON file, so that I can produce playtest material on demand.
59. As the designer, I want each generated puzzle to be guaranteed solvable at generation time, so that I never playtest a broken puzzle.
60. As the designer, I want each generated puzzle to be tagged with its elegant canonical solution and difficulty score, so that the game can reference these without recomputing.
61. As the designer, I want a playtest harness inside the app that loads a draft JSON file and lets me play any puzzle in it, so that I can evaluate generated puzzles in their natural medium.
62. As the designer, I want the playtest harness to capture per-puzzle ratings (keep / drop / too-easy / too-hard / good-for-tutorial) into a feedback file, so that I record judgments without context-switching to a notes app.
63. As the designer, I want a CLI command that culls a draft pack to only the kept puzzles based on my feedback, so that the final shipped pack reflects my decisions.
64. As the designer, I want to tune procgen difficulty weights via a config file, so that I can recalibrate without editing source code.
65. As the designer, I want to never edit puzzle JSON by hand, so that the data pipeline is the single source of truth for puzzle definitions.

### Designer — campaign assembly

66. As the designer, I want to select 61 puzzles from procgen output and assign each to a ring + position in the campaign, so that I curate the player's progression from generated material.
67. As the designer, I want the campaign assembly tool to enforce ring-mechanic constraints (e.g. ring 0 must be a single-source single-target puzzle), so that I can't accidentally place a complex puzzle in a teach-slot.
68. As the designer, I want to be able to hand-author teach puzzles as an escape hatch when procgen can't deliver minimal first-encounter puzzles for a mechanic, so that I'm never blocked.
69. As the designer, I want the final campaign and infinite-mode JSON to be committed to git and bundled into the app at build time, so that no runtime puzzle generation runs on player devices.

## Implementation Decisions

### Repo shape

- **CozyHex is a standalone repository** at `MMercieca/CozyHex`. It happens to live inside the `alien-tech` directory tree on disk for working-set convenience, but is independent for source-control purposes (its own git history, its own remote). No coupling to the `alien-tech` umbrella's React Native setup.
- **Bare React Native** (matching the structural precedent of sibling projects `Rivers`, `RotationTech`, `SlidingTech` within `alien-tech`), not Expo.
- Engine code, procgen code, and app UI all live within this single repository. Pure-TS engine and CLI procgen are separate top-level concerns inside it; no nested monorepo.

### Deep modules (testable in isolation)

The simulation/algorithmic core breaks into five **deep modules** with simple interfaces and complex internals:

1. **Hex grid math.** Pure functions over axial coordinates `(q, r)`: neighbours, direction vectors, distance, board membership predicate (within radius R), board enumeration. No state, no side effects.

2. **Beam simulator.** Single function: given a `Puzzle` and an ordered list of `firings` (which sources fire, in what order), return a `SimulationResult` containing the final per-cell paint state, the set of targets hit (and their final colour), the set of anti-targets painted, and a flag indicating whether the simulation stopped because of F1 (sources exhausted). **This is the load-bearing module.** Both the runtime app and procgen validation use it identically. There is exactly one beam-propagation implementation in the codebase.

3. **Solver.** Given a `Puzzle`, return a `SolverResult` containing: whether the puzzle is solvable; the elegant canonical firing sequence (shortest, with symmetry tiebreak); the count of distinct valid solutions; whether the elegant solution is unique up to ordering. Internally performs BFS over firing subsets, pruning branches longer than the current best.

4. **Procgen generator.** Given parameters (target tier, board radius, mechanic flags, RNG seed), return a generated `Puzzle` that has been validated by the Solver. Internally combines backward construction (build solution skeleton first) with forward decoration (add decoys, anti-targets, additional prisms; reject if Solver disagrees with intended elegant solution).

5. **Difficulty scorer.** Given a `Puzzle` and its `SolverResult`, return a numeric score and a tier bin (Easy / Medium / Hard / Expert). Pure function over puzzle features and solver-derived statistics.

### Shallow modules (integration / I/O)

Identified for completeness; not test priorities:

- **Puzzle schema (de)serializer.** JSON ⇄ typed `Puzzle`. Trivial; barely a module.
- **Render layer.** React component consuming engine state and producing Skia visuals (hex grid, beams, blooms, prism flares, tier badges). Coupled to RN/Skia.
- **Game state machine.** Manages the player's current puzzle, firing history, restart, fail-detection, tier evaluation. Coupled to React.
- **Persistence.** Wraps AsyncStorage (or MMKV) with typed get/set for campaign progress, infinite cumulative, settings, onboarding flags. Trivial.
- **CLI runner.** Argparse, file IO, glue around the procgen generator and solver. Trivial.

### Schema

Puzzles are plain JSON objects matching this shape:

- `id` — string identifier.
- `boardRadius` — integer R in {2, 3, 4}; cells = 1 + 3R(R+1).
- `palette` — array of colour identifiers used in this puzzle (subset of the four-colour global palette).
- `sources` — array of objects, each with axial `cell` `[q, r]`, `color`, and `direction` (one of E, NE, NW, W, SW, SE).
- `targets` — array of objects, each with axial `cell` and required `requires` colour.
- `antiTargets` — array of objects, each with axial `cell` (no required colour; any paint is wrong).
- `prisms` — array of objects, each with axial `cell`, type tag (P-bend or P-split), and orientation/bend angle.
- `canonicalSolution` — object containing the elegant firing sequence (`firings`: ordered list of `sourceIndex` references) and `length`.
- `difficulty` — object containing `tier` and procgen-computed `score`.

Per-colour budgets are *implied* by the count of sources of each colour; no explicit budget field.

### Architectural decisions

- **Single simulation source of truth.** The Beam simulator module is imported by both the runtime app and the procgen validator. There is no parallel implementation. This is the single most important architectural invariant.
- **Puzzles ship pre-generated.** Procgen runs at dev-time; output JSON is committed to the repo and bundled into the app binary. No runtime puzzle generation on player devices in v1.
- **Subset-firing is first-class.** The Solver searches over *subsets* of sources, not just permutations. The runtime app's win-detection auto-checks after every firing; firing all sources is never required.
- **Auto-check, not submit.** The instant all targets match their required colour, the level resolves. There is no submit button, no "are you sure" confirmation.
- **F1 (sources exhausted) is the only auto-detected fail mode.** F2 (mid-puzzle irrecoverable) is detectable but intentionally not surfaced, to preserve a non-parental tone.
- **Full reset is the only undo.** No step-back undo. Pre-commit preview is the safety; post-commit reset is the recovery. This protects the order-mattering mechanic from being trivialised by trial-and-error search.
- **Monetization-gating is reserved but not implemented.** A single boolean `infiniteModeUnlocked` exists in the persistence layer, defaulted to true for v1. IAP wiring is not built. The game is functionally premium-everything-included until a monetization decision is made.
- **Colourblind accessibility is a generation-time invariant.** Procgen does not produce any puzzle that requires hue-discrimination to solve. Every colour is rendered with a distinct shape/symbol secondary channel. P-combine prisms (which would require colour blending) are excluded permanently.
- **Tile rotation is excluded as a mechanic.** Rivers and RotationTech already explore rotation; CozyHex deliberately uses non-rotation mechanics. This is a positive design constraint, not an oversight.

### API contracts (between modules)

- Beam simulator: `(Puzzle, Firings) → SimulationResult`. Pure. Deterministic given inputs. No I/O.
- Solver: `Puzzle → SolverResult`. Pure. Deterministic. Internally calls Beam simulator; accepts a budget cap to prevent runaway BFS on pathological inputs.
- Procgen generator: `(GeneratorParams, RNGSeed) → Puzzle`. Deterministic given the seed. Internally calls Solver to validate. May reject and retry up to a bounded number of times.
- Difficulty scorer: `(Puzzle, SolverResult) → DifficultyScore`. Pure.
- CLI runner orchestrates: invoke generator with seed → invoke solver to validate → invoke scorer to bin → write JSON.
- Render layer subscribes to game state machine; never calls the simulator directly; receives pre-computed `SimulationResult` for animation playback.

### Specific interactions

- **Tap-and-hold preview**: long-press over a source for ≥250ms shows a ghost beam tracing the path the beam *would* take from current state. Releasing while still over the source completes the gesture as a preview-then-cancel; releasing outside the source (anywhere else on the board) cancels. A separate quick tap (<250ms) on a source commits a firing.
- **Animation interruption**: tapping the board (not a source) during a running animation snaps the animation to its end state. Tapping a source after that fires it.
- **Mechanic-introducing campaign puzzles**: the first puzzle in each ring containing a new mechanic is procgen-generated under tight constraints to ensure the new mechanic is the *only* novel element relative to prior rings.
- **Decoy sources**: Procgen may include sources whose firing makes the puzzle unsolvable. The elegant canonical solution leaves them unfired.
- **Three-tier outcome**: evaluated on every state change. "Perfect" requires zero anti-targets painted. "My solution too" requires the painted-cell set to match the canonical-solution painted-cell set bit-for-bit at solve time.

## Testing Decisions

### What makes a good test (for this project)

- **Tests describe externally-observable behaviour, not internal implementation.** Test that a beam fired from `(-2, 0)` going E paints `[(-1,0), (0,0), (1,0)]` and stops at the target on `(2,0)`. Don't test that the simulator uses BFS internally, or which order it visits cells in.
- **Tests are deterministic.** Procgen tests use fixed RNG seeds. No flaky "sometimes this generates a hard puzzle" assertions.
- **Tests are pure-TS.** They don't touch the React Native runtime, Skia, or the device. They run under Jest with the existing umbrella's preset.
- **Acceptance tests use hand-constructed sample puzzles** (like RotationTech's `tier3Sample.test.ts`). The Decoy puzzle (`DESIGN.md` §14) is the canonical Phase-0 sample.
- **Property-style tests for procgen** assert invariants (every generated puzzle is solvable per the Solver; every generated puzzle's claimed difficulty tier matches the Scorer's bin) rather than asserting specific outputs.

### Modules with required test coverage

All four deep simulation/algorithmic modules ship with substantial unit-test coverage in v1:

1. **Hex grid math.** Tests for axial-coord neighbours, direction enumeration, distance computation, board-membership predicate at radii 2/3/4. Acceptance test: enumerated cells of a radius-2 board match the canonical 19-cell set.
2. **Beam simulator.** Unit tests per propagation rule (paint-on-pass, stop-on-painted, stop-on-target, edge-exit, prism-redirect, atomic painting). Acceptance test: simulate The Decoy puzzle with each of the six possible firing orderings (subset and full) and verify the expected `SimulationResult` for each.
3. **Solver.** Unit tests for: detecting solvable vs unsolvable puzzles; finding the shortest solution; symmetry tiebreak between equally-short solutions; counting alternate solutions correctly. Acceptance test: solve The Decoy and confirm canonical = `[R₂, B]` of length 2 with `R₁` excluded.
4. **Procgen generator + difficulty scorer.** Property-style tests: for a fixed RNG seed, the generator produces a specific puzzle (regression-test); for any generated puzzle, the Solver agrees it is solvable; the Scorer's tier bin matches the parameter request within a tolerance band.

Shallow modules (render layer, state machine, persistence, CLI) are exercised through integration paths or smoke tests, not exhaustively unit-tested.

### Prior art

`RotationTech/__tests__/engine.test.ts` is the closest precedent: pure-TS unit tests over an engine module (`pieces.ts`, `powerFlow.ts`, `signalFlow.ts`) without RN runtime dependencies. `RotationTech/__tests__/tier3Sample.test.ts` demonstrates the hand-constructed-sample acceptance pattern (Tier 3 sample level is the test fixture; the test verifies the spec's claimed perfect-solve sequence wins). Both patterns transfer directly to CozyHex.

The Decoy puzzle (DESIGN.md §14) plays the role of RotationTech's Tier 3 sample: a hand-constructed fixture that exercises every primitive and serves as an executable contract for the simulator and solver.

## Out of Scope

The following are **not** in v1 and are deferred (some indefinitely):

- Player-chosen firing direction (sources have fixed directions in v1).
- Edge-wrap (toroidal beams).
- Pass-through targets (beams continue past) and reflecting targets.
- Cover-the-board goal type / alternative puzzle modes.
- Daily puzzle.
- Leaderboards, social sharing, "challenge a friend" features.
- iCloud sync of progress.
- Android port.
- IAP / monetization wiring (gating boolean exists; transaction layer does not).
- In-app store / cosmetics / themes.
- Music. (Soft per-action sounds and ambient bed only.)
- Localization. (English-only at launch; minimal text content makes deferral cheap.)
- Push notifications.
- P-combine prisms (excluded permanently — colourblind incompatible).
- Tile rotation as a mechanic (excluded permanently — overlaps Rivers / RotationTech).
- Ads of any kind (excluded permanently — cozy-incompatible).
- Account creation / sign-in (excluded permanently — friction-incompatible).
- Step-back undo (full reset is the only undo).
- Mid-puzzle F2 detection (player figures out and retries voluntarily).
- Hand-authored campaign puzzles (assumed zero; escape hatch only if procgen can't deliver minimal teach-puzzles).
- Runtime procgen on device (D2 model deferred indefinitely; v1 ships a frozen ~5,000-puzzle pack in the binary).

## Further Notes

### Phasing

Build phases are documented in `DESIGN.md` §15. Summary:

- **Phase 0** — shared engine (hex math, simulator, target/trap eval), unit-tested. Render The Decoy as a static visualisation as the first concrete deliverable, before code commits to the schema.
- **Phase 1** — procgen CLI (generator, solver, scorer). Validate every output with the brute-force Solver.
- **Phase 2** — minimal RN playtest harness. Loads JSON puzzle packs; supports tap-to-fire, tap-and-hold-preview, tier badge.
- **Phase 3** — calibration loop (generate → play → rate → tune weights → regenerate). Most of the *design* happens here; budget 4–8 weeks elapsed.
- **Phase 4** — campaign curation (overlaps Phase 3).
- **Phase 5** — generate ~5,000 infinite-mode puzzles with locked weights. Commit.
- **Phase 6** — app polish (welcome, campaign hex map UI, settings, sound, haptics, animation, splash, app icon).
- **Phase 7** — TestFlight beta.
- **Phase 8** — launch.

### Risks called out by the design

1. **Phase 3 is design, not tuning.** It will take longer than expected; resist skimming.
2. **Procgen for order-mattering puzzles is not trivial.** Many natural-feeling layouts are unsolvable. The Solver-as-validator must run on every generated output; never skip validation.
3. **The decoy mechanic is load-bearing.** Validate decoys feel right early in playtest.
4. **RN + Skia performance on lower-end devices** must be profiled by end of Phase 2 on the oldest target device.
5. **Hand-authored teach puzzles may be needed.** Assume zero; have an escape hatch.

### Things to revisit if playtest surprises us

- Step-back undo (we chose full-reset; might soften).
- F2 auto-detection (we chose not to; might add a "stuck?" affordance).
- Hint persistence in early levels (gesture-gated; may need timer fallback).
- Hand-authored count (zero assumed; iterate).

### Publication note

This PRD is published to the `MMercieca/CozyHex` GitHub repository as an issue with the `needs-triage` label. The Markdown source remains in the repo at `PRD.md` for editability; the issue is the canonical tracker entry that enters the normal triage flow.
