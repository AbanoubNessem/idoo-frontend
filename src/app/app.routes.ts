import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { tenantGuard } from './core/auth/guards/tenant.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/components/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard, tenantGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'tenants',
        loadChildren: () => import('./features/tenants/tenants.routes').then(m => m.TENANTS_ROUTES),
      },
      {
        path: 'companies',
        loadChildren: () => import('./features/companies/companies.routes').then(m => m.COMPANIES_ROUTES),
      },
      {
        path: 'branches',
        loadChildren: () => import('./features/branches/branches.routes').then(m => m.BRANCHES_ROUTES),
      },
      {
        path: 'departments',
        loadChildren: () => import('./features/departments/departments.routes').then(m => m.DEPARTMENTS_ROUTES),
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES),
      },
      {
        path: 'roles',
        loadChildren: () => import('./features/roles/roles.routes').then(m => m.ROLES_ROUTES),
      },
      {
        path: 'permissions',
        loadChildren: () => import('./features/permissions/permissions.routes').then(m => m.PERMISSIONS_ROUTES),
      },
    ],
  },
  {
    path: 'demo',
    loadChildren: () => import('./features/demo/demo.routes').then(m => m.DEMO_ROUTES),
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '403', loadComponent: () => import('./features/errors/forbidden.component').then(m => m.ForbiddenComponent) },
  { path: '**', loadComponent: () => import('./features/errors/not-found.component').then(m => m.NotFoundComponent) },
];
