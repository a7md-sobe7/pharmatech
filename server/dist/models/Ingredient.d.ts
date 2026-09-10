import mongoose, { Document } from 'mongoose';
import { IIngredientCanonical } from '../types/index.js';
export interface IIngredientDoc extends Omit<IIngredientCanonical, '_id'>, Document {
}
export declare const Ingredient: mongoose.Model<IIngredientDoc, {}, {}, {}, mongoose.Document<unknown, {}, IIngredientDoc, {}, {}> & IIngredientDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
