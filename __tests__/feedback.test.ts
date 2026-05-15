import {
  deserializeFeedback,
  serializeFeedback,
  deserializeFeedbackPack,
  serializeFeedbackPack,
} from '../src/engine/feedback';

const VALID: Record<string, unknown> = {
  schemaVersion: 1,
  puzzleId: 'puzzle-abc',
  attempts: 3,
  totalTimeMs: 45000,
  difficulty: 4,
  ratedAtIso: '2026-05-15T12:00:00Z',
};

describe('deserializeFeedback / serializeFeedback', () => {
  test('round-trips a valid record losslessly', () => {
    const feedback = deserializeFeedback(VALID);
    expect(serializeFeedback(feedback)).toEqual(VALID);
  });

  test('rejects difficulty below 1', () => {
    expect(() => deserializeFeedback({...VALID, difficulty: 0})).toThrow('difficulty');
  });

  test('rejects difficulty above 7', () => {
    expect(() => deserializeFeedback({...VALID, difficulty: 8})).toThrow('difficulty');
  });

  test('rejects attempts < 1', () => {
    expect(() => deserializeFeedback({...VALID, attempts: 0})).toThrow('attempts');
  });

  test('rejects negative totalTimeMs', () => {
    expect(() => deserializeFeedback({...VALID, totalTimeMs: -1})).toThrow('totalTimeMs');
  });

  test('rejects missing puzzleId', () => {
    const {puzzleId: _, ...rest} = VALID;
    expect(() => deserializeFeedback(rest)).toThrow('puzzleId');
  });

  test('rejects missing ratedAtIso', () => {
    const {ratedAtIso: _, ...rest} = VALID;
    expect(() => deserializeFeedback(rest)).toThrow('ratedAtIso');
  });

  test('rejects malformed ratedAtIso', () => {
    expect(() => deserializeFeedback({...VALID, ratedAtIso: 'not-a-date'})).toThrow('ratedAtIso');
  });

  test('rejects non-integer attempts', () => {
    expect(() => deserializeFeedback({...VALID, attempts: 1.5})).toThrow('attempts');
  });
});

describe('deserializeFeedbackPack / serializeFeedbackPack', () => {
  test('round-trips a valid pack losslessly', () => {
    const pack = {schemaVersion: 1, records: [VALID, {...VALID, puzzleId: 'puzzle-xyz', difficulty: 7}]};
    const deserialized = deserializeFeedbackPack(pack);
    expect(serializeFeedbackPack(deserialized)).toEqual(pack);
  });

  test('rejects a pack with an invalid record', () => {
    const pack = {schemaVersion: 1, records: [{...VALID, difficulty: 0}]};
    expect(() => deserializeFeedbackPack(pack)).toThrow();
  });
});
