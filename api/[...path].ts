import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/database/connection.js';

// Connect to DB asynchronously. Mongoose will buffer queries until connected.
connectDB().catch(console.error);

const app = createApp();

export default app;
