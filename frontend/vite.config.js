import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function injectServiceWorkerAssetsPlugin() {
  return {
    name: 'inject-sw-assets',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        const swPath = path.resolve(distDir, 'sw.js');
        const assetsDir = path.resolve(distDir, 'assets');
        
        if (!fs.existsSync(swPath) || !fs.existsSync(assetsDir)) {
          console.warn('[PWA Plugin] dist/sw.js or dist/assets not found, skipping SW asset injection.');
          return;
        }
        
        const assetFiles = fs.readdirSync(assetsDir)
          .filter(f => f.endsWith('.js') || f.endsWith('.css'))
          .map(f => `/assets/${f}`);
        
        let swContent = fs.readFileSync(swPath, 'utf-8');
        
        swContent = swContent.replace(
          /const STATIC_ASSETS = \[([\s\S]*?)\];/,
          (match, inner) => {
            const existing = inner
              .split(',')
              .map(s => s.trim().replace(/['"]/g, ''))
              .filter(Boolean);
            const combined = Array.from(new Set([...existing, ...assetFiles]));
            return `const STATIC_ASSETS = ${JSON.stringify(combined, null, 2)};`;
          }
        );
        
        fs.writeFileSync(swPath, swContent, 'utf-8');
        console.log(`[PWA Plugin] ✅ Successfully injected ${assetFiles.length} Vite production assets into dist/sw.js`);
      } catch (err) {
        console.error('[PWA Plugin] Error injecting assets into sw.js:', err);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectServiceWorkerAssetsPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
