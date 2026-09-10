import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/database/connection.js';

let isConnected = false;
const app = createApp();

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('Database connection error in serverless handler:', err);
    }
  }
  return app(req, res);
}
