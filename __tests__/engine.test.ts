/**
 * Engine smoke tests. Pure TypeScript — no React Native runtime.
 * If the engine ever imports an RN package this suite will throw at import time.
 */

import * as engine from '../src/engine/index';

describe('engine', () => {
  it('imports without booting the RN runtime', () => {
    expect(engine).toBeDefined();
  });
});
