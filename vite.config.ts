import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createNeonMiddleware } from './src/server/neonHandler.ts';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL || '';

  return {
    plugins: [
      react(),
      {
        name: 'neon-api-server',
        configureServer(server) {
          server.middlewares.use(createNeonMiddleware(databaseUrl));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createNeonMiddleware(databaseUrl));
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
    },
  };
});

