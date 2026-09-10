import mongoose, { Schema, Document } from 'mongoose';
import { IIngredientCanonical } from '../types/index.js';

export interface IIngredientDoc extends Omit<IIngredientCanonical, '_id'>, Document {}

const IngredientSchema = new Schema<IIngredientDoc>({
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

export const Ingredient = mongoose.model<IIngredientDoc>('Ingredient', IngredientSchema);
