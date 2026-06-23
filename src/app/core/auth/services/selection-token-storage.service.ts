import { Injectable, inject } from '@angular/core';
import { LoggerService } from '../../logger/logger.service';

@Injectable({ providedIn: 'root' })
export class SelectionTokenStorageService {
  private readonly logger = inject(LoggerService);
  private readonly SELECTION_TOKEN_KEY = 'selection_token';

  saveSelectionToken(token: string): void {
    sessionStorage.setItem(this.SELECTION_TOKEN_KEY, token);
    this.logger.debug('SelectionTokenStorage', 'Selection token saved');
  }

  getSelectionToken(): string | null {
    return sessionStorage.getItem(this.SELECTION_TOKEN_KEY);
  }

  clearSelectionToken(): void {
    sessionStorage.removeItem(this.SELECTION_TOKEN_KEY);
    this.logger.debug('SelectionTokenStorage', 'Selection token cleared');
  }
}
