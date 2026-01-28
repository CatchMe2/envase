import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    include: ['./src/**/*.test.ts'],
    exclude: [],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
    typecheck: {
      include: ['./src/**/*.test.ts'],
    },
  },
});
