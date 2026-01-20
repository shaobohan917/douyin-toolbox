const fs = require('fs-extra');
const path = require('path');

const logger = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
  },
  currentLevel: 2,

  setLevel(level) {
    this.currentLevel = this.levels[level] ?? 2;
  },

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
  },

  error(message, meta = {}) {
    if (this.currentLevel >= this.levels.error) {
      console.error(this.formatMessage('error', message, meta));
    }
  },

  warn(message, meta = {}) {
    if (this.currentLevel >= this.levels.warn) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  },

  info(message, meta = {}) {
    if (this.currentLevel >= this.levels.info) {
      console.log(this.formatMessage('info', message, meta));
    }
  },

  debug(message, meta = {}) {
    if (this.currentLevel >= this.levels.debug) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  },

  trace(message, meta = {}) {
    if (this.currentLevel >= this.levels.trace) {
      console.trace(this.formatMessage('trace', message, meta));
    }
  }
};

const errorHandler = {
  handle(error, ctx = null) {
    const status = error.status || error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    logger.error(`Error: ${message}`, {
      status,
      stack: error.stack,
      path: ctx?.path,
      method: ctx?.method
    });

    return {
      success: false,
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
  },

  createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
  }
};

const requestLogger = {
  async log(ctx, next) {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;
    const { method, url, status } = ctx;

    if (status >= 400) {
      logger.warn(`${method} ${url} ${status} - ${duration}ms`);
    } else {
      logger.info(`${method} ${url} ${status} - ${duration}ms`);
    }
  }
};

const responseTime = {
  async log(ctx, next) {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    ctx.set('X-Response-Time', `${duration}ms`);
  }
};

const rateLimiter = {
  windows: new Map(),

  create(options = {}) {
    const {
      windowMs = 60000,
      maxRequests = 100,
      keyGenerator = (ctx) => ctx.ip,
      message = 'Too many requests'
    } = options;

    return async (ctx, next) => {
      const key = keyGenerator(ctx);
      const now = Date.now();

      if (!this.windows.has(key)) {
        this.windows.set(key, { count: 0, resetTime: now + windowMs });
      }

      const window = this.windows.get(key);

      if (now > window.resetTime) {
        window.count = 0;
        window.resetTime = now + windowMs;
      }

      window.count++;

      if (window.count > maxRequests) {
        ctx.status = 429;
        ctx.body = {
          success: false,
          message,
          retryAfter: Math.ceil((window.resetTime - now) / 1000)
        };
        return;
      }

      await next();
    };
  },

  cleanup() {
    const now = Date.now();
    for (const [key, window] of this.windows) {
      if (now > window.resetTime) {
        this.windows.delete(key);
      }
    }
  }
};

const validator = {
  validate(data, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({ field, message: `${field} must be a valid email` });
        }

        if (rule.type === 'url' && !/^https?:\/\//i.test(value)) {
          errors.push({ field, message: `${field} must be a valid URL` });
        }

        if (rule.minLength && value.length < rule.minLength) {
          errors.push({ field, message: `${field} must be at least ${rule.minLength} characters` });
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({ field, message: `${field} must be at most ${rule.maxLength} characters` });
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({ field, message: rule.message || `${field} is invalid` });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

const cache = {
  store: new Map(),

  set(key, value, ttlMs = 300000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  },

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  },

  delete(key) {
    this.store.delete(key);
  },

  clear() {
    this.store.clear();
  },

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
};

setInterval(() => cache.cleanup(), 60000);
setInterval(() => rateLimiter.cleanup(), 60000);

module.exports = {
  logger,
  errorHandler,
  requestLogger,
  responseTime,
  rateLimiter,
  validator,
  cache
};
