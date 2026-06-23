import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { UserFacade } from '../../../core/api/facades/user.facade';
import { DialogFacadeService } from '../../../core/services/dialog-facade.service';
import { DynamicTableComponent } from '../../../shared/components/dynamic-table/dynamic-table.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { buildUsersTableConfig } from '../shared/users-table.config';
import { PERMISSIONS } from '../../../shared/constants/permissions.constants';
import { UserResponse } from '../../../core/api/models';

@Component({
  selector: 'app-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DynamicTableComponent, PageHeaderComponent, SearchBarComponent],
  template: `
    <app-page-header
      title="Users"
      [breadcrumbs]="[{ label: 'Home', link: '/app' }, { label: 'Users' }]"
      actionLabel="Create User"
      actionIcon="add"
      [actionPermission]="permissions.USERS.CREATE"
      (actionClick)="onCreate()"
    />

    <app-search-bar placeholder="Search by name, email, or username" (searchChange)="onSearch($event)" />

    <app-dynamic-table
      [config]="tableConfig"
      [rowsInput]="users()"
      [totalElementsInput]="totalElements()"
      [loadingInput]="loading()"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSortChange($event)"
    />
  `,
})
export class UsersListComponent implements OnInit {
  private readonly userFacade = inject(UserFacade);
  private readonly dialogFacade = inject(DialogFacadeService);
  private readonly router = inject(Router);

  readonly permissions = PERMISSIONS;
  readonly users = signal<UserResponse[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);

  private page = 0;
  private size = 25;
  private sortKey?: string;
  private sortDirection?: 'asc' | 'desc';
  private searchTerm = '';

  readonly tableConfig = buildUsersTableConfig({
    onEdit: row => this.router.navigate(['/app/users', row.id, 'edit']),
    onDelete: row => this.handleDelete(row),
    onActivate: row => this.userFacade.activateUser(row.id).subscribe(() => this.loadUsers()),
    onDeactivate: row => this.userFacade.deactivateUser(row.id).subscribe(() => this.loadUsers()),
    onUnlock: row => this.userFacade.unlockUser(row.id).subscribe(() => this.loadUsers()),
    onManageRoles: row => this.router.navigate(['/app/users', row.id, 'roles']),
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  onCreate(): void {
    this.router.navigate(['/app/users', 'create']);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    this.sortKey = sort.direction ? sort.active : undefined;
    this.sortDirection = sort.direction as 'asc' | 'desc' | undefined;
    this.loadUsers();
  }

  private handleDelete(row: UserResponse): void {
    this.dialogFacade.confirmDelete('User').subscribe(confirmed => {
      if (confirmed) {
        this.userFacade.deleteUser(row.id).subscribe(() => this.loadUsers());
      }
    });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userFacade.getUsers({
      page: this.page,
      size: this.size,
      sort: this.sortKey,
      direction: this.sortDirection,
    }).subscribe({
      next: result => {
        this.users.set(result.content);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
