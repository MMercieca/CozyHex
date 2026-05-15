import {type Cell, type Direction, isInBoard} from './hex';

export type Colour = string;

export type Source = {
  readonly cell: Cell;
  readonly color: Colour;
  readonly direction: Direction;
};

export type Target = {
  readonly cell: Cell;
  readonly requires: Colour;
};

export type AntiTarget = {
  readonly cell: Cell;
};

export type PrismBend = {
  readonly type: 'bend';
  readonly cell: Cell;
  readonly turns: number; // 60° increments; positive = clockwise
};

export type PrismSplit = {
  readonly type: 'split';
  readonly cell: Cell;
  readonly orientation: Direction;
};

export type Prism = PrismBend | PrismSplit;

export type Firing = {
  readonly sourceIndex: number;
};

export type CanonicalSolution = {
  readonly firings: readonly Firing[];
  readonly length: number;
};

export type DifficultyTier = 'easy' | 'medium' | 'hard';

export type Difficulty = {
  readonly tier: DifficultyTier;
  readonly score: number;
};

export type Puzzle = {
  readonly id: string;
  readonly boardRadius: number;
  readonly palette: readonly Colour[];
  readonly sources: readonly Source[];
  readonly targets: readonly Target[];
  readonly antiTargets: readonly AntiTarget[];
  readonly prisms: readonly Prism[];
  readonly canonicalSolution: CanonicalSolution;
  readonly difficulty: Difficulty;
};

// --- Validation helpers ---

const VALID_DIRECTIONS = new Set<string>(['E', 'NE', 'NW', 'W', 'SW', 'SE']);
const VALID_TIERS = new Set<string>(['easy', 'medium', 'hard']);

function fail(msg: string): never {
  throw new Error(`Invalid puzzle: ${msg}`);
}

function requireString(val: unknown, field: string): string {
  if (typeof val !== 'string' || val.length === 0) fail(`${field} must be a non-empty string`);
  return val as string;
}

function requireNumber(val: unknown, field: string): number {
  if (typeof val !== 'number' || !isFinite(val)) fail(`${field} must be a finite number`);
  return val as number;
}

function requireInteger(val: unknown, field: string): number {
  const n = requireNumber(val, field);
  if (!Number.isInteger(n)) fail(`${field} must be an integer`);
  return n;
}

function requireArray(val: unknown, field: string): unknown[] {
  if (!Array.isArray(val)) fail(`${field} must be an array`);
  return val;
}

function requireObject(val: unknown, field: string): Record<string, unknown> {
  if (val === null || typeof val !== 'object' || Array.isArray(val))
    fail(`${field} must be an object`);
  return val as Record<string, unknown>;
}

function parseCell(val: unknown, field: string, radius: number): Cell {
  const arr = requireArray(val, field);
  if (arr.length !== 2) fail(`${field} must be [q, r] with exactly 2 elements`);
  const q = requireInteger(arr[0], `${field}[0]`);
  const r = requireInteger(arr[1], `${field}[1]`);
  if (!isInBoard({q, r}, radius)) fail(`${field} [${q}, ${r}] is out of board bounds (radius ${radius})`);
  return {q, r};
}

function parseDirection(val: unknown, field: string): Direction {
  const s = requireString(val, field);
  if (!VALID_DIRECTIONS.has(s)) fail(`${field} must be one of E|NE|NW|W|SW|SE, got "${s}"`);
  return s as Direction;
}

function parseColour(val: unknown, field: string, palette: readonly Colour[]): Colour {
  const s = requireString(val, field);
  if (!palette.includes(s)) fail(`${field} colour "${s}" is not in palette [${palette.join(', ')}]`);
  return s;
}

function parseSource(raw: unknown, index: number, radius: number, palette: readonly Colour[]): Source {
  const obj = requireObject(raw, `sources[${index}]`);
  return {
    cell: parseCell(obj.cell, `sources[${index}].cell`, radius),
    color: parseColour(obj.color, `sources[${index}].color`, palette),
    direction: parseDirection(obj.direction, `sources[${index}].direction`),
  };
}

function parseTarget(raw: unknown, index: number, radius: number, palette: readonly Colour[]): Target {
  const obj = requireObject(raw, `targets[${index}]`);
  return {
    cell: parseCell(obj.cell, `targets[${index}].cell`, radius),
    requires: parseColour(obj.requires, `targets[${index}].requires`, palette),
  };
}

function parseAntiTarget(raw: unknown, index: number, radius: number): AntiTarget {
  const obj = requireObject(raw, `antiTargets[${index}]`);
  return {
    cell: parseCell(obj.cell, `antiTargets[${index}].cell`, radius),
  };
}

function parsePrism(raw: unknown, index: number, radius: number): Prism {
  const obj = requireObject(raw, `prisms[${index}]`);
  const type = requireString(obj.type, `prisms[${index}].type`);
  const cell = parseCell(obj.cell, `prisms[${index}].cell`, radius);
  if (type === 'bend') {
    const turns = requireInteger(obj.turns, `prisms[${index}].turns`);
    return {type: 'bend', cell, turns};
  }
  if (type === 'split') {
    const orientation = parseDirection(obj.orientation, `prisms[${index}].orientation`);
    return {type: 'split', cell, orientation};
  }
  return fail(`prisms[${index}].type must be "bend" or "split", got "${type}"`);
}

function parseCanonicalSolution(raw: unknown, sourceCount: number): CanonicalSolution {
  const obj = requireObject(raw, 'canonicalSolution');
  const firingsRaw = requireArray(obj.firings, 'canonicalSolution.firings');
  const firings: Firing[] = firingsRaw.map((f, i) => {
    const fo = requireObject(f, `canonicalSolution.firings[${i}]`);
    const sourceIndex = requireInteger(fo.sourceIndex, `canonicalSolution.firings[${i}].sourceIndex`);
    if (sourceIndex < 0 || sourceIndex >= sourceCount)
      fail(`canonicalSolution.firings[${i}].sourceIndex ${sourceIndex} out of range (sources length ${sourceCount})`);
    return {sourceIndex};
  });
  const length = requireInteger(obj.length, 'canonicalSolution.length');
  if (length !== firings.length)
    fail(`canonicalSolution.length (${length}) does not match firings array length (${firings.length})`);
  return {firings, length};
}

function parseDifficulty(raw: unknown): Difficulty {
  const obj = requireObject(raw, 'difficulty');
  const tier = requireString(obj.tier, 'difficulty.tier');
  if (!VALID_TIERS.has(tier)) fail(`difficulty.tier must be "easy", "medium", or "hard", got "${tier}"`);
  const score = requireNumber(obj.score, 'difficulty.score');
  return {tier: tier as DifficultyTier, score};
}

// --- Public API ---

export function deserializePuzzle(json: unknown): Puzzle {
  const obj = requireObject(json, 'puzzle');

  const id = requireString(obj.id, 'id');
  const boardRadius = requireInteger(obj.boardRadius, 'boardRadius');
  if (boardRadius < 1) fail(`boardRadius must be >= 1, got ${boardRadius}`);

  const paletteRaw = requireArray(obj.palette, 'palette');
  if (paletteRaw.length === 0) fail('palette must not be empty');
  const palette = paletteRaw.map((c, i) => requireString(c, `palette[${i}]`));

  const sources = requireArray(obj.sources, 'sources').map((s, i) =>
    parseSource(s, i, boardRadius, palette),
  );
  const targets = requireArray(obj.targets, 'targets').map((t, i) =>
    parseTarget(t, i, boardRadius, palette),
  );
  const antiTargets = requireArray(obj.antiTargets, 'antiTargets').map((a, i) =>
    parseAntiTarget(a, i, boardRadius),
  );
  const prisms = requireArray(obj.prisms, 'prisms').map((p, i) =>
    parsePrism(p, i, boardRadius),
  );
  const canonicalSolution = parseCanonicalSolution(obj.canonicalSolution, sources.length);
  const difficulty = parseDifficulty(obj.difficulty);

  return {id, boardRadius, palette, sources, targets, antiTargets, prisms, canonicalSolution, difficulty};
}

export function serializePuzzle(puzzle: Puzzle): unknown {
  return {
    id: puzzle.id,
    boardRadius: puzzle.boardRadius,
    palette: [...puzzle.palette],
    sources: puzzle.sources.map(s => ({cell: [s.cell.q, s.cell.r], color: s.color, direction: s.direction})),
    targets: puzzle.targets.map(t => ({cell: [t.cell.q, t.cell.r], requires: t.requires})),
    antiTargets: puzzle.antiTargets.map(a => ({cell: [a.cell.q, a.cell.r]})),
    prisms: puzzle.prisms.map(p =>
      p.type === 'bend'
        ? {type: 'bend', cell: [p.cell.q, p.cell.r], turns: p.turns}
        : {type: 'split', cell: [p.cell.q, p.cell.r], orientation: p.orientation},
    ),
    canonicalSolution: {
      firings: puzzle.canonicalSolution.firings.map(f => ({sourceIndex: f.sourceIndex})),
      length: puzzle.canonicalSolution.length,
    },
    difficulty: {tier: puzzle.difficulty.tier, score: puzzle.difficulty.score},
  };
}
