import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

// Environment variables for JWT secret and default admin credentials
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'admin';
  };
}

// Simple in-memory user store for demo purposes
// In production, this would be in database
const adminUser = {
  id: '1',
  username: ADMIN_USERNAME,
  passwordHash: ADMIN_PASSWORD_HASH,
  role: 'admin' as const
};

/**
 * Authenticate admin login credentials
 */
export async function authenticateAdmin(username: string, password: string): Promise<{ token: string } | null> {
  if (username !== adminUser.username) {
    return null;
  }
  
  const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);
  if (!isValidPassword) {
    return null;
  }
  
  const token = jwt.sign(
    { 
      id: adminUser.id, 
      username: adminUser.username, 
      role: adminUser.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return { token };
}

/**
 * Middleware to verify JWT token and authenticate admin
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware to verify admin role specifically
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Generate password hash for setup
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Verify if token is valid without middleware
 */
export function verifyToken(token: string): { id: string; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}