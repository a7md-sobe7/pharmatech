import mongoose, { Document } from 'mongoose';
import { IAuditLog } from '../types/index.js';
export interface IAuditLogDoc extends Omit<IAuditLog, '_id'>, Document {
}
export declare const AuditLog: mongoose.Model<IAuditLogDoc, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLogDoc, {}, {}> & IAuditLogDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
