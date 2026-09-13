import mongoose, { Schema } from 'mongoose';
const ShortageSchema = new Schema({
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
}, { timestamps: true });
ShortageSchema.index({ status: 1 });
export const Shortage = mongoose.model('Shortage', ShortageSchema);
