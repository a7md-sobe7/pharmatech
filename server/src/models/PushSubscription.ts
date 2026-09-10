import mongoose, { Schema, Document } from 'mongoose';
import { IPushSubscription } from '../types/index.js';

export interface IPushSubscriptionDoc extends Omit<IPushSubscription, '_id'>, Document {}

const PushSubscriptionSchema = new Schema<IPushSubscriptionDoc>({
  userId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true, unique: true, index: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  deviceName: { type: String, default: 'Web Browser' },
  browser: { type: String, default: 'Chrome' },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

PushSubscriptionSchema.index({ userId: 1, isActive: 1 });

export const PushSubscription = mongoose.model<IPushSubscriptionDoc>('PushSubscription', PushSubscriptionSchema);
