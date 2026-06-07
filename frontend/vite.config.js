import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function readBackendOrigin() {
  const envPath = path.resolve(__dirname, '../.env');
  const fallbackOrigin = 'http://127.0.0.1:3008';

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const portMatch = envContent.match(/^PORT=(.+)$/m);
    const port = portMatch?.[1]?.trim().replace(/^['"]|['"]$/g, '');
    return port ? `http://127.0.0.1:${port}` : fallbackOrigin;
  } catch {
    return fallbackOrigin;
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: readBackendOrigin(), changeOrigin: true },
    },
  },
});
