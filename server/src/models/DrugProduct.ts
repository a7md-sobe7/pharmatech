import mongoose, { Schema, Document } from 'mongoose';
import { IDrugProduct } from '../types/index.js';

export interface IDrugProductDoc extends Omit<IDrugProduct, '_id'>, Document {}

const ActiveIngredientSchema = new Schema({
  ingredientId: { type: String },
  name: { type: String, required: true },
  normalizedName: { type: String, required: true },
  arabicName: { type: String },
  role: { 
    type: String, 
    enum: ['PRIMARY', 'SECONDARY', 'SUPPORTING', 'UNKNOWN'], 
    default: 'SECONDARY' 
  },
  strength: { type: Number },
  unit: { type: String },
  normalizedStrengthValue: { type: Number },
  normalizedStrengthUnit: { type: String },
}, { _id: false });

const PrimaryActiveIngredientSchema = new Schema({
  ingredientId: { type: String },
  name: { type: String, required: true },
  normalizedName: { type: String, required: true },
  arabicName: { type: String },
  strength: { type: Number },
  unit: { type: String },
  normalizedStrengthValue: { type: Number },
  normalizedStrengthUnit: { type: String },
  confidence: { 
    type: String, 
    enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'], 
    default: 'HIGH' 
  },
  source: { type: String, default: 'DailyMed' },
}, { _id: false });

const DrugProductSchema = new Schema<IDrugProductDoc>({
  productName: { type: String, required: true, index: true },
  normalizedName: { type: String, required: true, index: true },
  arabicName: { type: String, index: true },
  brandName: { type: String, required: true, index: true },
  genericName: { type: String, required: true, index: true },
  manufacturer: { type: String, required: true },
  activeIngredients: [ActiveIngredientSchema],
  primaryActiveIngredient: { type: PrimaryActiveIngredientSchema, required: true },
  dosageForm: { type: String, required: true, index: true },
  dosageFormCategory: { type: String, default: 'Oral Solid' },
  route: { type: String, default: 'Oral' },
  therapeuticClass: { type: String, required: true, index: true },
  indications: [{ type: String }],
  contraindications: [{ type: String }],
  interactions: [{ type: String }],
  references: [{
    title: { type: String, required: true },
    source: { type: String, required: true },
    url: { type: String }
  }],
  source: { type: String, required: true, default: 'DailyMed' },
  sourceUrl: { type: String },
  lastVerifiedAt: { type: Date, default: Date.now },
  referencePrice: { type: Number },                     // EDA list price (EGP)
  referencePriceCurrency: { type: String, default: 'EGP' },
}, {
  timestamps: true,
});

// Text index for search
DrugProductSchema.index({ productName: 'text', brandName: 'text', genericName: 'text', arabicName: 'text' });
DrugProductSchema.index({ 'primaryActiveIngredient.normalizedName': 1 });

export const DrugProduct = mongoose.model<IDrugProductDoc>('DrugProduct', DrugProductSchema);
