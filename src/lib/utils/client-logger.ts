/**
 * Client-side logging utilities for React components
 * Provides structured logging for frontend operations
 */

export enum ClientLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface ClientLogContext {
  component?: string;
  settlementId?: string;
  userId?: string;
  operation?: string;
  count?: number;
  duration?: number;
  [key: string]: unknown;
}

class ClientLogger {
  private minLevel: ClientLogLevel;

  constructor() {
    // Set log level based on environment
    this.minLevel = process.env.NODE_ENV === 'production' 
      ? ClientLogLevel.WARN  // Only warn/error in production for client
      : ClientLogLevel.DEBUG;
  }

  private shouldLog(level: ClientLogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: ClientLogLevel, message: string, context?: ClientLogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = ClientLogLevel[level];
    
    let formatted = `[${timestamp}] ${levelStr}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return formatted;
  }

  private log(level: ClientLogLevel, message: string, context?: ClientLogContext, error?: Error) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, context);

    // Output to appropriate console method
    switch (level) {
      case ClientLogLevel.DEBUG:
        console.debug(formatted);
        break;
      case ClientLogLevel.INFO:
        console.info(formatted);
        break;
      case ClientLogLevel.WARN:
        console.warn(formatted);
        break;
      case ClientLogLevel.ERROR:
        console.error(formatted, error?.stack || '');
        break;
    }

    // In production, you might also want to send critical errors to an external service
    if (process.env.NODE_ENV === 'production' && level >= ClientLogLevel.ERROR) {
      this.sendToExternalService({ level, message, context, error, timestamp: new Date().toISOString() });
    }
  }

  private sendToExternalService(entry: { level: ClientLogLevel; message: string; context?: ClientLogContext; error?: Error; timestamp: string }) {
    // TODO: Implement external logging service integration
    // Examples: Sentry for client-side errors, LogRocket for user sessions
  }

  /**
   * Debug level logging - development only
   */
  debug(message: string, context?: ClientLogContext) {
    this.log(ClientLogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging - general information
   */
  info(message: string, context?: ClientLogContext) {
    this.log(ClientLogLevel.INFO, message, context);
  }

  /**
   * Warning level logging - something unexpected but not fatal
   */
  warn(message: string, context?: ClientLogContext) {
    this.log(ClientLogLevel.WARN, message, context);
  }

  /**
   * Error level logging - something went wrong
   */
  error(message: string, error?: Error, context?: ClientLogContext) {
    this.log(ClientLogLevel.ERROR, message, context, error);
  }

  /**
   * Component lifecycle logging
   */
  componentMount(componentName: string, context?: ClientLogContext) {
    this.debug(`Component mounted: ${componentName}`, {
      ...context,
      component: componentName,
      lifecycle: 'mount'
    });
  }

  componentUnmount(componentName: string, context?: ClientLogContext) {
    this.debug(`Component unmounted: ${componentName}`, {
      ...context,
      component: componentName,
      lifecycle: 'unmount'
    });
  }

  /**
   * User interaction logging
   */
  userAction(action: string, success: boolean, context?: ClientLogContext) {
    const level = success ? ClientLogLevel.INFO : ClientLogLevel.WARN;
    this.log(level, `User action: ${action} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      ...context,
      action,
      success
    });
  }

  /**
   * API call logging for frontend
   */
  apiCall(endpoint: string, status: number, duration?: number, context?: ClientLogContext) {
    const level = status >= 400 ? ClientLogLevel.WARN : ClientLogLevel.INFO;
    this.log(level, `API call: ${endpoint} - ${status}`, {
      ...context,
      endpoint,
      status,
      duration
    });
  }
}

// Export singleton instance for client-side use
export const clientLogger = new ClientLogger();

// Export convenience object for easier importing
export const clog = {
  debug: clientLogger.debug.bind(clientLogger),
  info: clientLogger.info.bind(clientLogger),
  warn: clientLogger.warn.bind(clientLogger),
  error: clientLogger.error.bind(clientLogger),
  userAction: clientLogger.userAction.bind(clientLogger),
  apiCall: clientLogger.apiCall.bind(clientLogger),
  componentMount: clientLogger.componentMount.bind(clientLogger),
  componentUnmount: clientLogger.componentUnmount.bind(clientLogger)
};