import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
