import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite config; for GitHub Pages you may want to set `base` to your repo name.
export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH || '/',
});


