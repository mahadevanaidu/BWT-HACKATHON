/**
 * Development start script with in-memory MongoDB.
 * Run with: ts-node src/scripts/devStart.ts
 * 
 * Downloads a MongoDB binary on first run (~70MB), then
 * starts it in-process so no local MongoDB install is needed.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import { spawnSync } from 'child_process';

async function main() {
  console.log('\n🍃 Starting in-memory MongoDB for development…');
  console.log('   (First run downloads ~70 MB binary — subsequent runs are instant)\n');

  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'verity' },
  });

  const uri = mongod.getUri();
  console.log(`✅ MongoDB ready at: ${uri}\n`);

  // Inject into environment
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'verity-dev-secret-local';
  process.env.PORT = process.env.PORT || '5000';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  process.env.NODE_ENV = 'development';

  // Dynamically load the app after env is set
  const { connectDB } = await import('../utils/database');
  const app = (await import('../app')).default;

  await connectDB();

  const PORT = parseInt(process.env.PORT, 10);
  app.listen(PORT, () => {
    console.log(`\n🚀 Verity API running on http://localhost:${PORT}`);
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`\n💡 Now run seed script to populate demo data:`);
    console.log(`   MONGODB_URI="${uri}" npx ts-node src/scripts/seed.ts\n`);
  });

  // Keep alive — stop on Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down…');
    await mongod.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
