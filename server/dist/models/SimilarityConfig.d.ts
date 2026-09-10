import mongoose, { Document } from 'mongoose';
import { ISimilarityConfig } from '../types/index.js';
export interface ISimilarityConfigDoc extends Omit<ISimilarityConfig, '_id'>, Document {
}
export declare const SimilarityConfig: mongoose.Model<ISimilarityConfigDoc, {}, {}, {}, mongoose.Document<unknown, {}, ISimilarityConfigDoc, {}, {}> & ISimilarityConfigDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
