// ─── Types ────────────────────────────────────────────────────────────────────
export * from './ui.types';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export { DesignTokenRegistryService } from './tokens/design-token-registry.service';
export { ColorSystemService } from './tokens/color-system.service';
export { TypographySystemService } from './tokens/typography-system.service';
export { SpacingSystemService } from './tokens/spacing-system.service';
export { DensitySystemService } from './tokens/density-system.service';

// ─── Theme ────────────────────────────────────────────────────────────────────
export { ThemeRegistryService } from './theme/theme-registry.service';
export { ThemeEngineService } from './theme/theme-engine.service';
export { ThemeManagerService } from './theme/theme-manager.service';
export { LIGHT_THEME } from './theme/themes/light.theme';
export { DARK_THEME } from './theme/themes/dark.theme';
export { BRAND_THEME } from './theme/themes/brand.theme';

// ─── Icons ────────────────────────────────────────────────────────────────────
export { IconRegistryService } from './icons/icon-registry.service';

// ─── Responsive ───────────────────────────────────────────────────────────────
export { BreakpointService, BREAKPOINTS, MIN_WIDTH_QUERIES } from './responsive/breakpoint.service';
export { ResponsiveEngineService } from './responsive/responsive-engine.service';

// ─── Layout ───────────────────────────────────────────────────────────────────
export { LayoutEngineService } from './layout/layout-engine.service';
export type { CssLayoutResult } from './layout/layout-engine.service';

// ─── Overlay ──────────────────────────────────────────────────────────────────
export { OverlayManagerService } from './overlay/overlay-manager.service';
export { DialogHostService } from './overlay/dialog-host.service';
export { DrawerHostService } from './overlay/drawer-host.service';
export { PopoverHostService } from './overlay/popover-host.service';
export { TooltipHostService } from './overlay/tooltip-host.service';

// ─── Accessibility ────────────────────────────────────────────────────────────
export { FocusManagerService } from './accessibility/focus-manager.service';
export { AccessibilityService } from './accessibility/accessibility.service';

// ─── Motion ───────────────────────────────────────────────────────────────────
export { AnimationRegistryService } from './motion/animation-registry.service';
export { MotionEngineService } from './motion/motion-engine.service';

// ─── UI Context ───────────────────────────────────────────────────────────────
export { UIContextService } from './ui-context.service';
