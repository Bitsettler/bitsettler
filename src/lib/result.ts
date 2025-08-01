/**
 * Standardized Result<T> type for consistent error handling
 * Replaces the inconsistent patterns throughout the codebase
 */

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type AsyncResult<T> = Promise<Result<T>>;

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function error<T>(message: string, code?: string): Result<T> {
  return { success: false, error: message, code };
}

/**
 * Wrap a function that might throw into a Result
 */
export function tryCatch<T>(fn: () => T): Result<T> {
  try {
    return success(fn());
  } catch (err) {
    return error(err instanceof Error ? err.message : 'Unknown error');
  }
}

/**
 * Wrap an async function that might throw into an AsyncResult
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): AsyncResult<T> {
  try {
    const data = await fn();
    return success(data);
  } catch (err) {
    return error(err instanceof Error ? err.message : 'Unknown error');
  }
}

/**
 * Convert a Result to a NextResponse
 */
export function resultToResponse<T>(result: Result<T>, successStatus = 200, errorStatus = 500) {
  if (result.success) {
    return Response.json({
      success: true,
      data: result.data
    }, { status: successStatus });
  } else {
    return Response.json({
      success: false,
      error: result.error,
      code: result.code
    }, { status: errorStatus });
  }
}

/**
 * Chain multiple Result operations
 */
export function chain<T, U>(
  result: Result<T>, 
  fn: (data: T) => Result<U>
): Result<U> {
  if (result.success) {
    return fn(result.data);
  } else {
    return result as Result<U>;
  }
}

/**
 * Chain multiple AsyncResult operations
 */
export async function chainAsync<T, U>(
  result: AsyncResult<T>, 
  fn: (data: T) => AsyncResult<U>
): AsyncResult<U> {
  const resolvedResult = await result;
  if (resolvedResult.success) {
    return fn(resolvedResult.data);
  } else {
    return resolvedResult as Result<U>;
  }
}

/**
 * Combine multiple Results into one
 */
export function combine<T extends readonly unknown[]>(
  ...results: { [K in keyof T]: Result<T[K]> }
): Result<T> {
  const data: unknown[] = [];
  
  for (const result of results) {
    if (!result.success) {
      return result as Result<T>;
    }
    data.push(result.data);
  }
  
  return success(data as T);
}

/**
 * Map over a Result's data
 */
export function map<T, U>(
  result: Result<T>, 
  fn: (data: T) => U
): Result<U> {
  if (result.success) {
    return success(fn(result.data));
  } else {
    return result as Result<U>;
  }
}

/**
 * Common error codes for consistent error handling
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  
  // API
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
  OPERATION_FAILED: 'OPERATION_FAILED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  BITJITA_API_ERROR: 'BITJITA_API_ERROR',
  
  // System
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];