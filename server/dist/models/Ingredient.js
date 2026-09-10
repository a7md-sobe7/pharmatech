import mongoose, { Schema } from 'mongoose';
const IngredientSchema = new Schema({
    canonicalName: { type: String, required: true, unique: true, index: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
    arabicName: { type: String, index: true },
    aliases: [{ type: String, index: true }],
    synonyms: [{ type: String }],
    chemicalName: { type: String },
    therapeuticClass: { type: String },
    source: { type: String, default: 'PubChem/DailyMed' },
}, {
    timestamps: true,
});
IngredientSchema.index({ canonicalName: 'text', normalizedName: 'text', aliases: 'text', arabicName: 'text' });
export const Ingredient = mongoose.model('Ingredient', IngredientSchema);
