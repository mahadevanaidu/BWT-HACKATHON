import mongoose from 'mongoose';
import logger from './logger';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('❌ MONGODB_URI is not set in environment variables.');
    logger.error('   Please create a .env file from .env.example and set your MongoDB connection string.');
    logger.error('   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/verity');
    throw new Error('MONGODB_URI environment variable is required but not set.');
  }

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
    logger.info(`   Database: ${mongoose.connection.name}`);
    logger.info(`   Host: ${mongoose.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error:', err);
    });
  } catch (err) {
    logger.error('❌ Failed to connect to MongoDB:', err);
    logger.error('   Verify your MONGODB_URI is correct and the database is accessible.');
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
