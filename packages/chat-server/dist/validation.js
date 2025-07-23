"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = exports.rateLimitStore = exports.sanitize = exports.validateSocketData = exports.validate = exports.validationSchemas = void 0;
const joi_1 = __importDefault(require("joi"));
// UUID validation pattern
const uuidSchema = joi_1.default.string().guid({ version: 'uuidv4' });
// Email validation
const emailSchema = joi_1.default.string().email().max(255);
// Content validation (messages, etc.)
const contentSchema = joi_1.default.string().min(1).max(10000).trim();
// Pagination schemas
const offsetSchema = joi_1.default.number().integer().min(0).max(100000);
const limitSchema = joi_1.default.number().integer().min(1).max(100);
const directionSchema = joi_1.default.string().valid('asc', 'desc');
// Request validation schemas
exports.validationSchemas = {
    // GET /api/conversations/:id/messages
    getMessages: {
        params: joi_1.default.object({
            id: uuidSchema.required()
        }),
        query: joi_1.default.object({
            offset: offsetSchema.default(0),
            limit: limitSchema.default(10),
            direction: directionSchema.default('desc')
        })
    },
    // GET /api/unread-messages
    getUnreadMessages: {
        query: joi_1.default.object({
            userEmail: emailSchema.optional(),
            limit: limitSchema.default(10)
        })
    },
    // POST /api/messages/:id/read
    markMessageRead: {
        params: joi_1.default.object({
            id: uuidSchema.required()
        }),
        body: joi_1.default.object({
            readBy: joi_1.default.string().valid('user', 'admin').default('admin')
        })
    },
    // POST /api/conversations/:id/read
    markConversationRead: {
        params: joi_1.default.object({
            id: uuidSchema.required()
        }),
        body: joi_1.default.object({
            readBy: joi_1.default.string().valid('user', 'admin').default('admin')
        })
    },
    // POST /api/admin/push/subscribe
    pushSubscribe: {
        body: joi_1.default.object({
            endpoint: joi_1.default.string().uri().required(),
            keys: joi_1.default.object({
                p256dh: joi_1.default.string().required(),
                auth: joi_1.default.string().required()
            }).required(),
            expirationTime: joi_1.default.alternatives().try(joi_1.default.number().integer().positive(), joi_1.default.allow(null)).optional()
        })
    },
    // POST /api/admin/test-push
    testPush: {
        body: joi_1.default.object({
            title: joi_1.default.string().max(100).default('Test Notification'),
            body: joi_1.default.string().max(500).default('This is a test push notification'),
            data: joi_1.default.object().optional().default({ test: true })
        })
    },
    // Socket.IO event validation
    socketEvents: {
        joinUser: joi_1.default.object({
            email: emailSchema.required()
        }),
        userMessage: joi_1.default.object({
            conversationId: uuidSchema.required(),
            content: contentSchema.required(),
            email: emailSchema.required()
        }),
        adminMessage: joi_1.default.object({
            conversationId: uuidSchema.required(),
            content: contentSchema.required()
        }),
        adminBroadcast: joi_1.default.object({
            content: contentSchema.required()
        }),
        markConversationRead: joi_1.default.object({
            conversationId: uuidSchema.required()
        }),
        markMessageRead: joi_1.default.object({
            messageId: uuidSchema.required()
        }),
        typing: joi_1.default.object({
            conversationId: uuidSchema.required(),
            email: emailSchema.optional()
        })
    }
};
// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate params
        if (schema.params) {
            const { error, value } = schema.params.validate(req.params);
            if (error) {
                errors.push(`Params: ${error.message}`);
            }
            else {
                req.params = value;
            }
        }
        // Validate query
        if (schema.query) {
            const { error, value } = schema.query.validate(req.query);
            if (error) {
                errors.push(`Query: ${error.message}`);
            }
            else {
                req.query = value;
            }
        }
        // Validate body
        if (schema.body) {
            const { error, value } = schema.body.validate(req.body);
            if (error) {
                errors.push(`Body: ${error.message}`);
            }
            else {
                req.body = value;
            }
        }
        if (errors.length > 0) {
            console.warn(`❌ Validation failed for ${req.method} ${req.path}:`, errors);
            return res.status(400).json({
                error: 'Validation failed',
                details: errors,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method
            });
        }
        next();
    };
};
exports.validate = validate;
// Socket.IO validation helper
const validateSocketData = (schema, data) => {
    const { error, value } = schema.validate(data);
    if (error) {
        return { isValid: false, error: error.message };
    }
    return { isValid: true, value };
};
exports.validateSocketData = validateSocketData;
// Sanitization helpers
exports.sanitize = {
    // Remove potential XSS content
    content: (str) => {
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: urls
            .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
            .trim();
    },
    // Sanitize email
    email: (str) => {
        return str.toLowerCase().trim();
    },
    // Sanitize UUID
    uuid: (str) => {
        return str.toLowerCase().trim();
    }
};
// Rate limiting data structures
exports.rateLimitStore = new Map();
// Rate limiting helper
const checkRateLimit = (identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const now = Date.now();
    const record = exports.rateLimitStore.get(identifier);
    if (!record || now > record.resetTime) {
        exports.rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
    }
    if (record.count >= maxRequests) {
        return false;
    }
    record.count++;
    return true;
};
exports.checkRateLimit = checkRateLimit;
// Clean up expired rate limit records
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of exports.rateLimitStore.entries()) {
        if (now > record.resetTime) {
            exports.rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes
