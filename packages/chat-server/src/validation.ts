import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// UUID validation pattern
const uuidSchema = Joi.string().guid({ version: 'uuidv4' });

// Email validation
const emailSchema = Joi.string().email().max(255);

// Content validation (messages, etc.)
const contentSchema = Joi.string().min(1).max(10000).trim();

// Pagination schemas
const offsetSchema = Joi.number().integer().min(0).max(100000);
const limitSchema = Joi.number().integer().min(1).max(100);
const directionSchema = Joi.string().valid('asc', 'desc');

// Request validation schemas
export const validationSchemas = {
  // GET /api/conversations/:id/messages
  getMessages: {
    params: Joi.object({
      id: uuidSchema.required()
    }),
    query: Joi.object({
      offset: offsetSchema.default(0),
      limit: limitSchema.default(10), 
      direction: directionSchema.default('desc')
    })
  },

  // GET /api/unread-messages
  getUnreadMessages: {
    query: Joi.object({
      userEmail: emailSchema.optional(),
      limit: limitSchema.default(10)
    })
  },

  // POST /api/messages/:id/read
  markMessageRead: {
    params: Joi.object({
      id: uuidSchema.required()
    }),
    body: Joi.object({
      readBy: Joi.string().valid('user', 'admin').default('admin')
    })
  },

  // POST /api/conversations/:id/read
  markConversationRead: {
    params: Joi.object({
      id: uuidSchema.required()
    }),
    body: Joi.object({
      readBy: Joi.string().valid('user', 'admin').default('admin')
    })
  },

  // POST /api/admin/push/subscribe
  pushSubscribe: {
    body: Joi.object({
      endpoint: Joi.string().uri().required(),
      keys: Joi.object({
        p256dh: Joi.string().required(),
        auth: Joi.string().required()
      }).required(),
      expirationTime: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.allow(null)
      ).optional()
    })
  },

  // POST /api/admin/test-push
  testPush: {
    body: Joi.object({
      title: Joi.string().max(100).default('Test Notification'),
      body: Joi.string().max(500).default('This is a test push notification'),
      data: Joi.object().optional().default({ test: true })
    })
  },

  // Socket.IO event validation
  socketEvents: {
    joinUser: Joi.object({
      email: emailSchema.required()
    }),

    userMessage: Joi.object({
      conversationId: uuidSchema.required(),
      content: contentSchema.required(),
      email: emailSchema.required()
    }),

    adminMessage: Joi.object({
      conversationId: uuidSchema.required(),
      content: contentSchema.required()
    }),

    adminBroadcast: Joi.object({
      content: contentSchema.required()
    }),

    markConversationRead: Joi.object({
      conversationId: uuidSchema.required()
    }),

    markMessageRead: Joi.object({
      messageId: uuidSchema.required()
    }),

    typing: Joi.object({
      conversationId: uuidSchema.required(),
      email: emailSchema.optional()
    })
  }
};

// Validation middleware factory
export const validate = (schema: {
  params?: Joi.Schema;
  query?: Joi.Schema;
  body?: Joi.Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.message}`);
      } else {
        req.params = value;
      }
    }

    // Validate query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.message}`);
      } else {
        req.query = value;
      }
    }

    // Validate body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.message}`);
      } else {
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

// Socket.IO validation helper
export const validateSocketData = (schema: Joi.Schema, data: any): { isValid: boolean; error?: string; value?: any } => {
  const { error, value } = schema.validate(data);
  
  if (error) {
    return { isValid: false, error: error.message };
  }
  
  return { isValid: true, value };
};

// Sanitization helpers
export const sanitize = {
  // Remove potential XSS content
  content: (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: urls
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .trim();
  },

  // Sanitize email
  email: (str: string): string => {
    return str.toLowerCase().trim();
  },

  // Sanitize UUID
  uuid: (str: string): string => {
    return str.toLowerCase().trim();
  }
};

// Rate limiting data structures
export const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting helper
export const checkRateLimit = (identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Clean up expired rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes