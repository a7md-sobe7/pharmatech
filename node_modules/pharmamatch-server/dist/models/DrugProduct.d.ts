import mongoose, { Document } from 'mongoose';
import { IDrugProduct } from '../types/index.js';
export interface IDrugProductDoc extends Omit<IDrugProduct, '_id'>, Document {
}
export declare const DrugProduct: mongoose.Model<IDrugProductDoc, {}, {}, {}, mongoose.Document<unknown, {}, IDrugProductDoc, {}, {}> & IDrugProductDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
