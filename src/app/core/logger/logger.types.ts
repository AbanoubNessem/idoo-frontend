export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error';
export type LogCategory = 'api' | 'auth' | 'router' | 'guard' | 'state' | 'storage' | 'context' | 'performance';

export interface LogOptions {
  level?: LogLevel;
  category?: LogCategory;
  data?: any;
  executionTime?: number;
  collapsed?: boolean;
}
