import mongoose, { Schema, Document } from 'mongoose';
import { IPharmacistFeedback } from '../types/index.js';

export interface IPharmacistFeedbackDoc extends Omit<IPharmacistFeedback, '_id'>, Document {}

const PharmacistFeedbackSchema = new Schema<IPharmacistFeedbackDoc>({
  pharmacistId: { type: String, required: true, index: true },
  pharmacistName: { type: String, required: true },
  targetProductId: { type: String, required: true, index: true },
  targetProductName: { type: String, required: true },
  candidateProductId: { type: String, required: true, index: true },
  candidateProductName: { type: String, required: true },
  calculatedScore: { type: Number, required: true },
  similarityLevel: { 
    type: String, 
    enum: ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'NOT_SIMILAR'],
    required: true 
  },
  rating: { 
    type: String, 
    enum: ['USEFUL', 'NOT_USEFUL', 'NOT_CLINICALLY_SUITABLE'], 
    required: true,
    index: true 
  },
  notes: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export const PharmacistFeedback = mongoose.model<IPharmacistFeedbackDoc>('PharmacistFeedback', PharmacistFeedbackSchema);
