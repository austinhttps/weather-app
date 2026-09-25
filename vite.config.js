import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true
  },
  server: {
    port: 3000,
    open: true
  }
});
