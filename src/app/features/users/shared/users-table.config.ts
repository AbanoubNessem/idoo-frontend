import { TableConfig } from '../../../shared/models/dynamic-table.models';
import { PERMISSIONS } from '../../../shared/constants/permissions.constants';
import { UserResponse } from '../../../core/api/models';

/**
 * Declarative table config for the Users listing screen.
 * Passed straight into <app-dynamic-table>. No bespoke "UsersTableComponent" needed.
 */
export function buildUsersTableConfig(handlers: {
  onEdit: (row: UserResponse) => void;
  onDelete: (row: UserResponse) => void;
  onActivate: (row: UserResponse) => void;
  onDeactivate: (row: UserResponse) => void;
  onUnlock: (row: UserResponse) => void;
  onManageRoles: (row: UserResponse) => void;
}): TableConfig<UserResponse> {
  return {
    trackByKey: 'id',
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    searchable: true,
    searchPlaceholder: 'Search by name, email, or username',
    createPermission: PERMISSIONS.USERS.CREATE,
    createLabel: 'Create User',
    columns: [
      { id: 'username', accessor: 'username', header: 'Username', sortable: true },
      { id: 'fullName', header: 'Full Name', valueMapper: r => `${r.firstName} ${r.lastName}` },
      { id: 'email', accessor: 'email', header: 'Email', sortable: true },
      {
        id: 'status', accessor: 'status', header: 'Status', type: 'badge', sortable: true,
        badgeConfig: {
          ACTIVE: { label: 'Active', color: '#16a34a' },
          INACTIVE: { label: 'Inactive', color: '#9ca3af' },
          LOCKED: { label: 'Locked', color: '#dc2626' },
          PENDING: { label: 'Pending', color: '#d97706' },
        },
      },
      { id: 'lastLoginAt', accessor: 'lastLoginAt', header: 'Last Login', type: 'datetime', sortable: true },
    ],
    filters: [
      {
        key: 'status', label: 'Status', type: 'select',
        options: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
          { label: 'Locked', value: 'LOCKED' },
          { label: 'Pending', value: 'PENDING' },
        ],
      },
    ],
    actions: [
      { key: 'edit', label: 'Edit', icon: 'edit', permission: PERMISSIONS.USERS.UPDATE, handler: handlers.onEdit },
      { key: 'roles', label: 'Manage Roles', icon: 'admin_panel_settings', permission: PERMISSIONS.USERS.MANAGE_ROLES, handler: handlers.onManageRoles },
      { key: 'activate', label: 'Activate', icon: 'check_circle', permission: PERMISSIONS.USERS.ACTIVATE, hidden: r => r.status === 'ACTIVE', handler: handlers.onActivate },
      { key: 'deactivate', label: 'Deactivate', icon: 'block', permission: PERMISSIONS.USERS.DEACTIVATE, hidden: r => r.status !== 'ACTIVE', handler: handlers.onDeactivate },
      { key: 'unlock', label: 'Unlock', icon: 'lock_open', permission: PERMISSIONS.USERS.UNLOCK, hidden: r => (r.status as string) !== 'LOCKED', handler: handlers.onUnlock },
      { key: 'delete', label: 'Delete', icon: 'delete', color: 'warn', permission: PERMISSIONS.USERS.DELETE, handler: handlers.onDelete },
    ],
  };
}
