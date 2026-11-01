// Render tests for React Native components require a native simulator or Expo Go.
// This file validates module resolution only — the render test lives in e2e.
describe('App module', () => {
  it('has correct package name', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../../package.json');
    expect(pkg.name).toBe('@orca/mobile');
  });
});
