import { Injectable, isDevMode, Optional, Inject } from '@angular/core';
import { LOGGER_COLORS, LOGGER_EMOJIS } from './logger.constants';
import { LogCategory, LogLevel } from './logger.types';
import { LOGGER_CONFIG, LoggerConfig } from './logger.config';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private get isEnabled(): boolean {
    return isDevMode();
  }

  constructor(@Optional() @Inject(LOGGER_CONFIG) private config: LoggerConfig) {}

  // --- Basic Levels ---

  debug(contextOrMessage: string, messageOrData?: any, data?: any) {
    this.printCompatible('debug', contextOrMessage, messageOrData, data);
  }

  info(contextOrMessage: string, messageOrData?: any, data?: any) {
    this.printCompatible('info', contextOrMessage, messageOrData, data);
  }

  success(contextOrMessage: string, messageOrData?: any, data?: any) {
    this.printCompatible('success', contextOrMessage, messageOrData, data);
  }

  warn(contextOrMessage: string, messageOrData?: any, data?: any) {
    this.printCompatible('warning', contextOrMessage, messageOrData, data);
  }

  error(contextOrMessage: string, messageOrData?: any, data?: any) {
    this.printCompatible('error', contextOrMessage, messageOrData, data);
  }

  // --- Categories ---

  api(title: string, data?: Record<string, any>, isError = false) {
    this.printCategory('api', title, data, isError);
  }

  auth(title: string, data?: Record<string, any>, isError = false) {
    this.printCategory('auth', title, data, isError);
  }

  router(title: string, data?: Record<string, any>, isError = false) {
    this.printCategory('router', title, data, isError);
  }

  guard(title: string, data?: Record<string, any>, isError = false) {
    this.printCategory('guard', title, data, isError);
  }

  state(title: string, data?: Record<string, any>, isError = false) {
    this.printCategory('state', title, data, isError);
  }

  storage(title: string, data?: Record<string, any>, isError = false) {
    this.printCategory('storage', title, data, isError);
  }

  context(title: string, data?: Record<string, any>, isError = false) {
    this.printCategory('context', title, data, isError);
  }

  performance(title: string, executionTime: number, details?: Record<string, any>) {
    if (!this.isEnabled) return;
    const color = 'color: #8b5cf6; font-weight: bold;'; // Violet
    const emoji = '⏱️';
    
    console.groupCollapsed(`%c${emoji} [PERFORMANCE] ${title}`, color);
    
    const performanceData = {
      ...details,
      ExecutionTime: `${executionTime} ms`
    };
    
    console.table(performanceData);
    
    if (executionTime > 1000) {
      console.warn(`%cSlow API Detected: ${title} took ${executionTime}ms`, 'color: #f97316; font-weight: bold;');
    }
    
    console.groupEnd();
  }
  
  // --- Global Error ---
  globalError(error: any, component?: string) {
    if (!this.isEnabled) return;
    console.group(`%c🔴 [UNHANDLED EXCEPTION]`, LOGGER_COLORS['error']);
    console.table({
      Component: component || 'Global',
      URL: window.location.href,
      Browser: navigator.userAgent,
      Timestamp: new Date().toISOString()
    });
    if (error && typeof error === 'object') {
      console.dir(error);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    console.groupEnd();
  }

  // --- Internal Methods ---

  private printCompatible(level: LogLevel, arg1: string, arg2?: any, arg3?: any) {
    // If 3 arguments are provided (context, message, data)
    if (arg3 !== undefined) {
      this.printBasic(level, `[${arg1}] ${arg2}`, arg3);
    } 
    // If 2 arguments and arg2 is a string, it might be (context, message) without data
    // Or it might be (message, data) where data is a string
    // Let's assume if arg2 is a string and it's not JSON, it's a message, but wait:
    else if (arg2 !== undefined) {
      if (typeof arg2 === 'string') {
        // (context, message)
        this.printBasic(level, `[${arg1}] ${arg2}`);
      } else {
        // (message, data)
        this.printBasic(level, arg1, arg2);
      }
    } 
    // Only 1 argument
    else {
      this.printBasic(level, arg1);
    }
  }

  private printBasic(level: LogLevel, message: string, data?: any) {
    if (!this.isEnabled) return;

    const color = LOGGER_COLORS[level];
    const emoji = LOGGER_EMOJIS[level];
    const label = level.toUpperCase();

    if (data !== undefined) {
      console.groupCollapsed(`%c${emoji} [${label}] ${message}`, color);
      this.printData(data);
      console.groupEnd();
    } else {
      if (level === 'error') {
         console.error(`%c${emoji} [${label}] ${message}`, color);
      } else if (level === 'warning') {
         console.warn(`%c${emoji} [${label}] ${message}`, color);
      } else {
         console.log(`%c${emoji} [${label}] ${message}`, color);
      }
    }
  }

  private printCategory(category: LogCategory, title: string, data?: Record<string, any>, isError = false) {
    if (!this.isEnabled) return;

    const color = LOGGER_COLORS[category] || LOGGER_COLORS['info'];
    const emoji = LOGGER_EMOJIS[category] || LOGGER_EMOJIS['info'];
    const label = category.toUpperCase();

    const bannerStyle = `color: ${isError ? '#ef4444' : '#6b7280'}; font-weight: normal;`;
    const headerStyle = color;
    const errorStyle = LOGGER_COLORS['error'];

    if (isError) {
       console.groupCollapsed(`%c${emoji} [${label}] ${title}`, errorStyle);
    } else {
       console.groupCollapsed(`%c${emoji} [${label}] ${title}`, headerStyle);
    }

    console.log(`%c----------------------------------------------------\n▶ ${label} ${title.toUpperCase()}\n----------------------------------------------------`, bannerStyle);

    if (data !== undefined && data !== null) {
      const sanitizedData = this.sanitizeData(data);
      if (Object.keys(sanitizedData).length > 0) {
        console.table(sanitizedData);
      }
    }

    console.groupEnd();
  }

  private printData(data: any) {
    if (Array.isArray(data)) {
      console.table(this.sanitizeArray(data));
    } else if (typeof data === 'object' && data !== null) {
      console.table(this.sanitizeData(data));
    } else {
      console.dir(data);
    }
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'otp', 'secret', 'key', 'token', 'client_secret', 'private_key', 'jwt'];
    
    Object.keys(sanitized).forEach(k => {
      const lowerKey = k.toLowerCase();
      const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));
      
      if (isSensitive && typeof sanitized[k] === 'string') {
        const val = sanitized[k];
        if (lowerKey.includes('token') && val.length > 20) {
           sanitized[k] = `[REDACTED] Length: ${val.length}`;
        } else {
           sanitized[k] = `[REDACTED]`;
        }
      } else if (typeof sanitized[k] === 'object' && sanitized[k] !== null) {
        if (Array.isArray(sanitized[k])) {
          sanitized[k] = this.sanitizeArray(sanitized[k]);
        } else {
          sanitized[k] = this.sanitizeData(sanitized[k]);
        }
      }
    });
    
    return sanitized;
  }
  
  private sanitizeArray(arr: any[]): any[] {
    return arr.map(item => this.sanitizeData(item));
  }
}
