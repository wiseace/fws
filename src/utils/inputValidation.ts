/**
 * Comprehensive input validation and sanitization utilities
 * PHASE 3: Enhanced Input Validation
 */

import { sanitizeString, sanitizeEmail, sanitizePhone } from './security';

// Email validation with enhanced security
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  // Enhanced email regex that prevents common bypasses
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Double dots
    /\s/,    // Whitespace
    /@.*@/,  // Multiple @ symbols
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedEmail)) {
      return { isValid: false, error: 'Invalid email format' };
    }
  }

  return { isValid: true };
};

// Password validation with strength requirements
export const validatePassword = (password: string): { isValid: boolean; error?: string; strength?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (strengthScore < 3) {
    return { 
      isValid: false, 
      error: 'Password must contain at least 3 of the following: lowercase letters, uppercase letters, numbers, special characters',
      strength: 'weak'
    };
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { isValid: false, error: 'Password is too common, please choose a more secure password' };
  }

  return { 
    isValid: true, 
    strength: strengthScore === 4 ? 'strong' : 'medium'
  };
};

// Phone number validation
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const sanitized = sanitizePhone(phone);
  
  if (sanitized.length < 7) {
    return { isValid: false, error: 'Phone number is too short' };
  }

  if (sanitized.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }

  // International phone number validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(sanitized.replace(/[\s\-\(\)]/g, ''))) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Name cannot be empty' };
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Name is too long' };
  }

  // Check for valid name characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

// Service description validation
export const validateServiceDescription = (description: string): { isValid: boolean; error?: string } => {
  if (!description || typeof description !== 'string') {
    return { isValid: false, error: 'Description is required' };
  }

  const trimmedDescription = description.trim();
  
  if (trimmedDescription.length < 10) {
    return { isValid: false, error: 'Description must be at least 10 characters long' };
  }

  if (trimmedDescription.length > 1000) {
    return { isValid: false, error: 'Description is too long (maximum 1000 characters)' };
  }

  // Check for suspicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedDescription)) {
      return { isValid: false, error: 'Description contains invalid content' };
    }
  }

  return { isValid: true };
};

// URL validation
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
};

// File validation for uploads
export const validateFile = (file: File, allowedTypes: string[], maxSize: number): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB` };
  }

  return { isValid: true };
};

// Generic form validation helper
export const validateForm = (data: Record<string, unknown>, rules: Record<string, (value: unknown) => { isValid: boolean; error?: string }>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.isValid && result.error) {
      errors[field] = result.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};