import { TestBed } from '@angular/core/testing';
import { AnimationRegistryService } from '../motion/animation-registry.service';
import { AnimationSpec } from '../ui.types';

const customAnim: AnimationSpec = {
  name: 'pulse',
  duration: 'medium',
  easing: 'ease-in-out',
  keyframes: [{ opacity: 0.5 }, { opacity: 1 }, { opacity: 0.5 }],
};

describe('AnimationRegistryService', () => {
  let service: AnimationRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AnimationRegistryService] });
    service = TestBed.inject(AnimationRegistryService);
  });

  it('should create', () => expect(service).toBeTruthy());

  it('should pre-register built-in animations', () => {
    const builtIns = service.getBuiltInNames();
    expect(builtIns.length).toBeGreaterThan(0);
    expect(builtIns).toContain('fade-in');
    expect(builtIns).toContain('fade-out');
    expect(builtIns).toContain('dialog-in');
  });

  it('animationCount signal should reflect built-ins', () => {
    expect(service.animationCount()).toBeGreaterThan(8);
  });

  describe('register', () => {
    it('should register a custom animation', () => {
      service.register(customAnim);
      expect(service.has('pulse')).toBeTrue();
    });

    it('should throw when name is empty', () => {
      expect(() => service.register({ ...customAnim, name: '' })).toThrow();
    });

    it('should overwrite existing animation', () => {
      service.register(customAnim);
      const updated = { ...customAnim, easing: 'linear' as const };
      service.register(updated);
      expect(service.get('pulse')?.easing).toBe('linear');
    });
  });

  describe('get', () => {
    it('should return built-in animation', () => {
      const anim = service.get('fade-in');
      expect(anim).toBeTruthy();
      expect(anim?.keyframes).toBeTruthy();
    });

    it('should return null for unknown animation', () => {
      expect(service.get('unknown')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for built-in', () => expect(service.has('slide-in-up')).toBeTrue());
    it('should return false for unknown', () => expect(service.has('ghost')).toBeFalse());
  });

  describe('remove', () => {
    it('should remove registered animation', () => {
      service.register(customAnim);
      expect(service.remove('pulse')).toBeTrue();
      expect(service.has('pulse')).toBeFalse();
    });

    it('should return false for unknown', () => {
      expect(service.remove('ghost')).toBeFalse();
    });
  });

  describe('getAll', () => {
    it('should return all animations including custom', () => {
      service.register(customAnim);
      expect(service.getAll().some(a => a.name === 'pulse')).toBeTrue();
    });
  });

  describe('resolveDuration', () => {
    it('should resolve instant to 0', () => expect(service.resolveDuration('instant')).toBe(0));
    it('should resolve fast to 100', () => expect(service.resolveDuration('fast')).toBe(100));
    it('should resolve medium to 200', () => expect(service.resolveDuration('medium')).toBe(200));
    it('should resolve slow to 350', () => expect(service.resolveDuration('slow')).toBe(350));
    it('should resolve numeric directly', () => expect(service.resolveDuration(500)).toBe(500));
    it('should apply multiplier', () => {
      expect(service.resolveDuration('medium', 0.5)).toBe(100);
    });
  });

  describe('resolveEasing', () => {
    it('should resolve standard to cubic-bezier', () => {
      expect(service.resolveEasing('standard')).toContain('cubic-bezier');
    });
    it('should resolve linear to literal "linear"', () => {
      expect(service.resolveEasing('linear')).toBe('linear');
    });
    it('should resolve ease-out', () => {
      expect(service.resolveEasing('ease-out')).toBe('ease-out');
    });
  });
});
