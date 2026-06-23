import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    <mat-nav-list class="sidebar-nav">
      @for (item of menuService.menuItems(); track item.moduleCode) {
        <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styles: [`
    .sidebar-nav { padding-top: 8px; }
    .active-link { background: rgba(30,64,175,0.08); border-right: 3px solid #1e40af; }
  `],
})
export class SidebarComponent implements OnInit {
  readonly menuService = inject(MenuService);

  ngOnInit(): void {
    this.menuService.loadMenu();
  }
}
