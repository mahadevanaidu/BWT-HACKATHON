import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './utils/database';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 Verity API running on port ${PORT}`);
    logger.info(`📚 API docs: http://localhost:${PORT}/api-docs`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
