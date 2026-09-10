import mongoose, { Schema, Document } from 'mongoose';
import { INotificationPreference } from '../types/index.js';

export interface INotificationPreferenceDoc extends Omit<INotificationPreference, '_id'>, Document {}

const NotificationPreferenceSchema = new Schema<INotificationPreferenceDoc>({
  userId: { type: String, required: true, unique: true, index: true },
  lowStock: { type: Boolean, default: true },
  outOfStock: { type: Boolean, default: true },
  expiry: { type: Boolean, default: true },
  sales: { type: Boolean, default: false },
  adminAlerts: { type: Boolean, default: true },
  shiftAlerts: { type: Boolean, default: true },
  systemAlerts: { type: Boolean, default: true },
  enabledAll: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const NotificationPreference = mongoose.model<INotificationPreferenceDoc>('NotificationPreference', NotificationPreferenceSchema);
