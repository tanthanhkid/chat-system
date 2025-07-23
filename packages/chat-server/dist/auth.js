"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = authenticateAdmin;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.hashPassword = hashPassword;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Environment variables for JWT secret and default admin credentials
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcryptjs_1.default.hashSync('admin123', 10);
// Simple in-memory user store for demo purposes
// In production, this would be in database
const adminUser = {
    id: '1',
    username: ADMIN_USERNAME,
    passwordHash: ADMIN_PASSWORD_HASH,
    role: 'admin'
};
/**
 * Authenticate admin login credentials
 */
async function authenticateAdmin(username, password) {
    if (username !== adminUser.username) {
        return null;
    }
    const isValidPassword = await bcryptjs_1.default.compare(password, adminUser.passwordHash);
    if (!isValidPassword) {
        return null;
    }
    const token = jsonwebtoken_1.default.sign({
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
    }, JWT_SECRET, { expiresIn: '24h' });
    return { token };
}
/**
 * Middleware to verify JWT token and authenticate admin
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
/**
 * Middleware to verify admin role specifically
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
/**
 * Generate password hash for setup
 */
function hashPassword(password) {
    return bcryptjs_1.default.hashSync(password, 10);
}
/**
 * Verify if token is valid without middleware
 */
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
    }
    catch (error) {
        return null;
    }
}
