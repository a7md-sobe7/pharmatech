import mongoose, { Document } from 'mongoose';
import { IUser } from '../types/index.js';
export interface IUserDoc extends Omit<IUser, '_id'>, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUserDoc, {}, {}, {}, mongoose.Document<unknown, {}, IUserDoc, {}, {}> & IUserDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
