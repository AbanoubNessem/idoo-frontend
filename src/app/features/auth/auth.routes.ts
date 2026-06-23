import { Routes } from '@angular/router';

import { AuthShellComponent } from './layouts/auth-shell/auth-shell.component';

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        component: AuthShellComponent,
        children: [
            {
                path: 'login',
                loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'select-tenant',
                loadComponent: () => import('./select-tenant/select-tenant.component').then(m => m.SelectTenantComponent)
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    }
];
