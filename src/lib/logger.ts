/**
 * Production-Ready Structured Logging System
 * 
 * Provides:
 * - Structured logging with log levels
 * - Context and metadata support
 * - Environment-aware logging (development vs production)
 * - Request tracing and correlation IDs
 * - Error handling and formatting
 * - Performance timing utilities
 */

// ===== TYPES =====

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  settlementId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: string;
}

// ===== CONFIGURATION =====

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Get minimum log level from environment
const getMinLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }
  // Default to 'info' in production, 'debug' in development
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const MIN_LOG_LEVEL = getMinLogLevel();
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_BROWSER = typeof window !== 'undefined';

// ===== UTILITIES =====

/**
 * Generate a simple correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Format error object for logging
 */
function formatError(error: Error | unknown): LogEntry['error'] {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: IS_DEVELOPMENT ? error.stack : undefined
    };
  }
  
  return {
    name: 'UnknownError',
    message: String(error)
  };
}

/**
 * Create structured log entry
 */
function createLogEntry(
  level: LogLevel, 
  message: string, 
  context?: LogContext,
  error?: Error | unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error ? formatError(error) : undefined,
    environment: process.env.NODE_ENV || 'unknown'
  };
}

/**
 * Should log based on level filtering
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Format log entry for console output (development)
 */
function formatForConsole(entry: LogEntry): void {
  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  }[entry.level];
  
  const contextStr = entry.context ? 
    ` | ${Object.entries(entry.context)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ')}`
    : '';
  
  const logMessage = `${emoji} ${entry.message}${contextStr}`;
  
  // Use appropriate console method
  const consoleMethod = entry.level === 'error' ? console.error :
                       entry.level === 'warn' ? console.warn :
                       console.log;
  
  if (entry.error) {
    consoleMethod(logMessage, entry.error);
  } else {
    consoleMethod(logMessage);
  }
}

/**
 * Send log to production logging service (placeholder)
 */
function sendToLoggingService(entry: LogEntry): void {
  // In production, this would send to your logging service
  // e.g., DataDog, LogRocket, Sentry, etc.
  
  // For now, we'll use structured console output for production
  if (!IS_BROWSER) {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown): void {
  if (!shouldLog(level)) return;
  
  const entry = createLogEntry(level, message, context, error);
  
  if (IS_DEVELOPMENT) {
    formatForConsole(entry);
  } else {
    sendToLoggingService(entry);
  }
}

// ===== PUBLIC API =====

export class Logger {
  private baseContext: LogContext;
  
  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
  }
  
  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.baseContext, ...additionalContext });
  }
  
  /**
   * Add context that will be included in all subsequent logs
   */
  withContext(context: LogContext): Logger {
    return this.child(context);
  }
  
  /**
   * Debug level logging (development only by default)
   */
  debug(message: string, context?: LogContext, error?: Error | unknown): void {
    log('debug', message, { ...this.baseContext, ...context }, error);
  }
  
  /**
   * Info level logging
   */
  info(message: string, context?: LogContext, error?: Error | unknown): void {
    log('info', message, { ...this.baseContext, ...context }, error);
  }
  
  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext, error?: Error | unknown): void {
    log('warn', message, { ...this.baseContext, ...context }, error);
  }
  
  /**
   * Error level logging
   */
  error(message: string, context?: LogContext, error?: Error | unknown): void {
    log('error', message, { ...this.baseContext, ...context }, error);
  }
  
  /**
   * Time an operation
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration });
    };
  }
  
  /**
   * Log the start of an operation
   */
  startOperation(operation: string, context?: LogContext): Logger {
    const operationLogger = this.child({ operation, ...context });
    operationLogger.info(`Starting ${operation}`);
    return operationLogger;
  }
  
  /**
   * Log the completion of an operation
   */
  completeOperation(operation: string, context?: LogContext): void {
    this.info(`Completed ${operation}`, context);
  }
  
  /**
   * Log an API request
   */
  logRequest(method: string, url: string, context?: LogContext): void {
    this.info(`${method} ${url}`, { 
      operation: 'api_request',
      method,
      url,
      ...context 
    });
  }
  
  /**
   * Log an API response
   */
  logResponse(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : 'info';
    log(level, `${method} ${url} ${status}`, { 
      operation: 'api_response',
      method,
      url,
      status,
      duration,
      ...this.baseContext,
      ...context 
    });
  }
  
  /**
   * Log authentication events
   */
  logAuth(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, {
      operation: 'authentication',
      userId,
      ...context
    });
  }
  
  /**
   * Log database operations
   */
  logDatabase(operation: string, table?: string, context?: LogContext): void {
    this.debug(`Database: ${operation}`, {
      operation: 'database',
      table,
      ...context
    });
  }
  
  /**
   * Log business logic events
   */
  logBusiness(event: string, context?: LogContext): void {
    this.info(`Business: ${event}`, {
      operation: 'business_logic',
      ...context
    });
  }
}

// ===== DEFAULT INSTANCES =====

// Default logger instance
export const logger = new Logger();

// Specialized loggers for different areas
export const apiLogger = new Logger({ component: 'api' });
export const authLogger = new Logger({ component: 'auth' });
export const dbLogger = new Logger({ component: 'database' });
export const settlementLogger = new Logger({ component: 'settlement' });
export const treasuryLogger = new Logger({ component: 'treasury' });

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Quick logging functions for simple cases
 */
export const log_debug = (message: string, context?: LogContext) => logger.debug(message, context);
export const log_info = (message: string, context?: LogContext) => logger.info(message, context);
export const log_warn = (message: string, context?: LogContext) => logger.warn(message, context);
export const log_error = (message: string, context?: LogContext, error?: Error | unknown) => logger.error(message, context, error);

/**
 * Create operation timer
 */
export const timeOperation = (label: string) => logger.time(label);

/**
 * Create logger for API route
 */
export function createApiLogger(route: string, requestId?: string): Logger {
  return apiLogger.child({ 
    route,
    requestId: requestId || generateCorrelationId()
  });
}

/**
 * Create logger for settlement operations
 */
export function createSettlementLogger(settlementId: string, operation?: string): Logger {
  return settlementLogger.child({ 
    settlementId,
    operation
  });
}

/**
 * Create logger for user operations
 */
export function createUserLogger(userId: string, operation?: string): Logger {
  return authLogger.child({ 
    userId,
    operation
  });
}

// ===== MIDDLEWARE HELPERS =====

/**
 * Extract request ID from headers or generate one
 */
export function getRequestId(request: Request): string {
  // Try to get from standard headers first
  const headerRequestId = request.headers.get('x-request-id') || 
                         request.headers.get('x-correlation-id') ||
                         request.headers.get('request-id');
  
  return headerRequestId || generateCorrelationId();
}

/**
 * Create logger for API route with automatic request context
 */
export function createRequestLogger(request: Request, route: string): Logger {
  const requestId = getRequestId(request);
  const method = request.method;
  const url = new URL(request.url).pathname;
  
  return createApiLogger(route, requestId).child({
    method,
    url
  });
}