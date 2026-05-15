export type PlaytestFeedback = {
  readonly schemaVersion: number;
  readonly puzzleId: string;
  readonly attempts: number;
  readonly totalTimeMs: number;
  readonly difficulty: number;
  readonly ratedAtIso: string;
};

export type FeedbackPack = {
  readonly schemaVersion: number;
  readonly records: readonly PlaytestFeedback[];
};

// --- Validation helpers ---

function fail(msg: string): never {
  throw new Error(`Invalid feedback: ${msg}`);
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

const ISO_8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function requireIso8601(val: unknown, field: string): string {
  const s = requireString(val, field);
  if (!ISO_8601_RE.test(s) || isNaN(Date.parse(s))) fail(`${field} must be a valid ISO 8601 datetime`);
  return s;
}

// --- Public API ---

export function deserializeFeedback(json: unknown): PlaytestFeedback {
  const obj = requireObject(json, 'PlaytestFeedback');

  const schemaVersion = requireInteger(obj.schemaVersion, 'schemaVersion');
  const puzzleId = requireString(obj.puzzleId, 'puzzleId');
  const attempts = requireInteger(obj.attempts, 'attempts');
  if (attempts < 1) fail('attempts must be >= 1');
  const totalTimeMs = requireInteger(obj.totalTimeMs, 'totalTimeMs');
  if (totalTimeMs < 0) fail('totalTimeMs must be >= 0');
  const difficulty = requireInteger(obj.difficulty, 'difficulty');
  if (difficulty < 1 || difficulty > 7) fail('difficulty must be between 1 and 7');
  const ratedAtIso = requireIso8601(obj.ratedAtIso, 'ratedAtIso');

  return {schemaVersion, puzzleId, attempts, totalTimeMs, difficulty, ratedAtIso};
}

export function serializeFeedback(f: PlaytestFeedback): unknown {
  return {
    schemaVersion: f.schemaVersion,
    puzzleId: f.puzzleId,
    attempts: f.attempts,
    totalTimeMs: f.totalTimeMs,
    difficulty: f.difficulty,
    ratedAtIso: f.ratedAtIso,
  };
}

export function deserializeFeedbackPack(json: unknown): FeedbackPack {
  const obj = requireObject(json, 'FeedbackPack');
  const schemaVersion = requireInteger(obj.schemaVersion, 'schemaVersion');
  const recordsRaw = requireArray(obj.records, 'records');
  const records = recordsRaw.map((r, i) => {
    try {
      return deserializeFeedback(r);
    } catch (e) {
      throw new Error(`Invalid feedback: records[${i}]: ${(e as Error).message}`);
    }
  });
  return {schemaVersion, records};
}

export function serializeFeedbackPack(pack: FeedbackPack): unknown {
  return {
    schemaVersion: pack.schemaVersion,
    records: pack.records.map(serializeFeedback),
  };
}
