import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      @for (item of items; track item.label; let last = $last) {
        @if (item.link && !last) {
          <a [routerLink]="item.link">{{ item.label }}</a>
          <mat-icon class="separator">chevron_right</mat-icon>
        } @else {
          <span class="current">{{ item.label }}</span>
        }
      }
    </nav>
  `,
  styles: [`
    .breadcrumb { display: flex; align-items: center; font-size: 13px; color: #6b7280; }
    .breadcrumb a { color: #6b7280; text-decoration: none; }
    .breadcrumb a:hover { color: var(--mat-sys-primary, #1e40af); }
    .separator { font-size: 16px; width: 16px; height: 16px; margin: 0 4px; }
    .current { color: #111827; font-weight: 500; }
  `],
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
