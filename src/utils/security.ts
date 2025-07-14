/**
 * Security utilities for input validation, sanitization, and authorization
 */

// Input sanitization
export const sanitizeString = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const sanitizeEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();
  return emailRegex.test(sanitized) ? sanitized : '';
};

export const sanitizePhone = (phone: string): string => {
  // Remove all non-numeric characters except + and spaces
  return phone.replace(/[^+\d\s-()]/g, '').trim();
};

// URL validation
export const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// UUID validation
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now]);
      return true;
    }
    
    const userRequests = this.requests.get(identifier)!;
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

// Content Security Policy helper
export const getCSPHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Vite dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  };
};

// Auth token validation
export const validateAuthToken = (token: string): boolean => {
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload (without verification - that's handled by Supabase)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  } catch {
    return false;
  }
};

// Authorization helpers
export const hasAdminRole = (userProfile: any): boolean => {
  return userProfile?.user_type === 'admin' && userProfile?.is_verified === true;
};

export const hasVerifiedStatus = (userProfile: any): boolean => {
  return userProfile?.verification_status === 'verified';
};

export const hasActiveSubscription = (userProfile: any): boolean => {
  if (!userProfile?.subscription_plan || userProfile.subscription_plan === 'free') {
    return false;
  }
  
  if (userProfile.subscription_expiry) {
    return new Date(userProfile.subscription_expiry) > new Date();
  }
  
  return true;
};