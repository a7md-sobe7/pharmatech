import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
const UserSchema = new Schema({
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
    if (!this.isModified('password') || !this.password)
        return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (err) {
        next(err);
    }
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcrypt.compare(candidatePassword, this.password);
};
export const User = mongoose.model('User', UserSchema);
