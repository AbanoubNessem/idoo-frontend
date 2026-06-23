import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailableTenant } from '../../../../core/api/models';

@Component({
  selector: 'app-tenant-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="tenant-card" 
      [class.selected]="selected"
      (click)="onSelect()"
      role="button"
      [attr.aria-pressed]="selected"
      tabindex="0"
      (keydown.enter)="onSelect()"
      (keydown.space)="onSelect(); $event.preventDefault()">
      <div class="tenant-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"></path><path d="M9 8h1"></path><path d="M9 12h1"></path><path d="M9 16h1"></path><path d="M14 8h1"></path><path d="M14 12h1"></path><path d="M14 16h1"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
        </svg>
      </div>
      <div class="tenant-info">
        <span class="tenant-name">{{ tenant.name }}</span>
        <span class="tenant-code">{{ tenant.code }}</span>
      </div>
      <div class="selected-indicator" *ngIf="selected">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .tenant-card {
      display: flex;
      align-items: center;
      padding: var(--spacing-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-surface);
      cursor: pointer;
      transition: all 200ms ease;
      gap: var(--spacing-4);
      position: relative;
    }

    .tenant-card:hover {
      border-color: var(--color-border-hover);
      background-color: var(--color-surface-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .tenant-card:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .tenant-card.selected {
      border: 2px solid var(--color-primary);
      background-color: var(--color-primary-light);
      padding: calc(var(--spacing-4) - 1px); /* Adjust padding to prevent layout shift from thicker border */
    }

    .tenant-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-background);
      border-radius: var(--radius-sm);
      color: var(--color-primary);
    }
    
    .tenant-card.selected .tenant-icon {
      background-color: white;
    }

    .tenant-icon svg {
      width: 24px;
      height: 24px;
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .tenant-name {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 15px;
    }

    .tenant-code {
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-top: 2px;
      font-family: monospace;
    }

    .selected-indicator {
      color: var(--color-primary);
    }

    .selected-indicator svg {
      width: 20px;
      height: 20px;
    }
  `]
})
export class TenantCardComponent {
  @Input() tenant!: AvailableTenant;
  @Input() selected = false;
  @Output() selectTenant = new EventEmitter<AvailableTenant>();

  onSelect(): void {
    this.selectTenant.emit(this.tenant);
  }
}
