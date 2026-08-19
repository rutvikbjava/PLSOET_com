/**
 * Application Logger
 * 
 * Provides structured logging with different levels.
 * In production, sensitive data should be filtered.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use console methods for better readability
    if (this.isDevelopment) {
      switch (level) {
        case 'error':
          console.error(`[${timestamp}] ERROR:`, message, context || '');
          break;
        case 'warn':
          console.warn(`[${timestamp}] WARN:`, message, context || '');
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.log(`[${timestamp}] INFO:`, message, context || '');
          break;
        case 'debug':
          // eslint-disable-next-line no-console
          console.log(`[${timestamp}] DEBUG:`, message, context || '');
          break;
      }
    } else {
      // In production, use structured JSON logging
      // This can be consumed by log aggregation services
      console.error(JSON.stringify(logData));
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        name: error.name,
      } : error,
    };
    this.log('error', message, errorContext);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
