"use client"

import { 
  ValidationResult, 
  isNonEmptyString,
  isPositiveNumber,
  isSafeInteger 
} from '@/types';

// File validation constants
export const FILE_VALIDATION = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'text/plain',
    'application/json',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'text/xml',
    'application/xml',
    'application/zip',
    'application/x-zip-compressed'
  ],
  MAX_FILENAME_LENGTH: 255,
  DANGEROUS_EXTENSIONS: ['.exe', '.bat', '.com', '.scr', '.pif', '.cmd']
} as const;

// Text validation constants
export const TEXT_VALIDATION = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 1000000, // 1MB of text
  ENCODING_THRESHOLD: 100000, // Show warning above 100KB
} as const;

/**
 * Validates file data for security and size constraints
 */
export const validateFile = (file: File): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file existence
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors, warnings };
  }

  // Validate file name
  if (!isNonEmptyString(file.name)) {
    errors.push('File name is required');
  } else {
    if (file.name.length > FILE_VALIDATION.MAX_FILENAME_LENGTH) {
      errors.push(`File name too long (max: ${FILE_VALIDATION.MAX_FILENAME_LENGTH} characters)`);
    }

    // Check for dangerous extensions
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isDangerous = FILE_VALIDATION.DANGEROUS_EXTENSIONS.some(dangerousExt => 
      extension === dangerousExt
    );
    if (isDangerous) {
      errors.push(`Potentially dangerous file type: ${extension}`);
    }
  }

  // Validate file size
  if (!isPositiveNumber(file.size)) {
    errors.push('Invalid file size');
  } else {
    if (file.size > FILE_VALIDATION.MAX_SIZE) {
      errors.push(`File too large (max: ${FILE_VALIDATION.MAX_SIZE / 1024 / 1024}MB)`);
    }
    
    if (file.size > FILE_VALIDATION.MAX_SIZE / 2) {
      warnings.push('Large file - encoding may take longer');
    }
  }

  // Validate file type
  if (file.type && !FILE_VALIDATION.ALLOWED_TYPES.includes(file.type as typeof FILE_VALIDATION.ALLOWED_TYPES[number])) {
    warnings.push(`Unverified file type: ${file.type}`);
  }

  // Check last modified time
  if (!isSafeInteger(file.lastModified)) {
    warnings.push('Invalid file modification date');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates multiple files collectively
 */
export const validateFiles = (files: FileList | File[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!files || files.length === 0) {
    errors.push('At least one file is required');
    return { isValid: false, errors, warnings };
  }

  const fileArray = Array.from(files);
  let totalSize = 0;
  const fileNames = new Set<string>();

  // Validate each file
  fileArray.forEach((file, index) => {
    const validation = validateFile(file);
    
    // Add prefixed errors and warnings
    validation.errors.forEach(error => {
      errors.push(`File ${index + 1} (${file.name}): ${error}`);
    });
    
    validation.warnings.forEach(warning => {
      warnings.push(`File ${index + 1} (${file.name}): ${warning}`);
    });

    // Check for duplicate names
    if (fileNames.has(file.name)) {
      warnings.push(`Duplicate filename: ${file.name}`);
    }
    fileNames.add(file.name);

    totalSize += file.size || 0;
  });

  // Validate total size
  if (totalSize > FILE_VALIDATION.MAX_TOTAL_SIZE) {
    errors.push(`Total files too large (max: ${FILE_VALIDATION.MAX_TOTAL_SIZE / 1024 / 1024}MB)`);
  }

  // Performance warnings
  if (fileArray.length > 100) {
    warnings.push('Large number of files - processing may be slow');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates text input for encoding
 */
export const validateTextInput = (text: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof text !== 'string') {
    errors.push('Text must be a string');
    return { isValid: false, errors, warnings };
  }

  // Check length constraints
  if (text.length < TEXT_VALIDATION.MIN_LENGTH) {
    errors.push('Text cannot be empty');
  }

  if (text.length > TEXT_VALIDATION.MAX_LENGTH) {
    errors.push(`Text too long (max: ${TEXT_VALIDATION.MAX_LENGTH} characters)`);
  }

  // Performance warnings
  if (text.length > TEXT_VALIDATION.ENCODING_THRESHOLD) {
    warnings.push('Large text - encoding may take longer');
  }

  // Content warnings
  if (text.includes('\x00')) {
    warnings.push('Text contains null bytes - may cause encoding issues');
  }

  // Check for potentially problematic characters
  const problematicChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g);
  if (problematicChars && problematicChars.length > 0) {
    warnings.push(`Text contains ${problematicChars.length} control characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates base64 encoded string
 */
export const validateBase64 = (base64: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isNonEmptyString(base64)) {
    errors.push('Base64 string is required');
    return { isValid: false, errors, warnings };
  }

  // Check base64 format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64)) {
    errors.push('Invalid base64 format');
  }

  // Check length (base64 length should be multiple of 4)
  if (base64.length % 4 !== 0) {
    errors.push('Invalid base64 length');
  }

  // Performance warnings
  if (base64.length > 100000) {
    warnings.push('Large base64 data - decoding may take longer');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Safe validation wrapper that catches and handles errors
 */
export const safeValidate = <T>(
  validator: (input: T) => ValidationResult,
  input: T,
  fallbackMessage = 'Validation failed'
): ValidationResult => {
  try {
    return validator(input);
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : fallbackMessage],
      warnings: []
    };
  }
};

/**
 * Creates a validation function with custom rules
 */
export const createValidator = <T>(
  rules: Array<(input: T) => ValidationResult>
) => {
  return (input: T): ValidationResult => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const rule of rules) {
      const result = safeValidate(rule, input);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: [...new Set(allErrors)], // Remove duplicates
      warnings: [...new Set(allWarnings)] // Remove duplicates
    };
  };
};