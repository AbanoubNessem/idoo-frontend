import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'select-tenant',
        loadComponent: () => import('./select-tenant/select-tenant.component').then(m => m.SelectTenantComponent)
    }
];
