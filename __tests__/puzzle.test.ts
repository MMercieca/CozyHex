import {deserializePuzzle, serializePuzzle} from '../src/engine/puzzle';
import theDecoy from '../src/engine/fixtures/the-decoy.json';

describe('puzzle schema', () => {
  describe('The Decoy fixture', () => {
    it('parses without errors', () => {
      expect(() => deserializePuzzle(theDecoy)).not.toThrow();
    });

    it('round-trips losslessly', () => {
      const puzzle = deserializePuzzle(theDecoy);
      const serialized = serializePuzzle(puzzle);
      expect(serialized).toEqual(theDecoy);
    });

    it('has the expected structure', () => {
      const puzzle = deserializePuzzle(theDecoy);
      expect(puzzle.id).toBe('sample-decoy-001');
      expect(puzzle.boardRadius).toBe(2);
      expect(puzzle.palette).toEqual(['red', 'blue']);
      expect(puzzle.sources).toHaveLength(3);
      expect(puzzle.targets).toHaveLength(2);
      expect(puzzle.antiTargets).toHaveLength(0);
      expect(puzzle.prisms).toHaveLength(0);
      expect(puzzle.canonicalSolution.length).toBe(2);
      expect(puzzle.canonicalSolution.firings).toEqual([{sourceIndex: 1}, {sourceIndex: 0}]);
      expect(puzzle.difficulty.tier).toBe('easy');
    });
  });

  describe('validation rejects', () => {
    const valid = {
      id: 'test-001',
      boardRadius: 2,
      palette: ['red'],
      sources: [{cell: [0, 0], color: 'red', direction: 'E'}],
      targets: [{cell: [1, 0], requires: 'red'}],
      antiTargets: [],
      prisms: [],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
      difficulty: {tier: 'easy', score: 1.0},
    };

    it('missing required field (id)', () => {
      const {id: _id, ...rest} = valid;
      expect(() => deserializePuzzle(rest)).toThrow(/id must be a non-empty string/);
    });

    it('missing required field (boardRadius)', () => {
      const {boardRadius: _r, ...rest} = valid;
      expect(() => deserializePuzzle(rest)).toThrow(/boardRadius/);
    });

    it('invalid colour in sources (not in palette)', () => {
      const bad = {...valid, sources: [{cell: [0, 0], color: 'blue', direction: 'E'}]};
      expect(() => deserializePuzzle(bad)).toThrow(/colour "blue" is not in palette/);
    });

    it('invalid colour in targets (not in palette)', () => {
      const bad = {...valid, targets: [{cell: [1, 0], requires: 'green'}]};
      expect(() => deserializePuzzle(bad)).toThrow(/colour "green" is not in palette/);
    });

    it('out-of-bounds axial coordinate in source', () => {
      const bad = {...valid, sources: [{cell: [5, 5], color: 'red', direction: 'E'}]};
      expect(() => deserializePuzzle(bad)).toThrow(/out of board bounds/);
    });

    it('out-of-bounds axial coordinate in target', () => {
      const bad = {...valid, targets: [{cell: [3, 3], requires: 'red'}]};
      expect(() => deserializePuzzle(bad)).toThrow(/out of board bounds/);
    });

    it('invalid direction', () => {
      const bad = {...valid, sources: [{cell: [0, 0], color: 'red', direction: 'NORTH'}]};
      expect(() => deserializePuzzle(bad)).toThrow(/must be one of E\|NE\|NW\|W\|SW\|SE/);
    });

    it('canonicalSolution sourceIndex out of range', () => {
      const bad = {...valid, canonicalSolution: {firings: [{sourceIndex: 5}], length: 1}};
      expect(() => deserializePuzzle(bad)).toThrow(/sourceIndex 5 out of range/);
    });

    it('canonicalSolution length mismatch', () => {
      const bad = {...valid, canonicalSolution: {firings: [{sourceIndex: 0}], length: 99}};
      expect(() => deserializePuzzle(bad)).toThrow(/does not match firings array length/);
    });

    it('invalid difficulty tier', () => {
      const bad = {...valid, difficulty: {tier: 'legendary', score: 1.0}};
      expect(() => deserializePuzzle(bad)).toThrow(/difficulty\.tier must be/);
    });

    it('empty palette', () => {
      const bad = {...valid, palette: []};
      expect(() => deserializePuzzle(bad)).toThrow(/palette must not be empty/);
    });

    it('non-object input', () => {
      expect(() => deserializePuzzle('not-an-object')).toThrow(/puzzle must be an object/);
    });

    it('cell with wrong element count', () => {
      const bad = {...valid, sources: [{cell: [0], color: 'red', direction: 'E'}]};
      expect(() => deserializePuzzle(bad)).toThrow(/\[q, r\] with exactly 2 elements/);
    });
  });

  describe('prism parsing', () => {
    const base = {
      id: 'prism-test',
      boardRadius: 3,
      palette: ['red'],
      sources: [{cell: [0, 0], color: 'red', direction: 'E'}],
      targets: [{cell: [1, 0], requires: 'red'}],
      antiTargets: [],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
      difficulty: {tier: 'easy', score: 1.0},
    };

    it('accepts a valid P-bend prism', () => {
      const puzzle = deserializePuzzle({
        ...base,
        prisms: [{type: 'bend', cell: [2, 0], turns: 1}],
      });
      const prism = puzzle.prisms[0];
      expect(prism.type).toBe('bend');
      if (prism.type === 'bend') expect(prism.turns).toBe(1);
    });

    it('accepts a valid P-split prism', () => {
      const puzzle = deserializePuzzle({
        ...base,
        prisms: [{type: 'split', cell: [2, 0], orientation: 'NE'}],
      });
      const prism = puzzle.prisms[0];
      expect(prism.type).toBe('split');
      if (prism.type === 'split') expect(prism.orientation).toBe('NE');
    });

    it('rejects unknown prism type', () => {
      expect(() =>
        deserializePuzzle({...base, prisms: [{type: 'mirror', cell: [2, 0]}]}),
      ).toThrow(/must be "bend" or "split"/);
    });
  });
});
