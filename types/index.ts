export interface FileData {
  readonly name: string;
  readonly content: string;
  readonly size: number;
  readonly type: string;
  readonly lastModified: number;
  readonly isBinary?: boolean;
}

export interface EncodedData {
  readonly files: readonly FileData[];
  readonly timestamp: number;
  readonly metadata: {
    readonly totalFiles: number;
    readonly totalSize: number;
    readonly encoding: 'base64' | 'utf8';
  };
}

// Utility types for better type safety
export type NonEmptyString = string & { readonly __brand: 'NonEmptyString' };
export type PositiveNumber = number & { readonly __brand: 'PositiveNumber' };
export type SafeInteger = number & { readonly __brand: 'SafeInteger' };

// Validation result types
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// Component prop base types
export interface BaseComponentProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly error?: boolean;
}

// Type guards for runtime validation
export const isNonEmptyString = (value: unknown): value is NonEmptyString => {
  return typeof value === 'string' && value.length > 0;
};

export const isPositiveNumber = (value: unknown): value is PositiveNumber => {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
};

export const isSafeInteger = (value: unknown): value is SafeInteger => {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
};

// File validation
export const isValidFileData = (data: unknown): data is FileData => {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  
  return (
    isNonEmptyString(obj.name) &&
    typeof obj.content === 'string' &&
    isPositiveNumber(obj.size) &&
    typeof obj.type === 'string' &&
    isSafeInteger(obj.lastModified) &&
    (obj.isBinary === undefined || typeof obj.isBinary === 'boolean')
  );
};

// Encoded data validation
export const isValidEncodedData = (data: unknown): data is EncodedData => {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  
  return (
    Array.isArray(obj.files) &&
    obj.files.every(isValidFileData) &&
    isSafeInteger(obj.timestamp) &&
    typeof obj.metadata === 'object' &&
    obj.metadata !== null &&
    isPositiveNumber((obj.metadata as Record<string, unknown>).totalFiles) &&
    isPositiveNumber((obj.metadata as Record<string, unknown>).totalSize) &&
    ['base64', 'utf8'].includes((obj.metadata as Record<string, unknown>).encoding as string)
  );
};

// Safe parsing utilities
export const safeParseInt = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : fallback;
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isSafeInteger(parsed) ? parsed : fallback;
  }
  
  return fallback;
};

export const safeParseFloat = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  
  return fallback;
};

// Error boundary types
export interface ErrorInfo {
  readonly componentStack: string;
  readonly errorBoundary: string;
}

// Application error types
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class FileProcessingError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FILE_PROCESSING_ERROR', context);
    this.name = 'FileProcessingError';
  }
}