import { TestBed } from '@angular/core/testing';
import { IconRegistryService } from '../icons/icon-registry.service';
import { IconDefinition } from '../ui.types';

function makeIcon(name: string, variant: IconDefinition['variant'] = 'outlined'): IconDefinition {
  return {
    name,
    variant,
    svg: `<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>`,
    tags: [name, 'test'],
  };
}

describe('IconRegistryService', () => {
  let service: IconRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [IconRegistryService] });
    service = TestBed.inject(IconRegistryService);
  });

  it('should create', () => expect(service).toBeTruthy());

  it('should start with zero icons', () => {
    expect(service.iconCount()).toBe(0);
  });

  describe('register', () => {
    it('should register an icon and increment count', () => {
      service.register(makeIcon('home'));
      expect(service.iconCount()).toBe(1);
    });

    it('should throw when name is empty', () => {
      expect(() => service.register(makeIcon(''))).toThrow();
    });

    it('should throw when name is whitespace', () => {
      expect(() => service.register(makeIcon('  '))).toThrow();
    });

    it('should sanitize script tags from SVG', () => {
      const malicious: IconDefinition = {
        name: 'evil',
        variant: 'filled',
        svg: '<svg><script>alert(1)</script><path/></svg>',
      };
      service.register(malicious);
      const icon = service.get('evil', 'filled');
      expect(icon?.svg).not.toContain('<script>');
    });

    it('should sanitize on* attributes from SVG', () => {
      const malicious: IconDefinition = {
        name: 'evil2',
        variant: 'filled',
        svg: '<svg><path onclick="alert(1)"/></svg>',
      };
      service.register(malicious);
      expect(service.get('evil2', 'filled')?.svg).not.toContain('onclick');
    });
  });

  describe('registerAll', () => {
    it('should register multiple icons', () => {
      service.registerAll([makeIcon('a'), makeIcon('b'), makeIcon('c')]);
      expect(service.iconCount()).toBe(3);
    });
  });

  describe('get', () => {
    it('should retrieve icon by name and variant', () => {
      service.register(makeIcon('star', 'filled'));
      expect(service.get('star', 'filled')).toBeTruthy();
    });

    it('should default to outlined variant', () => {
      service.register(makeIcon('star', 'outlined'));
      expect(service.get('star')).toBeTruthy();
    });

    it('should fall back to filled when outlined not found', () => {
      service.register(makeIcon('heart', 'filled'));
      const icon = service.get('heart');
      expect(icon?.variant).toBe('filled');
    });

    it('should return null when icon not found', () => {
      expect(service.get('unknown')).toBeNull();
    });
  });

  describe('getSvg', () => {
    it('should return SVG string', () => {
      service.register(makeIcon('check'));
      expect(service.getSvg('check')).toContain('<svg');
    });

    it('should return null for unknown icon', () => {
      expect(service.getSvg('unknown')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for registered icon', () => {
      service.register(makeIcon('tick'));
      expect(service.has('tick')).toBeTrue();
    });

    it('should return false for unregistered icon', () => {
      expect(service.has('ghost')).toBeFalse();
    });
  });

  describe('getByVariant', () => {
    it('should return all icons of a variant', () => {
      service.register(makeIcon('a', 'filled'));
      service.register(makeIcon('b', 'filled'));
      service.register(makeIcon('c', 'outlined'));
      expect(service.getByVariant('filled').length).toBe(2);
    });
  });

  describe('search', () => {
    it('should find icon by name substring', () => {
      service.register(makeIcon('home'));
      service.register(makeIcon('settings'));
      expect(service.search('hom').length).toBe(1);
    });

    it('should find icon by tag', () => {
      service.register(makeIcon('home'));
      const results = service.search('test'); // 'test' is in tags
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array when nothing matches', () => {
      service.register(makeIcon('home'));
      expect(service.search('zzz').length).toBe(0);
    });
  });

  describe('remove', () => {
    it('should remove a registered icon', () => {
      service.register(makeIcon('trash'));
      expect(service.remove('trash')).toBeTrue();
      expect(service.has('trash')).toBeFalse();
    });

    it('should return false for unknown icon', () => {
      expect(service.remove('ghost')).toBeFalse();
    });
  });

  describe('clear', () => {
    it('should clear all icons', () => {
      service.registerAll([makeIcon('a'), makeIcon('b')]);
      service.clear();
      expect(service.iconCount()).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all registered icons', () => {
      service.registerAll([makeIcon('x'), makeIcon('y')]);
      expect(service.getAll().length).toBe(2);
    });
  });
});
