import { NgModule, ModuleWithProviders, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggerService } from './logger.service';
import { LOGGER_CONFIG, LoggerConfig } from './logger.config';
import { GlobalErrorHandler } from './global-error-handler';

@NgModule({
  imports: [CommonModule],
  providers: [LoggerService]
})
export class LoggerModule {
  static forRoot(config?: LoggerConfig): ModuleWithProviders<LoggerModule> {
    return {
      ngModule: LoggerModule,
      providers: [
        {
          provide: LOGGER_CONFIG,
          useValue: config || { enabled: true }
        },
        LoggerService,
        {
          provide: ErrorHandler,
          useClass: GlobalErrorHandler
        }
      ]
    };
  }
}
