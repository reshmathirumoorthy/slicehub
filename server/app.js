import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import env from './config/env.js';
import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Express application factory.
 * Separated from server.js so the app can be tested without binding a port.
 */
const createApp = () => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Static uploads directory (Multer destinations will use this later)
  app.use(
    '/uploads',
    express.static(path.join(__dirname, env.uploadDir)),
  );

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
