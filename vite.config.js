/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [react()],
  server: {
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.js'],
    include: ['src/**/*.test.{js,ts,jsx,tsx}', 'src/**/__tests__/**'],
    exclude: ['e2e/**', 'backend/**', 'node_modules/**'],
  },
});
