import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="error-state">
      <mat-icon class="error-icon" color="warn">error_outline</mat-icon>
      <p class="error-message">{{ message }}</p>
      @if (showRetry) {
        <button mat-stroked-button color="primary" (click)="retry.emit()">Retry</button>
      }
    </div>
  `,
  styles: [`
    .error-state { display: flex; flex-direction: column; align-items: center; padding: 64px 0; }
    .error-icon { font-size: 48px; width: 48px; height: 48px; }
    .error-message { margin: 12px 0; font-size: 14px; }
  `],
})
export class ErrorStateComponent {
  @Input() message = 'Something went wrong. Please try again.';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
