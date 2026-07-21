import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,mjs}'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['tests/setup/vitest.setup.js'],
    environment: 'node',
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      include: [
        'js/state.js', 'js/storage.js', 'js/themes.js', 'js/utilities.js',
        'components/*.js'
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70
      }
    }
  }
});
