import { logger } from '../utils/logger.js';
export class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred on the server.';
    logger.error(`[${req.method} ${req.url}] ${statusCode} - ${message}`, {
        stack: err.stack,
        body: req.body,
        query: req.query
    });
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            ...(process.env.NODE_ENV === 'development' && { details: err.stack })
        }
    });
};
