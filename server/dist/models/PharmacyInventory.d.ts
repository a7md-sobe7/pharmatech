import mongoose, { Document } from 'mongoose';
import { IPharmacyInventory } from '../types/index.js';
export interface IPharmacyInventoryDoc extends Omit<IPharmacyInventory, '_id'>, Document {
}
export declare const PharmacyInventory: mongoose.Model<IPharmacyInventoryDoc, {}, {}, {}, mongoose.Document<unknown, {}, IPharmacyInventoryDoc, {}, {}> & IPharmacyInventoryDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
