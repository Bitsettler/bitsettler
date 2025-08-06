/**
 * Comprehensive Input Validation and Sanitization Library
 * 
 * Provides type-safe validation, sanitization, and business rule enforcement
 * for all API endpoints to prevent injection attacks and ensure data integrity.
 */

import { NextRequest } from 'next/server';

// ===== TYPES =====

export interface ValidationRule<T> {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'email';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean | string;
  sanitize?: boolean;
  allowedValues?: T[];
}

export interface ValidationSchema {
  [key: string]: ValidationRule<any>;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// ===== CONSTANTS =====

const MAX_STRING_LENGTH = 10000; // Prevent huge payload attacks
const MAX_ARRAY_LENGTH = 1000;   // Prevent array overflow attacks

// Common patterns
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const ALPHANUMERIC_PATTERN = /^[a-zA-Z0-9\s-_]+$/;

// ===== SANITIZATION =====

/**
 * Sanitize string input to prevent XSS and other injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode
    .normalize('NFC')
    // Limit length
    .slice(0, MAX_STRING_LENGTH);
}

/**
 * Sanitize HTML content (basic XSS prevention)
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return sanitizeString(input)
    .replace(/[<>\"'&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    });
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(value: string): boolean {
  return typeof value === 'string' && EMAIL_PATTERN.test(value);
}

/**
 * Validate invite code format
 */
export function isValidInviteCode(value: string): boolean {
  return typeof value === 'string' && INVITE_CODE_PATTERN.test(value);
}

/**
 * Validate that a value is a safe string (alphanumeric + basic chars)
 */
export function isSafeString(value: string): boolean {
  return typeof value === 'string' && ALPHANUMERIC_PATTERN.test(value);
}

/**
 * Validate individual field against its rule
 */
function validateField(value: any, rule: ValidationRule<any>, fieldName: string): string[] {
  const errors: string[] = [];
  
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return errors; // Don't validate further if required field is missing
  }
  
  // Skip further validation if field is not required and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return errors;
  }
  
  // Type validation
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${fieldName} must be a valid number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
        } else if (value.length > MAX_ARRAY_LENGTH) {
          errors.push(`${fieldName} array too large (max ${MAX_ARRAY_LENGTH} items)`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push(`${fieldName} must be an object`);
        }
        break;
      case 'uuid':
        if (!isValidUUID(value)) {
          errors.push(`${fieldName} must be a valid UUID`);
        }
        break;
      case 'email':
        if (!isValidEmail(value)) {
          errors.push(`${fieldName} must be a valid email address`);
        }
        break;
    }
  }
  
  // String-specific validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }
  }
  
  // Number-specific validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${fieldName} must be at least ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${fieldName} must be no more than ${rule.max}`);
    }
  }
  
  // Allowed values validation
  if (rule.allowedValues && !rule.allowedValues.includes(value)) {
    errors.push(`${fieldName} must be one of: ${rule.allowedValues.join(', ')}`);
  }
  
  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      errors.push(typeof customResult === 'string' ? customResult : `${fieldName} is invalid`);
    }
  }
  
  return errors;
}

/**
 * Validate object against schema
 */
export function validate<T>(data: any, schema: ValidationSchema): ValidationResult<T> {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      errors: ['Data must be an object']
    };
  }
  
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  // Validate each field in schema
  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data[fieldName];
    const fieldErrors = validateField(value, rule, fieldName);
    errors.push(...fieldErrors);
    
    // Sanitize if validation passed and sanitization is enabled
    if (fieldErrors.length === 0 && value !== undefined) {
      if (rule.sanitize && typeof value === 'string') {
        sanitizedData[fieldName] = sanitizeString(value);
      } else {
        sanitizedData[fieldName] = value;
      }
    }
  }
  
  // Check for unexpected fields (security measure)
  const allowedFields = Object.keys(schema);
  const actualFields = Object.keys(data);
  const unexpectedFields = actualFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }
  
  return {
    success: true,
    data: sanitizedData as T
  };
}

/**
 * Validate and parse request body with schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ValidationSchema
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validate<T>(body, schema);
  } catch (err) {
    return {
      success: false,
      errors: ['Invalid JSON in request body']
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  schema: ValidationSchema
): ValidationResult<Record<string, any>> {
  const data: Record<string, any> = {};
  
  // Convert URLSearchParams to object
  for (const [key, value] of searchParams.entries()) {
    data[key] = value;
  }
  
  return validate<Record<string, any>>(data, schema);
}

// ===== COMMON SCHEMAS =====

export const SETTLEMENT_SCHEMAS = {
  join: {
    inviteCode: {
      required: true,
      type: 'string' as const,
      minLength: 6,
      maxLength: 6,
      pattern: INVITE_CODE_PATTERN,
      sanitize: true,
      custom: (value: string) => value.toUpperCase() === value || 'Invite code must be uppercase'
    }
  },
  
  claimCharacter: {
    playerEntityId: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      pattern: /^[0-9]+$/,  // BitJita player_entity_id are numeric strings
      sanitize: true
    },
    settlementId: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true
    },
    displayName: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true
    },
    primaryProfession: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true
    },
    secondaryProfession: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true
    },
    replaceExisting: {
      required: false,
      type: 'boolean' as const,
      default: false
    }
  },
  
  contribution: {
    projectId: {
      required: true,
      type: 'uuid' as const
    },
    itemName: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
      sanitize: true
    },
    quantity: {
      required: true,
      type: 'number' as const,
      min: 1,
      max: 10000 // Reasonable limit to prevent abuse
    },
    contributionType: {
      required: true,
      type: 'string' as const,
      allowedValues: ['Direct', 'Crafted', 'Purchased']
    },
    deliveryMethod: {
      required: true,
      type: 'string' as const,
      allowedValues: ['Dropbox', 'Officer Handoff', 'Added to Building', 'Other']
    },
    notes: {
      required: false,
      type: 'string' as const,
      maxLength: 500,
      sanitize: true
    }
  },
  
  search: {
    query: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
      sanitize: true
    },
    limit: {
      required: false,
      type: 'number' as const,
      min: 1,
      max: 100
    }
  }
} as const;

export const USER_SCHEMAS = {
  profile: {
    displayName: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      sanitize: true,
      pattern: /^[a-zA-Z0-9\s-_]+$/ // Safe characters only
    },
    bio: {
      required: false,
      type: 'string' as const,
      maxLength: 500,
      sanitize: true
    }
  }
} as const;