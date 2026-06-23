import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <p class="empty-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px 0; color: var(--mat-sys-on-surface-variant, #6b7280); }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }
    .empty-message { margin-top: 12px; font-size: 14px; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() message = 'No data available';
}
