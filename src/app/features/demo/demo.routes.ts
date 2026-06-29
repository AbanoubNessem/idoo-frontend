import { Routes } from '@angular/router';
import {
  FORM_EXPRESSION_EVALUATOR,
  FORM_FIELD_VALIDATOR,
  FORM_PERMISSION_CHECKER,
  FORM_QUERY_PROVIDER,
} from '../../core/platform/forms/form.tokens';
import { DemoExpressionEvaluator } from './mock/demo-expression-evaluator';
import { DemoValidator } from './mock/demo-validator';
import { DemoPermissionChecker } from './mock/demo-permission-checker';
import { DemoQueryProvider } from './mock/demo-query-provider';
import { MaterialAdapterConnector } from '../../core/platform/components/adapter/material-adapter.connector';

// ─── DEMO_ROUTES ──────────────────────────────────────────────────────────────
// Sprint 6.5 vertical slice demo routes.
// Route-level providers override the noop default injection tokens so the
// Dynamic Form Engine receives real implementations for the demo subtree.
// No auth guard — this is a developer validation tool.

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./demo-shell/demo-shell.component').then(m => m.DemoShellComponent),
    providers: [
      // Override injection tokens with demo implementations
      { provide: FORM_EXPRESSION_EVALUATOR, useClass: DemoExpressionEvaluator },
      { provide: FORM_FIELD_VALIDATOR,      useClass: DemoValidator },
      { provide: FORM_PERMISSION_CHECKER,   useClass: DemoPermissionChecker },
      { provide: FORM_QUERY_PROVIDER,       useClass: DemoQueryProvider },
      // Ensure the Material Adapter is connected for this subtree
      MaterialAdapterConnector,
    ],
    children: [
      {
        path: '',
        redirectTo: 'customer',
        pathMatch: 'full',
      },
      {
        path: 'customer',
        loadComponent: () =>
          import('./customer-demo/customer-demo.component').then(m => m.CustomerDemoComponent),
      },
      {
        path: 'inspector',
        loadComponent: () =>
          import('./architecture-inspector/architecture-inspector.component')
            .then(m => m.ArchitectureInspectorComponent),
      },
      {
        path: 'metadata',
        loadComponent: () =>
          import('./metadata-explorer/metadata-explorer.component')
            .then(m => m.MetadataExplorerComponent),
      },
      {
        path: 'registry',
        loadComponent: () =>
          import('./registry-explorer/registry-explorer.component')
            .then(m => m.RegistryExplorerComponent),
      },
      {
        path: 'runtime',
        loadComponent: () =>
          import('./runtime-explorer/runtime-explorer.component')
            .then(m => m.RuntimeExplorerComponent),
      },
      {
        path: 'components',
        loadComponent: () =>
          import('./component-explorer/component-explorer.component')
            .then(m => m.ComponentExplorerComponent),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./runtime-event-log/runtime-event-log.component')
            .then(m => m.RuntimeEventLogComponent),
      },
    ],
  },
];
