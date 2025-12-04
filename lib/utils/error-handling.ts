// Error types for draft components
export interface DraftError {
  code: string;
  message: string;
  retryable: boolean;
  userMessage: string;
}

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_LOST = 'CONNECTION_LOST',
  
  // Validation errors
  INVALID_LEAGUE_ID = 'INVALID_LEAGUE_ID',
  INVALID_MARKET_ID = 'INVALID_MARKET_ID',
  INVALID_OUTCOME = 'INVALID_OUTCOME',
  
  // Draft state errors
  DRAFT_NOT_FOUND = 'DRAFT_NOT_FOUND',
  DRAFT_ALREADY_STARTED = 'DRAFT_ALREADY_STARTED',
  DRAFT_COMPLETED = 'DRAFT_COMPLETED',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  MARKET_ALREADY_PICKED = 'MARKET_ALREADY_PICKED',
  
  // League errors
  LEAGUE_FULL = 'LEAGUE_FULL',
  LEAGUE_NOT_FOUND = 'LEAGUE_NOT_FOUND',
  ALREADY_JOINED = 'ALREADY_JOINED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export function createDraftError(
  code: ErrorCode,
  message: string,
  userMessage?: string,
  retryable: boolean = false
): DraftError {
  return {
    code,
    message,
    userMessage: userMessage || message,
    retryable
  };
}

export function parseError(error: unknown): DraftErrorClass {
  if (error instanceof DraftErrorClass) {
    return error;
  }
  
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new DraftErrorClass(
        ErrorCode.NETWORK_ERROR,
        error.message,
        'Network connection failed. Please check your internet connection.',
        true
      );
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return new DraftErrorClass(
        ErrorCode.TIMEOUT_ERROR,
        error.message,
        'Request timed out. Please try again.',
        true
      );
    }
    
    // Server errors
    if (error.message.includes('500') || error.message.includes('internal server')) {
      return new DraftErrorClass(
        ErrorCode.SERVER_ERROR,
        error.message,
        'Server error occurred. Please try again later.',
        true
      );
    }
    
    if (error.message.includes('503') || error.message.includes('unavailable')) {
      return new DraftErrorClass(
        ErrorCode.SERVER_UNAVAILABLE,
        error.message,
        'Service is temporarily unavailable. Please try again later.',
        true
      );
    }
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return new DraftErrorClass(
        ErrorCode.RATE_LIMITED,
        error.message,
        'Too many requests. Please wait before trying again.',
        false
      );
    }
  }
  
  // Default unknown error
  return new DraftErrorClass(
    ErrorCode.UNKNOWN_ERROR,
    error instanceof Error ? error.message : 'Unknown error occurred',
    'An unexpected error occurred. Please try again.',
    false
  );
}

export class DraftErrorClass extends Error {
  public readonly code: ErrorCode;
  public readonly retryable: boolean;
  public readonly userMessage: string;

  constructor(code: ErrorCode, message: string, userMessage?: string, retryable: boolean = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.userMessage = userMessage || message;
    this.name = 'DraftError';
  }
}

export function createNetworkError(message: string, userMessage?: string): DraftErrorClass {
  return new DraftErrorClass(
    ErrorCode.NETWORK_ERROR,
    message,
    userMessage || 'Network connection failed. Please check your internet connection.',
    true
  );
}

export function createTimeoutError(message: string, userMessage?: string): DraftErrorClass {
  return new DraftErrorClass(
    ErrorCode.TIMEOUT_ERROR,
    message,
    userMessage || 'Request timed out. Please try again.',
    true
  );
}

export function createLeagueError(code: ErrorCode, message: string, userMessage?: string): DraftErrorClass {
  return new DraftErrorClass(
    code,
    message,
    userMessage || message,
    false
  );
}

export function logError(error: DraftError, context?: Record<string, any>) {
  const logData = {
    error: {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable
    },
    context: context || {},
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', logData);
  } else {
    // In production, you might want to send this to a logging service
    console.error('Error:', error.code, error.message);
  }
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: DraftError, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error, attempt) => error.retryable && attempt < maxAttempts
  } = options;

  let lastError: DraftError | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = parseError(error);
      
      if (!shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || createDraftError(ErrorCode.UNKNOWN_ERROR, 'Operation failed after retries');
}
export function createValidationError(message: string, userMessage?: string): DraftErrorClass {
  return new DraftErrorClass(
    ErrorCode.INVALID_LEAGUE_ID,
    message,
    userMessage || message,
    false
  );
}
