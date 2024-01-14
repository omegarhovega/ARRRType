import { fileURLToPath, URL } from 'node:url';
import CompressionPlugin from 'vite-plugin-compression';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

//https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue(),
      CompressionPlugin({ algorithm: 'gzip' }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
});
