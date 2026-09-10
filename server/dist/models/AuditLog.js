import mongoose, { Schema } from 'mongoose';
const AuditLogSchema = new Schema({
    userId: { type: String, index: true },
    userName: { type: String },
    userRole: { type: String },
    action: { type: String, required: true, index: true },
    target: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    resultStatus: {
        type: String,
        enum: ['SUCCESS', 'WARNING', 'ERROR'],
        default: 'SUCCESS',
        index: true
    },
    ipAddress: { type: String },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
AuditLogSchema.index({ action: 1, createdAt: -1 });
export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
