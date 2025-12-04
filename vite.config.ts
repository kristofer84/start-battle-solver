import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Get git commit hash (short)
function getCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

// Get build time in yyyy-MM-dd HH:mm format
function getBuildTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Plugin to copy icons from src/static to public
function copyIconsPlugin(): { name: string; buildStart: () => void } {
  return {
    name: 'copy-icons',
    buildStart() {
      const publicDir = join(process.cwd(), 'public');
      const staticDir = join(process.cwd(), 'src', 'static');
      
      if (!existsSync(publicDir)) {
        mkdirSync(publicDir, { recursive: true });
      }
      
      const icons = ['logo.png', 'logo-192.png', 'logo-512.png'];
      icons.forEach(icon => {
        const src = join(staticDir, icon);
        const dest = join(publicDir, icon);
        if (existsSync(src)) {
          copyFileSync(src, dest);
        }
      });
    },
  };
}

// Vite config; for GitHub Pages you may want to set `base` to your repo name.
export default defineConfig({
  plugins: [vue(), copyIconsPlugin()],
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __COMMIT_HASH__: JSON.stringify(getCommitHash()),
    __BUILD_TIME__: JSON.stringify(getBuildTime()),
  },
});


