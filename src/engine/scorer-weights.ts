// Initial weights for the difficulty scorer (DESIGN.md §7.2).
// Tuned empirically in Phase 3 against playtest difficulty labels.
export const WEIGHTS = {
  N: 0.5,          // source count
  K: 1.0,          // canonical solution length
  prism: 0.5,      // total prism count
  split: 0.5,      // split prisms (additive on top of prism weight)
  anti: 1.0,       // anti-target count
  solutions: 0.3,  // log(valid_solution_count) — subtracted (more solutions = easier)
  radius: 0.5,     // board radius
};

// Tier thresholds (inclusive lower bound). Scores below MEDIUM_MIN → easy.
export const TIER_THRESHOLDS = {
  medium: 5,
  hard: 9,
  expert: 13,
};
