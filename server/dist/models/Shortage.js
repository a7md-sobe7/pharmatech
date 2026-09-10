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
}, { timestamps: true });
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
        }
        else if (needed >= 2 && needed <= 5) {
            this.urgency = 'MEDIUM';
        }
        else {
            // needed < 2 (i.e. 1 unit) — small but still urgent
            this.urgency = 'HIGH';
        }
    }
    next();
});
ShortageSchema.index({ status: 1, urgency: 1 });
export const Shortage = mongoose.model('Shortage', ShortageSchema);
