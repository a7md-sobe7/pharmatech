import serverless from 'serverless-http';
import { createApp } from '../../server/src/app.js';
import { connectDB } from '../../server/src/database/connection.js';

// Connect to MongoDB asynchronously.
connectDB().catch(console.error);

// Create the Express app
const app = createApp();

// Wrap the Express app with serverless-http
export const handler = serverless(app);