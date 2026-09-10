import mongoose, { Document } from 'mongoose';
import { IPharmacistFeedback } from '../types/index.js';
export interface IPharmacistFeedbackDoc extends Omit<IPharmacistFeedback, '_id'>, Document {
}
export declare const PharmacistFeedback: mongoose.Model<IPharmacistFeedbackDoc, {}, {}, {}, mongoose.Document<unknown, {}, IPharmacistFeedbackDoc, {}, {}> & IPharmacistFeedbackDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
