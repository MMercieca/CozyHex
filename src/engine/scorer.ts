import {type DifficultyTier, type Puzzle} from './puzzle';
import {type SolverResult} from './solver';
import {WEIGHTS, TIER_THRESHOLDS} from './scorer-weights';

export type ScoreResult = {
  score: number;
  tier: DifficultyTier;
};

function tierFromScore(score: number): DifficultyTier {
  if (score >= TIER_THRESHOLDS.expert) return 'expert';
  if (score >= TIER_THRESHOLDS.hard) return 'hard';
  if (score >= TIER_THRESHOLDS.medium) return 'medium';
  return 'easy';
}

export function score(puzzle: Puzzle, solverResult: SolverResult): ScoreResult {
  if (!solverResult.solvable) throw new Error('Cannot score an unsolvable puzzle');

  const N = puzzle.sources.length;
  const K = solverResult.length;
  const prismCount = puzzle.prisms.length;
  const splitCount = puzzle.prisms.filter(p => p.type === 'split').length;
  const antiCount = puzzle.antiTargets.length;
  const solutionCount = Math.max(1, solverResult.alternateCount);

  const raw =
    WEIGHTS.N * N +
    WEIGHTS.K * K +
    WEIGHTS.prism * prismCount +
    WEIGHTS.split * splitCount +
    WEIGHTS.anti * antiCount -
    WEIGHTS.solutions * Math.log(solutionCount) +
    WEIGHTS.radius * puzzle.boardRadius;

  return {score: raw, tier: tierFromScore(raw)};
}
