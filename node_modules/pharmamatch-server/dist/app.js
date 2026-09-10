import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './modules/auth/authRoutes.js';
import { productRoutes } from './modules/products/productRoutes.js';
import { inventoryRoutes } from './modules/inventory/inventoryRoutes.js';
import { similarityRoutes } from './modules/similarity/similarityRoutes.js';
import { auditRoutes } from './modules/audit/auditRoutes.js';
import { shortageRoutes } from './modules/shortages/shortageRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
export const createApp = () => {
    const app = express();
    // Security & Utility Middleware
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));
    app.use(cors({
        origin: '*',
        credentials: true
    }));
    app.use(express.json());
    app.use(morgan('dev'));
    // Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api', limiter);
    // Health Check Endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'HEALTHY',
            service: 'PharmaMatch AI Intelligence Server',
            timestamp: new Date().toISOString()
        });
    });
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/similarity', similarityRoutes);
    app.use('/api/audit', auditRoutes);
    app.use('/api/shortages', shortageRoutes);
    // 404 Route Handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'ROUTE_NOT_FOUND',
                message: `Endpoint ${req.method} ${req.originalUrl} not found.`
            }
        });
    });
    // Global Error Handler
    app.use(errorHandler);
    return app;
};
