import mongoose, { Document } from 'mongoose';
export type ShortageUrgency = 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ShortageStatus = 'PENDING' | 'ORDERED' | 'RESOLVED';
export interface IShortage {
    _id: string;
    medicineName: string;
    medicineNameAr?: string;
    concentration?: string;
    scientificName?: string;
    manufacturer?: string;
    drugClass?: string;
    currentQuantity: number;
    neededQuantity: number;
    urgency: ShortageUrgency;
    status: ShortageStatus;
    notes?: string;
    addedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface IShortageDoc extends Omit<IShortage, '_id'>, Document {
}
export declare const Shortage: mongoose.Model<IShortageDoc, {}, {}, {}, mongoose.Document<unknown, {}, IShortageDoc, {}, {}> & IShortageDoc & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
