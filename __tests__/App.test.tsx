/**
 * Smoke test: App is a function component.
 * Full render testing deferred until native mocks are set up for Skia/Reanimated/GestureHandler.
 */

import App from '../App';

test('App is a function component', () => {
  expect(typeof App).toBe('function');
});
