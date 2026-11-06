import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import express from 'express';
import { travelRouter } from './server/routes.ts';

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-middleware',
    configureServer(server) {
      const app = express();
      app.use(express.json({ limit: '10mb' }));
      app.use(travelRouter);
      server.middlewares.use('/api', (req, res, next) => {
        app(req as any, res as any, next);
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

