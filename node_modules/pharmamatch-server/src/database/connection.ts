import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDatabaseIfEmpty } from '../seeds/index.js';

const getDirname = () => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return process.cwd();
  }
};
const _dirname = getDirname();

const PERSISTENT_DB_PATH = path.resolve(_dirname, '../../data/db');

let mongod: any = null;

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;

  try {
    if (mongoUri && mongoUri.trim() !== '') {
      console.log(`Connecting to external MongoDB at ${mongoUri}...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB successfully.');
    } else {
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI is required in production/Vercel environments. Please add it to your environment variables.');
      }
      console.log(`No MONGO_URI set — starting persistent local MongoDB at ${PERSISTENT_DB_PATH}...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbPath: PERSISTENT_DB_PATH,
          storageEngine: 'wiredTiger',
        },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Persistent local MongoDB running at ${uri}`);
    }

    // Seed only if the DB is empty (won't overwrite existing shortage entries)
    await seedDatabaseIfEmpty();
    } catch (error: any) {
    console.warn(`MongoDB connection failed (${error.message}).`);
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.error('❌ Failed to start MongoDB on Vercel:', error);
      throw error;
    }
    console.log('Retrying with fresh in-memory fallback...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbPath: PERSISTENT_DB_PATH,
          storageEngine: 'wiredTiger',
        },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Persistent local MongoDB (fallback) running at ${uri}`);
      await seedDatabaseIfEmpty();
    } catch (fallbackError: any) {
      console.error('❌ Failed to start MongoDB:', fallbackError);
      process.exit(1);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop({ doCleanup: false }); // keep data files on disk
    }
    console.log('MongoDB connection closed. Data preserved on disk.');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}