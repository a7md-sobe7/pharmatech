import mongoose, { Schema } from 'mongoose';
const PharmacyInventorySchema = new Schema({
    pharmacyId: { type: String, required: true, index: true, default: 'main-pharmacy' },
    drugProductId: { type: String, required: true, index: true },
    productName: { type: String, required: true, index: true },
    arabicName: { type: String },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    availableQuantity: { type: Number, required: true, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EGP' },
    batchNumber: { type: String, required: true },
    expirationDate: { type: Date, required: true, index: true },
    storageLocation: { type: String, default: 'Shelf A-1' },
    minimumStockLevel: { type: Number, default: 5 },
    status: {
        type: String,
        enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED', 'DISCONTINUED'],
        required: true,
        index: true,
        default: 'AVAILABLE'
    },
}, {
    timestamps: true,
});
PharmacyInventorySchema.pre('save', function (next) {
    this.availableQuantity = Math.max(0, this.quantity - (this.reservedQuantity || 0));
    const now = new Date();
    if (this.expirationDate && new Date(this.expirationDate) <= now) {
        this.status = 'EXPIRED';
    }
    else if (this.availableQuantity === 0) {
        this.status = 'OUT_OF_STOCK';
    }
    else if (this.availableQuantity <= this.minimumStockLevel) {
        this.status = 'LOW_STOCK';
    }
    else if (this.status !== 'DISCONTINUED') {
        this.status = 'AVAILABLE';
    }
    next();
});
// Composite index for fast inventory cross-referencing
PharmacyInventorySchema.index({ drugProductId: 1, status: 1, availableQuantity: 1 });
export const PharmacyInventory = mongoose.model('PharmacyInventory', PharmacyInventorySchema);
