import mongoose, { Schema, Document } from 'mongoose';

export type ShortageStatus = 'PENDING' | 'ORDERED' | 'RESOLVED';

export interface IShortage {
  _id: string;
  // Drug info (sourced from Egyptian drugs reference DB)
  medicineName: string;          // commercial_name_en from reference DB
  medicineNameAr?: string;       // commercial_name_ar from reference DB
  concentration?: string;        // dosage form / concentration label (from DB entry)
  scientificName?: string;       // scientific_name from reference DB
  manufacturer?: string;         // manufacturer from reference DB
  drugClass?: string;            // drug_class from reference DB
  // Stock info
  currentQuantity: number;       // units left on shelf right now
  neededQuantity: number;        // units that need to be ordered
  // Classification
  status: ShortageStatus;        // PENDING | ORDERED | RESOLVED
  // Meta
  notes?: string;
  addedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IShortageDoc extends Omit<IShortage, '_id'>, Document {}

const ShortageSchema = new Schema<IShortageDoc>(
  {
    medicineName: { type: String, required: true, index: true },
    medicineNameAr: { type: String },
    concentration: { type: String },
    scientificName: { type: String },
    manufacturer: { type: String },
    drugClass: { type: String },
    currentQuantity: { type: Number, required: true, default: 0, min: 0 },
    neededQuantity: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'ORDERED', 'RESOLVED'],
      required: true,
      default: 'PENDING',
      index: true,
    },
    notes: { type: String },
    addedBy: { type: String },
  },
  { timestamps: true }
);


ShortageSchema.index({ status: 1 });

export const Shortage = mongoose.model<IShortageDoc>('Shortage', ShortageSchema);
