// ─── Layout Types ─────────────────────────────────────────────────────────────

export type LayoutType =
  | 'grid'
  | 'flex'
  | 'rows'
  | 'columns'
  | 'stack'
  | 'cards'
  | 'sections'
  | 'panels'
  | 'tabs'
  | 'accordion'
  | 'splitter'
  | 'sidebar'
  | 'header'
  | 'footer'
  | 'content-area'
  | 'responsive-container'
  | 'overlay'
  | 'nested';

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type DeviceClass = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type LayoutDirection = 'ltr' | 'rtl';

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export type LayoutPhase =
  | 'created'
  | 'initializing'
  | 'ready'
  | 'updating'
  | 'destroying'
  | 'destroyed';

// ─── Event Types ─────────────────────────────────────────────────────────────

export type LayoutEventType =
  | 'layout:created'
  | 'layout:initialized'
  | 'layout:updated'
  | 'layout:destroyed'
  | 'layout:error'
  | 'breakpoint:changed'
  | 'direction:changed'
  | 'tab:activated'
  | 'accordion:toggled'
  | 'sidebar:toggled'
  | 'splitter:resized'
  | 'overlay:opened'
  | 'overlay:closed'
  | 'slot:rendered'
  | 'visibility:changed'
  | 'order:changed'
  | 'size:changed';

// ─── Token Overrides ──────────────────────────────────────────────────────────

export interface LayoutTokenOverrides {
  readonly spacing?: Record<string, string>;
  readonly elevation?: Record<string, string>;
  readonly borderRadius?: Record<string, string>;
  readonly colors?: Record<string, string>;
}

// ─── Conditions ───────────────────────────────────────────────────────────────

export interface LayoutCondition {
  readonly expression: string;
  readonly effect: 'hide' | 'show' | 'disable' | 'collapse' | 'expand';
  readonly targetSlotId?: string;
}

// ─── Responsive Rules ─────────────────────────────────────────────────────────

export type ResponsiveOverrides<T> = Partial<Record<Breakpoint, Partial<T>>>;

// ─── Grid Config ──────────────────────────────────────────────────────────────

export interface GridConfig {
  readonly columns?: number | string;
  readonly rows?: number | string;
  readonly columnGap?: string;
  readonly rowGap?: string;
  readonly gap?: string;
  readonly areas?: ReadonlyArray<string>;
  readonly autoRows?: string;
  readonly autoCols?: string;
  readonly autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
}

// ─── Flex Config ──────────────────────────────────────────────────────────────

export interface FlexConfig {
  readonly direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  readonly wrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
  readonly align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  readonly justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  readonly gap?: string;
  readonly inline?: boolean;
}

// ─── Sidebar Config ───────────────────────────────────────────────────────────

export interface SidebarConfig {
  readonly sideWidth?: string;
  readonly contentMinWidth?: string;
  readonly position?: 'start' | 'end';
  readonly collapsible?: boolean;
  readonly collapsed?: boolean;
  readonly collapseWidth?: string;
}

// ─── Splitter Config ──────────────────────────────────────────────────────────

export interface SplitterConfig {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly initialRatio?: number;
  readonly minSize?: string;
  readonly resizable?: boolean;
}

// ─── Tabs Config ──────────────────────────────────────────────────────────────

export interface TabsConfig {
  readonly initialIndex?: number;
  readonly variant?: 'underline' | 'filled' | 'outlined' | 'pills';
  readonly position?: 'top' | 'bottom' | 'start' | 'end';
  readonly scrollable?: boolean;
  readonly animated?: boolean;
}

// ─── Accordion Config ─────────────────────────────────────────────────────────

export interface AccordionConfig {
  readonly multi?: boolean;
  readonly initialOpen?: ReadonlyArray<string>;
  readonly animated?: boolean;
}

// ─── Cards Config ─────────────────────────────────────────────────────────────

export interface CardsConfig {
  readonly minCardWidth?: string;
  readonly maxCards?: number;
  readonly gap?: string;
  readonly aspectRatio?: string;
}

// ─── Overlay Config ───────────────────────────────────────────────────────────

export interface OverlayConfig {
  readonly backdrop?: boolean;
  readonly position?: 'center' | 'top' | 'bottom' | 'start' | 'end' | 'full';
  readonly animation?: 'fade' | 'slide' | 'scale' | 'none';
  readonly zIndex?: number;
}

// ─── Responsive Container Config ──────────────────────────────────────────────

export interface ResponsiveContainerConfig {
  readonly useContainerQueries?: boolean;
  readonly breakpointSource?: 'viewport' | 'container';
}

// ─── General Layout Config ────────────────────────────────────────────────────

export interface LayoutConfig {
  // Spacing
  readonly padding?: string;
  readonly margin?: string;
  readonly gap?: string;
  // Sizing
  readonly width?: string;
  readonly height?: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly minHeight?: string;
  readonly maxHeight?: string;
  // Visual
  readonly elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  readonly borderRadius?: string;
  readonly background?: string;
  readonly overflow?: string;
  readonly overflowX?: string;
  readonly overflowY?: string;
  // Type-specific
  readonly grid?: GridConfig;
  readonly flex?: FlexConfig;
  readonly sidebar?: SidebarConfig;
  readonly splitter?: SplitterConfig;
  readonly tabs?: TabsConfig;
  readonly accordion?: AccordionConfig;
  readonly cards?: CardsConfig;
  readonly overlay?: OverlayConfig;
  readonly responsive?: ResponsiveContainerConfig;
}

// ─── Slot Definition ──────────────────────────────────────────────────────────

export interface LayoutSlotDefinition {
  readonly id: string;
  readonly label?: string;
  readonly order?: number;
  readonly span?: number | string;
  readonly hidden?: boolean;
  readonly hiddenCondition?: string;
  readonly minHeight?: string;
  readonly scrollable?: boolean;
  readonly lazy?: boolean;
  readonly metadata?: unknown;
}

// ─── Layout Definition (the metadata blueprint) ───────────────────────────────

export interface LayoutDefinition {
  readonly id: string;
  readonly type: LayoutType;
  readonly label?: string;
  readonly description?: string;
  readonly slots?: ReadonlyArray<LayoutSlotDefinition>;
  readonly children?: ReadonlyArray<LayoutDefinition>;
  readonly config?: LayoutConfig;
  readonly responsive?: ResponsiveOverrides<LayoutDefinition>;
  readonly conditions?: ReadonlyArray<LayoutCondition>;
  readonly tokens?: LayoutTokenOverrides;
  readonly direction?: LayoutDirection;
  readonly hidden?: boolean;
  readonly order?: number;
  readonly lazy?: boolean;
  readonly metadata?: unknown;
}

// ─── Resolved Layout (after applying responsive/conditions) ───────────────────

export interface ResolvedLayout {
  readonly definition: LayoutDefinition;
  readonly css: CssProperties;
  readonly slots: ReadonlyArray<ResolvedSlot>;
  readonly children: ReadonlyArray<ResolvedLayout>;
  readonly direction: LayoutDirection;
  readonly breakpoint: Breakpoint;
  readonly resolvedAt: string;
}

export interface ResolvedSlot {
  readonly id: string;
  readonly order: number;
  readonly hidden: boolean;
  readonly css: CssProperties;
}

// ─── CSS Properties ───────────────────────────────────────────────────────────

export type CssProperties = Readonly<Record<string, string>>;

// ─── Layout Instance ──────────────────────────────────────────────────────────

export interface LayoutInstance {
  readonly id: string;
  readonly definition: LayoutDefinition;
  readonly phase: LayoutPhase;
  readonly resolved: ResolvedLayout | null;
  readonly createdAt: string;
}

// ─── Layout Context Data ──────────────────────────────────────────────────────

export interface LayoutContextData {
  readonly breakpoint: Breakpoint;
  readonly device: DeviceClass;
  readonly orientation: Orientation;
  readonly direction: LayoutDirection;
  readonly permissions: ReadonlyArray<string>;
  readonly model: Record<string, unknown>;
  readonly containerWidth?: number;
  readonly containerHeight?: number;
}

// ─── Layout State Data ────────────────────────────────────────────────────────

export interface LayoutStateData {
  readonly activeTabIndex: number;
  readonly openAccordionIds: ReadonlyArray<string>;
  readonly sidebarCollapsed: boolean;
  readonly splitterRatio: number;
  readonly overlayOpen: boolean;
  readonly hiddenSlotIds: ReadonlyArray<string>;
  readonly slotOrder: ReadonlyArray<string>;
}

// ─── Layout Metrics ───────────────────────────────────────────────────────────

export interface LayoutMetricsSnapshot {
  readonly instanceId: string;
  readonly renderCount: number;
  readonly lastRenderMs: number;
  readonly avgRenderMs: number;
  readonly resolveCount: number;
  readonly breakpointChanges: number;
  readonly createdAt: string;
  readonly lastActivityAt: string;
}

// ─── Layout Diagnostics ───────────────────────────────────────────────────────

export interface LayoutDiagnosticsReport {
  readonly totalInstances: number;
  readonly activeInstances: number;
  readonly registeredDefinitions: number;
  readonly diagnosticsEnabled: boolean;
  readonly instanceSummaries: ReadonlyArray<LayoutInstanceSummary>;
  readonly generatedAt: string;
}

export interface LayoutInstanceSummary {
  readonly id: string;
  readonly type: LayoutType;
  readonly phase: LayoutPhase;
  readonly renderCount: number;
  readonly breakpoint: Breakpoint;
}

// ─── Layout Event ─────────────────────────────────────────────────────────────

export interface LayoutEvent {
  readonly type: LayoutEventType;
  readonly layoutId: string;
  readonly timestamp: string;
  readonly payload: unknown;
}

// ─── Render Output ────────────────────────────────────────────────────────────

export interface LayoutRenderOutput {
  readonly hostCss: CssProperties;
  readonly slotCss: Readonly<Record<string, CssProperties>>;
  readonly childCss: ReadonlyArray<CssProperties>;
  readonly cssVars: CssProperties;
}

// ─── Builder Fluent Result ────────────────────────────────────────────────────

export interface LayoutDefinitionBuilder {
  slot(def: Partial<LayoutSlotDefinition> & { id: string }): LayoutDefinitionBuilder;
  child(child: LayoutDefinition): LayoutDefinitionBuilder;
  config(cfg: LayoutConfig): LayoutDefinitionBuilder;
  responsive(bp: Breakpoint, overrides: Partial<LayoutDefinition>): LayoutDefinitionBuilder;
  condition(cond: LayoutCondition): LayoutDefinitionBuilder;
  tokens(t: LayoutTokenOverrides): LayoutDefinitionBuilder;
  direction(dir: LayoutDirection): LayoutDefinitionBuilder;
  hidden(h?: boolean): LayoutDefinitionBuilder;
  build(): LayoutDefinition;
}

// ─── Registry Entry ───────────────────────────────────────────────────────────

export interface LayoutRegistryEntry {
  readonly definition: LayoutDefinition;
  readonly registeredAt: string;
  readonly version?: string;
  readonly tags?: ReadonlyArray<string>;
}

// ─── Serialized Form ─────────────────────────────────────────────────────────

export interface SerializedLayout {
  readonly schema: '1.0';
  readonly definition: LayoutDefinition;
  readonly serializedAt: string;
}
