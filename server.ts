import express, { Express, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { usersRouter } from './backend/routes/users.ts';
import { gigsRouter } from './backend/routes/gigs.ts';
import { applicationsRouter } from './backend/routes/applications.ts';
import { reviewsRouter } from './backend/routes/reviews.ts';
import { seedRouter } from './backend/routes/seed.ts';
import { authRouter } from './backend/routes/auth.ts';
import { dbStore } from './backend/store.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app: Express = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize DB & evaluate any expirations
  dbStore.ensureInitialized();

  // Mount API routers both with and without /api prefix for 100% PRD & REST compatibility
  const mountRoutes = (prefix: string) => {
    app.use(`${prefix}/users`, usersRouter);
    app.use(`${prefix}/gigs`, gigsRouter);
    app.use(`${prefix}/applications`, applicationsRouter);
    app.use(`${prefix}/reviews`, reviewsRouter);
    app.use(`${prefix}/seed`, seedRouter);
    app.use(`${prefix}/auth`, authRouter);
  };

  mountRoutes('/api');
  mountRoutes('');

  // Development vs Production serving
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev middleware mounted.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`📦 Serving static files from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CampusConnect server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting CampusConnect server:', err);
  process.exit(1);
});
