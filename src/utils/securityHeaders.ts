/**
 * Security headers and CSRF protection utilities
 * PHASE 4: Authentication Hardening
 */

// Content Security Policy configuration
export const getSecurityHeaders = () => {
  return {
    'Content-Security-Policy': [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com`,
      `img-src 'self' data: https: blob:`,
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
      `media-src 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `upgrade-insecure-requests`
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
};

// Rate limiting configuration
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }
    
    const userRequests = this.requests.get(identifier)!;
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Authentication rate limiters
export const loginRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const signupRateLimiter = new RateLimiter(3, 3600000); // 3 attempts per hour
export const passwordResetRateLimiter = new RateLimiter(3, 900000); // 3 attempts per 15 minutes

// Session security utilities
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Input sanitization for XSS prevention
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Audit logging utility
export const createAuditLog = async (action: string, details: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    details: JSON.stringify(details),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In a production environment, you would send this to a secure logging service
  console.log('Audit Log:', logEntry);
  
  // For now, we'll store critical actions in localStorage for debugging
  if (['login', 'logout', 'role_change', 'user_deletion'].includes(action)) {
    const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only the last 100 entries
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('audit_logs', JSON.stringify(existingLogs));
  }
};
