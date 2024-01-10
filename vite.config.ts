import { fileURLToPath, URL } from 'node:url';
import CompressionPlugin from 'vite-plugin-compression';  // Import the plugin
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    CompressionPlugin({ algorithm: 'gzip' }),  // Add the plugin here
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
