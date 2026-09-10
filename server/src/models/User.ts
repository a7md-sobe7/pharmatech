import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types/index.js';

export interface IUserDoc extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDoc>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'PHARMACIST', 'STAFF', 'MORNING_SHIFT', 'NIGHT_SHIFT'], 
    default: 'PHARMACIST',
    index: true
  },
  licenseNumber: { type: String },
  pharmacyName: { type: String, default: 'Al-Shifa Pharmacy' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, {
  timestamps: true,
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDoc>('User', UserSchema);
