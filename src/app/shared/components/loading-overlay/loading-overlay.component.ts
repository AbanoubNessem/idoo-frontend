import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (visible) {
      <div class="loading-overlay" [class.fullscreen]="fullscreen">
        <mat-spinner [diameter]="diameter" />
        @if (message) { <p class="loading-message">{{ message }}</p> }
      </div>
    }
  `,
  styles: [`
    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(255,255,255,0.7); position: absolute; inset: 0; z-index: 10; }
    .loading-overlay.fullscreen { position: fixed; }
    .loading-message { font-size: 13px; color: #6b7280; }
  `],
})
export class LoadingOverlayComponent {
  @Input() visible = false;
  @Input() fullscreen = false;
  @Input() message = '';
  @Input() diameter = 40;
}
