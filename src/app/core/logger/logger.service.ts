import { Injectable, isDevMode } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentLevel: LogLevel = isDevMode() ? LogLevel.DEBUG : LogLevel.WARN;

  debug(context: string, message: string, data?: any): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      this.formatAndLog('DEBUG', context, message, data);
    }
  }

  info(context: string, message: string, data?: any): void {
    if (this.currentLevel <= LogLevel.INFO) {
      this.formatAndLog('INFO', context, message, data);
    }
  }

  warn(context: string, message: string, data?: any): void {
    if (this.currentLevel <= LogLevel.WARN) {
      this.formatAndLog('WARN', context, message, data);
    }
  }

  error(context: string, message: string, error?: any): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      this.formatAndLog('ERROR', context, message, error);
    }
  }

  private formatAndLog(level: string, context: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${context}] ${message}`;

    if (isDevMode()) {
      switch (level) {
        case 'DEBUG':
          console.debug(formattedMessage, data ? data : '');
          break;
        case 'INFO':
          console.info(formattedMessage, data ? data : '');
          break;
        case 'WARN':
          console.warn(formattedMessage, data ? data : '');
          break;
        case 'ERROR':
          console.error(formattedMessage, data ? data : '');
          break;
      }
    } else {
      // In production, you might want to send this to a remote logging service (e.g., Sentry, Datadog)
      const logEntry = { timestamp, level, context, message, data };
      // Try stringify safely for external transport later if needed
      // console.log(JSON.stringify(logEntry));
    }
  }
}
