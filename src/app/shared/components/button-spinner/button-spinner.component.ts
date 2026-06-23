import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [type]="type" 
      [class]="buttonClass" 
      [disabled]="disabled || loading"
      (click)="onClick($event)">
      <span class="content" [class.invisible]="loading">
        <ng-content></ng-content>
      </span>
      <span class="spinner-container" *ngIf="loading">
        <svg class="spinner" viewBox="0 0 50 50">
          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
        </svg>
      </span>
    </button>
  `,
  styles: [`
    button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px var(--spacing-6);
      border-radius: var(--radius-md);
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      width: 100%;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(15, 98, 254, 0.2);
    }
    
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(15, 98, 254, 0.3);
    }
    
    .btn-secondary {
      background-color: transparent;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: var(--color-surface-hover);
      border-color: var(--color-border-hover);
    }
    
    button:disabled {
      background-color: var(--color-border);
      color: var(--color-text-secondary);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .content {
      transition: opacity 0.2s;
    }
    
    .invisible {
      opacity: 0;
    }
    
    .spinner-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .spinner {
      animation: rotate 2s linear infinite;
      width: 24px;
      height: 24px;
    }
    
    .path {
      stroke: currentColor;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }
    
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
    
    @keyframes dash {
      0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }
  `]
})
export class ButtonSpinnerComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() buttonClass = 'btn-primary';
  @Input() disabled = false;
  @Input() loading = false;

  onClick(event: Event): void {
    if (this.loading || this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
