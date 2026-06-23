import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HasPermissionDirective } from '../../directives/permission/has-permission.directive';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, HasPermissionDirective, BreadcrumbComponent],
  template: `
    <header class="page-header">
      <app-breadcrumb [items]="breadcrumbs" />
      <div class="title-row">
        <h1>{{ title }}</h1>
        @if (actionLabel) {
          <button
            mat-raised-button color="primary"
            *hasPermission="actionPermission ?? []"
            (click)="actionClick.emit()"
          >
            @if (actionIcon) { <mat-icon>{{ actionIcon }}</mat-icon> }
            {{ actionLabel }}
          </button>
        }
      </div>
    </header>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .title-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    h1 { font-size: 22px; font-weight: 600; margin: 0; }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() breadcrumbs: { label: string; link?: string }[] = [];
  @Input() actionLabel = '';
  @Input() actionIcon = '';
  @Input() actionPermission = '';
  @Output() actionClick = new EventEmitter<void>();
}
