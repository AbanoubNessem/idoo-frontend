// ─── Rendering Types ─────────────────────────────────────────────────────────
export * from './rendering.types';

// ─── Render Plan ─────────────────────────────────────────────────────────────
export { TableRenderContext }            from './plan/table-render-context';
export { TableRenderPlanBuilderService } from './plan/table-render-plan-builder.service';

// ─── Renderers ────────────────────────────────────────────────────────────────
export { TableHeaderRendererService }  from './renderers/table-header-renderer.service';
export { TableCellRendererService }    from './renderers/table-cell-renderer.service';
export { TableFooterRendererService }  from './renderers/table-footer-renderer.service';
export { TableToolbarRendererService } from './renderers/table-toolbar-renderer.service';
export { TableEmptyRendererService }   from './renderers/table-empty-renderer.service';
export { TableLoadingRendererService } from './renderers/table-loading-renderer.service';
export { TableErrorRendererService }   from './renderers/table-error-renderer.service';

// ─── Engine ──────────────────────────────────────────────────────────────────
export { TableRenderEngineService } from './engine/table-render-engine.service';

// ─── Renderer (main facade) ───────────────────────────────────────────────────
export { TableRendererService } from './table-renderer.service';

// ─── Components ───────────────────────────────────────────────────────────────
export { TableShellComponent }   from './components/table-shell/table-shell.component';
export { TableHeaderComponent }  from './components/table-header/table-header.component';
export { TableBodyComponent }    from './components/table-body/table-body.component';
export { TableCellComponent }    from './components/table-cell/table-cell.component';
export { TableFooterComponent }  from './components/table-footer/table-footer.component';
export { TableToolbarComponent } from './components/table-toolbar/table-toolbar.component';
export { TableEmptyComponent }   from './components/table-empty/table-empty.component';
export { TableLoadingComponent } from './components/table-loading/table-loading.component';
export { TableErrorComponent }   from './components/table-error/table-error.component';
