import mongoose, { Schema, Document } from 'mongoose';
import { INotification } from '../types/index.js';

export interface INotificationDoc extends Omit<INotification, '_id'>, Document {}

const NotificationSchema = new Schema<INotificationDoc>({
  userId: { type: String, index: true },
  targetRole: { 
    type: String, 
    enum: ['ADMIN', 'PHARMACIST', 'STAFF', 'MORNING_SHIFT', 'NIGHT_SHIFT', 'ALL'],
    default: 'ALL',
    index: true 
  },
  type: {
    type: String,
    enum: [
      'LOW_STOCK',
      'OUT_OF_STOCK',
      'EXPIRY_WARNING',
      'SALE',
      'ADMIN_ALERT',
      'SYSTEM_ALERT',
      'NEW_USER',
      'SHIFT_ALERT'
    ],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
    default: 'NORMAL',
    index: true
  },
  isRead: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ targetRole: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDoc>('Notification', NotificationSchema);
