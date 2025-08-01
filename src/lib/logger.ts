/**
 * Centralized logging service to replace console.* statements
 * Provides structured logging with levels, context, and metadata
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  userId?: string;
  settlementId?: string;
  apiRoute?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    this.minLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.INFO 
      : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level];
    const message = entry.message;
    
    let formatted = `[${timestamp}] ${level}: ${message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      formatted += ` | Error: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\nStack: ${entry.error.stack}`;
      }
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      error
    };

    const formatted = this.formatMessage(entry);

    // Output to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }

    // In production, you might also want to send logs to an external service
    if (process.env.NODE_ENV === 'production' && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
  }

  /**
   * Debug level logging - development only
   */
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging - general information
   */
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging - something unexpected but not fatal
   */
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging - something went wrong
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Time a function execution
   */
  async time<T>(
    operation: string, 
    fn: () => Promise<T>, 
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${operation}`, context);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed ${operation}`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(
        `Failed ${operation}`, 
        error instanceof Error ? error : new Error(String(error)),
        { ...context, duration }
      );
      throw error;
    }
  }

  /**
   * Log API request/response
   */
  apiCall(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ) {
    const level = status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `${method} ${endpoint} - ${status}`, {
      ...context,
      method,
      endpoint,
      status,
      duration
    });
  }

  /**
   * Log database operations
   */
  database(
    operation: string,
    table: string,
    success: boolean,
    duration?: number,
    context?: LogContext
  ) {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    this.log(level, `DB ${operation} on ${table} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      ...context,
      operation,
      table,
      duration
    });
  }

  /**
   * Log settlement operations
   */
  settlement(
    action: string,
    settlementId: string,
    success: boolean,
    context?: LogContext
  ) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `Settlement ${action} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      ...context,
      settlementId,
      operation: action
    });
  }

  /**
   * Log user actions
   */
  userAction(
    userId: string,
    action: string,
    success: boolean,
    context?: LogContext
  ) {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, `User action: ${action} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      ...context,
      userId,
      operation: action
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  time: logger.time.bind(logger),
  apiCall: logger.apiCall.bind(logger),
  database: logger.database.bind(logger),
  settlement: logger.settlement.bind(logger),
  userAction: logger.userAction.bind(logger)
};