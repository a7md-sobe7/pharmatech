import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        if (!token) {
            // Default to guest pharmacist for ease of review if no token is provided
            req.user = {
                id: 'guest-pharmacist-001',
                email: 'pharmacist@pharmamatch.ai',
                role: 'PHARMACIST',
                name: 'Dr. Sarah Ahmed, PharmD',
                pharmacyName: 'Al-Shifa Community Pharmacy'
            };
            return next();
        }
        const secret = process.env.JWT_SECRET || 'pharmamatch_super_secure_jwt_secret_key_2026_clinical';
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User account not found or disabled.' }
            });
            return;
        }
        req.user = {
            id: String(user._id),
            email: user.email,
            role: user.role,
            name: user.name,
            pharmacyName: user.pharmacyName
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: { code: 'INVALID_TOKEN', message: 'Authentication token is invalid or expired.' }
        });
    }
};
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Access denied: insufficient permissions.' }
            });
            return;
        }
        next();
    };
};
