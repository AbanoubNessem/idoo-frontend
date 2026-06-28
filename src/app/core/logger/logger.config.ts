import { InjectionToken } from '@angular/core';

export interface LoggerConfig {
  enabled?: boolean;
}

export const LOGGER_CONFIG = new InjectionToken<LoggerConfig>('LOGGER_CONFIG');
