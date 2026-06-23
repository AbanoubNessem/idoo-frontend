import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

interface StatusStyle { label: string; color: string; }

const DEFAULT_STATUS_MAP: Record<string, StatusStyle> = {
  ACTIVE: { label: 'Active', color: '#16a34a' },
  INACTIVE: { label: 'Inactive', color: '#9ca3af' },
  LOCKED: { label: 'Locked', color: '#dc2626' },
  PENDING: { label: 'Pending', color: '#d97706' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatChipsModule],
  template: `<mat-chip [style.background]="style.color" class="status-chip">{{ style.label }}</mat-chip>`,
  styles: [`.status-chip { color: #fff; font-size: 12px; height: 24px; }`],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: string;
  @Input() statusMap: Record<string, StatusStyle> = DEFAULT_STATUS_MAP;

  get style(): StatusStyle {
    return this.statusMap[this.status] ?? { label: this.status, color: '#6b7280' };
  }
}
