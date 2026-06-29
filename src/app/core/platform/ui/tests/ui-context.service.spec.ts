import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { UIContextService } from '../ui-context.service';
import { ThemeManagerService } from '../theme/theme-manager.service';
import { ThemeEngineService } from '../theme/theme-engine.service';
import { ThemeRegistryService } from '../theme/theme-registry.service';
import { DensitySystemService } from '../tokens/density-system.service';
import { ColorSystemService } from '../tokens/color-system.service';
import { SpacingSystemService } from '../tokens/spacing-system.service';
import { TypographySystemService } from '../tokens/typography-system.service';
import { DesignTokenRegistryService } from '../tokens/design-token-registry.service';
import { ResponsiveEngineService } from '../responsive/responsive-engine.service';
import { BreakpointService } from '../responsive/breakpoint.service';
import { AccessibilityService } from '../accessibility/accessibility.service';
import { MotionEngineService } from '../motion/motion-engine.service';
import { AnimationRegistryService } from '../motion/animation-registry.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { LiveAnnouncer } from '@angular/cdk/a11y';

class MockBPO {
  observe = () => ({ subscribe: () => ({ unsubscribe: () => {} }), pipe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) });
  isMatched = () => false;
}
class MockAnnouncer {
  announce = jasmine.createSpy('announce').and.returnValue(Promise.resolve());
  clear    = jasmine.createSpy('clear');
}

const PROVIDERS = [
  UIContextService,
  ThemeManagerService, ThemeEngineService, ThemeRegistryService,
  DensitySystemService, ColorSystemService, SpacingSystemService,
  TypographySystemService, DesignTokenRegistryService,
  ResponsiveEngineService, BreakpointService,
  AccessibilityService, MotionEngineService, AnimationRegistryService,
  { provide: BreakpointObserver, useClass: MockBPO },
  { provide: LiveAnnouncer, useClass: MockAnnouncer },
  { provide: PLATFORM_ID, useValue: 'browser' },
];

describe('UIContextService', () => {
  let service: UIContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    service = TestBed.inject(UIContextService);
  });

  it('should create', () => expect(service).toBeTruthy());

  describe('initialize', () => {
    it('should initialize with default light theme', () => {
      service.initialize();
      expect(service.isDark()).toBeFalse();
    });

    it('should initialize with dark theme when specified', () => {
      service.initialize({ themeId: 'dark' });
      expect(service.isDark()).toBeTrue();
    });

    it('should initialize with compact density', () => {
      service.initialize({ density: 'compact' });
      const density = service.densityConfig();
      expect(density.level).toBe('compact');
    });

    it('should initialize with spacious density', () => {
      service.initialize({ density: 'spacious' });
      expect(service.densityConfig().level).toBe('spacious');
    });
  });

  describe('computed signals', () => {
    beforeEach(() => service.initialize());

    it('should expose themeState', () => {
      const state = service.themeState();
      expect(state.activeThemeId).toBe('light');
    });

    it('should expose viewportState', () => {
      const vp = service.viewportState();
      expect(vp).toBeTruthy();
      expect(vp.device).toBeTruthy();
    });

    it('should expose a11yState', () => {
      const a11y = service.a11yState();
      expect(typeof a11y.highContrast).toBe('boolean');
    });

    it('should expose motionConfig', () => {
      const motion = service.motionConfig();
      expect(motion.durationMultiplier).toBe(1);
    });

    it('should expose reducedMotion signal', () => {
      expect(typeof service.reducedMotion()).toBe('boolean');
    });

    it('should expose highContrast signal', () => {
      expect(typeof service.highContrast()).toBe('boolean');
    });

    it('should expose isMobile signal', () => {
      expect(typeof service.isMobile()).toBe('boolean');
    });

    it('should expose isTablet signal', () => {
      expect(typeof service.isTablet()).toBe('boolean');
    });

    it('should expose isDesktop signal', () => {
      expect(typeof service.isDesktop()).toBe('boolean');
    });
  });

  describe('snapshot', () => {
    it('should produce a complete snapshot', () => {
      service.initialize();
      const snap = service.snapshot();
      expect(snap.theme).toBeTruthy();
      expect(snap.viewport).toBeTruthy();
      expect(snap.density).toBeTruthy();
      expect(snap.a11y).toBeTruthy();
      expect(snap.motion).toBeTruthy();
      expect(snap.generatedAt).toBeTruthy();
    });

    it('should include ISO timestamp in snapshot', () => {
      service.initialize();
      const snap = service.snapshot();
      expect(() => new Date(snap.generatedAt)).not.toThrow();
    });
  });
});
