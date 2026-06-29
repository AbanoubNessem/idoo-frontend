import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { MotionEngineService } from '../motion/motion-engine.service';
import { AnimationRegistryService } from '../motion/animation-registry.service';
import { AccessibilityService } from '../accessibility/accessibility.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AnimationSpec } from '../ui.types';

class MockLiveAnnouncer {
  announce = jasmine.createSpy('announce').and.returnValue(Promise.resolve());
  clear    = jasmine.createSpy('clear');
}

describe('MotionEngineService', () => {
  let engine: MotionEngineService;
  let registry: AnimationRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MotionEngineService,
        AnimationRegistryService,
        AccessibilityService,
        { provide: LiveAnnouncer, useClass: MockLiveAnnouncer },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    engine   = TestBed.inject(MotionEngineService);
    registry = TestBed.inject(AnimationRegistryService);
  });

  it('should create', () => expect(engine).toBeTruthy());

  it('should expose config signal', () => {
    const cfg = engine.config();
    expect(cfg.durationMultiplier).toBe(1);
  });

  it('should initialize from accessibility service', () => {
    engine.initialize();
    expect(engine.config()).toBeTruthy();
  });

  describe('setDurationMultiplier', () => {
    it('should update the multiplier', () => {
      engine.setDurationMultiplier(0.5);
      expect(engine.config().durationMultiplier).toBe(0.5);
    });
  });

  describe('setReducedMotion', () => {
    it('should update reducedMotion flag', () => {
      engine.setReducedMotion(true);
      expect(engine.reducedMotion()).toBeTrue();
    });

    it('should unset reducedMotion', () => {
      engine.setReducedMotion(true);
      engine.setReducedMotion(false);
      expect(engine.config().reducedMotion).toBeFalse();
    });
  });

  describe('play (named)', () => {
    it('should return a handle for a known animation', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      // JSDOM may not support el.animate fully — noop path is also valid
      const handle = engine.play(el, 'fade-in');
      expect(handle).toBeTruthy();
      expect(handle.id).toBeTruthy();
      expect(handle.name).toBe('fade-in');
      document.body.removeChild(el);
    });

    it('should return a noop handle for unknown animation', () => {
      const el = document.createElement('div');
      const handle = engine.play(el, 'nonexistent');
      expect(handle.id).toBeTruthy();
      expect(handle.name).toBe('nonexistent');
    });

    it('should return a noop handle when reduced motion is true', () => {
      engine.setReducedMotion(true);
      const el = document.createElement('div');
      document.body.appendChild(el);
      const handle = engine.play(el, 'fade-in');
      expect(handle).toBeTruthy();
      document.body.removeChild(el);
    });
  });

  describe('play (inline spec)', () => {
    it('should accept an AnimationSpec directly', () => {
      const spec: AnimationSpec = {
        name: 'custom',
        duration: 'fast',
        easing: 'linear',
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
      };
      const el = document.createElement('div');
      const handle = engine.play(el, spec);
      expect(handle.name).toBe('custom');
    });
  });

  describe('cancelAll', () => {
    it('should cancel all running animations', () => {
      engine.cancelAll();
      expect(engine.getRunningCount()).toBe(0);
    });
  });

  describe('getRunningCount', () => {
    it('should start at 0', () => {
      expect(engine.getRunningCount()).toBe(0);
    });
  });

  describe('isRunning', () => {
    it('should return false for unknown id', () => {
      expect(engine.isRunning('ghost')).toBeFalse();
    });
  });
});
