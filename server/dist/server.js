import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';
import { connectDB } from './database/connection.js';
import { logger } from './utils/logger.js';
import { ExpiryNotificationJob } from './modules/notifications/expiryNotificationJob.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/dist/server.js → ../../ = pharma/ (project root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        await connectDB();
        const app = createApp();
        app.listen(PORT, () => {
            logger.info(`🚀 PharmaMatch AI Server listening on http://localhost:${PORT}`);
            logger.info(`📋 Health endpoint: http://localhost:${PORT}/health`);
            logger.info(`💊 Ready for clinical similarity calculations and inventory cross-referencing.`);
            // Initialize periodic medicine expiry check job
            ExpiryNotificationJob.startSchedule();
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
