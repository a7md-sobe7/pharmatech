import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../middleware/audit.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role, licenseNumber, pharmacyName } = req.body;

      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required.', 400, 'VALIDATION_ERROR');
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
      }

      const user = new User({
        name,
        email: email.toLowerCase(),
        password,
        role: role || 'PHARMACIST',
        licenseNumber,
        pharmacyName: pharmacyName || 'Al-Shifa Community Pharmacy'
      });

      await user.save();

      const secret = process.env.JWT_SECRET || 'pharmamatch_super_secure_jwt_secret_key_2026_clinical';
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        secret,
        { expiresIn: '7d' }
      );

      await logAudit('USER_REGISTER', req as any, String(user._id), { email: user.email, role: user.role });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            licenseNumber: user.licenseNumber,
            pharmacyName: user.pharmacyName
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required.', 400, 'VALIDATION_ERROR');
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }

      user.lastLogin = new Date();
      await user.save();

      const secret = process.env.JWT_SECRET || 'pharmamatch_super_secure_jwt_secret_key_2026_clinical';
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        secret,
        { expiresIn: '7d' }
      );

      await logAudit('USER_LOGIN', req as any, String(user._id), { email: user.email, role: user.role });

      res.json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            licenseNumber: user.licenseNumber,
            pharmacyName: user.pharmacyName
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const user = await User.findById(req.user.id).select('-password');
      res.json({
        success: true,
        data: {
          user: user || req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
