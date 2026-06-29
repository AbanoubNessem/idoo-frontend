import { Injectable, inject, computed } from '@angular/core';
import { UIContextSnapshot } from './ui.types';
import { ThemeManagerService } from './theme/theme-manager.service';
import { DensitySystemService } from './tokens/density-system.service';
import { ResponsiveEngineService } from './responsive/responsive-engine.service';
import { AccessibilityService } from './accessibility/accessibility.service';
import { MotionEngineService } from './motion/motion-engine.service';

@Injectable({ providedIn: 'root' })
export class UIContextService {
  private readonly theme      = inject(ThemeManagerService);
  private readonly density    = inject(DensitySystemService);
  private readonly responsive = inject(ResponsiveEngineService);
  private readonly a11y       = inject(AccessibilityService);
  private readonly motion     = inject(MotionEngineService);

  readonly themeState     = computed(() => this.theme.themeState());
  readonly viewportState  = computed(() => this.responsive.viewportState());
  readonly densityConfig  = computed(() => this.density.config());
  readonly a11yState      = computed(() => this.a11y.a11yState());
  readonly motionConfig   = computed(() => this.motion.config());

  readonly isDark         = computed(() => this.theme.isDark());
  readonly isMobile       = computed(() => this.responsive.isMobile());
  readonly isTablet       = computed(() => this.responsive.isTablet());
  readonly isDesktop      = computed(() => this.responsive.isDesktop());
  readonly reducedMotion  = computed(() => this.motion.reducedMotion());
  readonly highContrast   = computed(() => this.a11y.highContrast());

  readonly snapshot = computed<UIContextSnapshot>(() => ({
    theme:       this.themeState(),
    viewport:    this.viewportState(),
    density:     this.densityConfig(),
    a11y:        this.a11yState(),
    motion:      this.motionConfig(),
    generatedAt: new Date().toISOString(),
  }));

  initialize(options: {
    themeId?: string;
    density?: 'spacious' | 'comfortable' | 'compact';
    useSystemTheme?: boolean;
  } = {}): void {
    if (options.useSystemTheme) {
      this.theme.useSystemPreference();
    } else {
      this.theme.initialize(options.themeId ?? 'light');
    }

    if (options.density) {
      this.density.setLevel(options.density);
    }

    this.responsive.initialize();
    this.a11y.initialize();
    this.motion.initialize();
  }
}
