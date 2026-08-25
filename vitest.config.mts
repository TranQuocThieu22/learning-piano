import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Để test import được bằng alias `@/...` như code ứng dụng. Vite hỗ trợ sẵn,
  // không cần plugin vite-tsconfig-paths.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
