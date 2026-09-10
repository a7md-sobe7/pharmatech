import winston from 'winston';
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json()),
    defaultMeta: { service: 'pharmamatch-api' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ level, message, timestamp, service, ...rest }) => {
                const restStr = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
                return `[${timestamp}] [${level}]: ${message}${restStr}`;
            })),
        }),
    ],
});
