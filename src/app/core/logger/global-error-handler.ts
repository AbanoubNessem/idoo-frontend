import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const logger = this.injector.get(LoggerService);
    logger.globalError(error, 'GlobalErrorHandler');
    
    // Optionally rethrow if you want the default behavior
    // throw error;
  }
}
