import mongoose, { Schema } from 'mongoose';
const SimilarityConfigSchema = new Schema({
    primaryIngredientWeight: { type: Number, required: true, default: 0.60 },
    strengthWeight: { type: Number, required: true, default: 0.20 },
    dosageFormWeight: { type: Number, required: true, default: 0.10 },
    secondaryIngredientWeight: { type: Number, required: true, default: 0.10 },
    thresholds: {
        veryHigh: { type: Number, default: 90 },
        high: { type: Number, default: 75 },
        moderate: { type: Number, default: 50 },
        low: { type: Number, default: 25 },
    },
    version: { type: String, default: '1.0.0' },
    updatedBy: { type: String, default: 'SYSTEM' },
}, {
    timestamps: true,
});
export const SimilarityConfig = mongoose.model('SimilarityConfig', SimilarityConfigSchema);
