import { TestBed } from '@angular/core/testing';
import { DesignTokenRegistryService } from '../tokens/design-token-registry.service';
import { DesignToken } from '../ui.types';

function token(key: string, value = '#fff'): DesignToken {
  return DesignTokenRegistryService.buildToken(key, 'color', value, 'test token');
}

describe('DesignTokenRegistryService', () => {
  let service: DesignTokenRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DesignTokenRegistryService] });
    service = TestBed.inject(DesignTokenRegistryService);
  });

  it('should create', () => expect(service).toBeTruthy());

  describe('register / get', () => {
    it('should register and retrieve a token by key', () => {
      service.register(token('color.primary', '#2563eb'));
      const t = service.get('color.primary');
      expect(t?.value).toBe('#2563eb');
    });

    it('should return null for unknown key', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    it('should overwrite existing token', () => {
      service.register(token('color.primary', '#111'));
      service.register(token('color.primary', '#222'));
      expect(service.get('color.primary')?.value).toBe('#222');
    });
  });

  describe('registerAll', () => {
    it('should register multiple tokens at once', () => {
      service.registerAll([token('c.a'), token('c.b'), token('c.c')]);
      expect(service.tokenCount()).toBe(3);
    });
  });

  describe('getValue', () => {
    it('should return value directly', () => {
      service.register(token('color.accent', '#7c3aed'));
      expect(service.getValue('color.accent')).toBe('#7c3aed');
    });

    it('should return null for unknown key', () => {
      expect(service.getValue('nope')).toBeNull();
    });
  });

  describe('getByCategory', () => {
    it('should filter by category', () => {
      service.register(token('color.a'));
      service.register(DesignTokenRegistryService.buildToken('spacing.1', 'spacing', '4px'));
      service.register(DesignTokenRegistryService.buildToken('spacing.2', 'spacing', '8px'));
      const spacingTokens = service.getByCategory('spacing');
      expect(spacingTokens.length).toBe(2);
      expect(spacingTokens.every(t => t.category === 'spacing')).toBeTrue();
    });
  });

  describe('has', () => {
    it('should return true for registered key', () => {
      service.register(token('x'));
      expect(service.has('x')).toBeTrue();
    });

    it('should return false for unregistered key', () => {
      expect(service.has('unknown')).toBeFalse();
    });
  });

  describe('remove', () => {
    it('should remove a token', () => {
      service.register(token('removable'));
      expect(service.remove('removable')).toBeTrue();
      expect(service.has('removable')).toBeFalse();
    });

    it('should return false when token not found', () => {
      expect(service.remove('ghost')).toBeFalse();
    });
  });

  describe('clear', () => {
    it('should remove all tokens', () => {
      service.registerAll([token('a'), token('b')]);
      service.clear();
      expect(service.tokenCount()).toBe(0);
    });
  });

  describe('toCssVarMap', () => {
    it('should generate CSS var map', () => {
      service.register(DesignTokenRegistryService.buildToken('color.primary', 'color', '#fff'));
      const map = service.toCssVarMap();
      const key = Object.keys(map).find(k => k.includes('primary'));
      expect(key).toBeTruthy();
      expect(map[key!]).toBe('#fff');
    });
  });

  describe('buildToken (static)', () => {
    it('should generate cssVar with double-dash prefix', () => {
      const t = DesignTokenRegistryService.buildToken('color.primary', 'color', '#fff');
      expect(t.cssVar).toMatch(/^--platform-/);
    });

    it('should include description when provided', () => {
      const t = DesignTokenRegistryService.buildToken('k', 'color', 'v', 'My desc');
      expect(t.description).toBe('My desc');
    });
  });

  describe('tokenCount signal', () => {
    it('should update on register', () => {
      expect(service.tokenCount()).toBe(0);
      service.register(token('x'));
      expect(service.tokenCount()).toBe(1);
    });

    it('should update on remove', () => {
      service.register(token('y'));
      service.remove('y');
      expect(service.tokenCount()).toBe(0);
    });
  });
});
