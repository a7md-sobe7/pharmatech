import mongoose, { Schema, Document } from 'mongoose';

export type ShortageUrgency = 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
  urgency: ShortageUrgency;      // MEDIUM (2-5 left) | HIGH (≤5 left) | CRITICAL (user-set)
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
    urgency: {
      type: String,
      enum: ['MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      default: 'HIGH',
      index: true,
    },
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

/**
 * Auto-suggest urgency based on neededQuantity (amount to be ordered):
 *  - neededQty 2–5  →  MEDIUM
 *  - neededQty ≤ 5 (i.e. 1)  →  HIGH
 *  - neededQty > 5  →  CRITICAL (user confirms)
 * User can always manually override to CRITICAL.
 */
ShortageSchema.pre('save', function (next) {
  // Only auto-compute if urgency was not explicitly set to CRITICAL by the user
  if (this.urgency !== 'CRITICAL') {
    const needed = this.neededQuantity;
    if (needed > 5) {
      this.urgency = 'CRITICAL';
    } else if (needed >= 2 && needed <= 5) {
      this.urgency = 'MEDIUM';
    } else {
      // needed < 2 (i.e. 1 unit) — small but still urgent
      this.urgency = 'HIGH';
    }
  }
  next();
});

ShortageSchema.index({ status: 1, urgency: 1 });

export const Shortage = mongoose.model<IShortageDoc>('Shortage', ShortageSchema);
