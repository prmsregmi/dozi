import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dozi/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@dozi/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
      '@dozi/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 3000,
  },
});
