import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDatabaseIfEmpty } from '../seeds/index.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Persistent local data folder: server/data/db
// This folder survives server restarts so all shortage entries are kept.
const PERSISTENT_DB_PATH = path.resolve(__dirname, '../../data/db');
let mongod = null;
export async function connectDB() {
    const mongoUri = process.env.MONGO_URI;
    try {
        if (mongoUri && mongoUri.trim() !== '') {
            // ── External / Atlas MongoDB ────────────────────────────────────────
            console.log(`Connecting to external MongoDB at ${mongoUri}...`);
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
            console.log('✅ Connected to MongoDB successfully.');
        }
        else {
            // ── Persistent In-Memory MongoDB (file-backed with WiredTiger) ──────
            console.log(`No MONGO_URI set — starting persistent local MongoDB at ${PERSISTENT_DB_PATH}...`);
            mongod = await MongoMemoryServer.create({
                instance: {
                    dbPath: PERSISTENT_DB_PATH, // data survives restarts
                    storageEngine: 'wiredTiger',
                },
            });
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log(`✅ Persistent local MongoDB running at ${uri}`);
            console.log(`   Data stored at: ${PERSISTENT_DB_PATH}`);
        }
        // Seed only if the DB is empty (won't overwrite existing shortage entries)
        await seedDatabaseIfEmpty();
    }
    catch (error) {
        console.warn(`MongoDB connection failed (${error.message}). Retrying with fresh in-memory fallback...`);
        try {
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
        }
        catch (fallbackError) {
            console.error('❌ Failed to start MongoDB:', fallbackError);
            process.exit(1);
        }
    }
}
export async function disconnectDB() {
    try {
        await mongoose.disconnect();
        if (mongod) {
            await mongod.stop({ doCleanup: false }); // keep data files on disk
        }
        console.log('MongoDB connection closed. Data preserved on disk.');
    }
    catch (error) {
        console.error('Error disconnecting MongoDB:', error);
    }
}
