import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LayoutEngineService } from '../layout/layout-engine.service';
import { ResponsiveEngineService } from '../responsive/responsive-engine.service';
import { BreakpointService } from '../responsive/breakpoint.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { LayoutConfig, LayoutPreset } from '../ui.types';

class MockBreakpointObserver {
  observe = () => ({ subscribe: () => ({ unsubscribe: () => {} }) });
  isMatched = () => false;
}

describe('LayoutEngineService', () => {
  let service: LayoutEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutEngineService,
        ResponsiveEngineService,
        BreakpointService,
        { provide: BreakpointObserver, useClass: MockBreakpointObserver },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(LayoutEngineService);
  });

  it('should create', () => expect(service).toBeTruthy());

  describe('getPreset', () => {
    const presets: LayoutPreset[] = ['grid', 'flex', 'stack', 'section', 'container', 'card', 'panel', 'split'];
    for (const preset of presets) {
      it(`should return preset for "${preset}"`, () => {
        const p = service.getPreset(preset);
        expect(p).toBeTruthy();
        expect(p.preset).toBe(preset);
      });
    }
  });

  describe('getAllPresets', () => {
    it('should return all 8 presets', () => {
      expect(service.getAllPresets().length).toBe(8);
    });
  });

  describe('toCss', () => {
    it('should generate display:grid for grid preset', () => {
      const css = service.toCss({ preset: 'grid', columns: 12, gap: 'md' });
      expect(css.display).toBe('grid');
      expect(css.gridTemplateColumns).toBe('repeat(12, 1fr)');
    });

    it('should generate display:flex for flex preset', () => {
      const css = service.toCss({ preset: 'flex', direction: 'row' });
      expect(css.display).toBe('flex');
      expect(css.flexDirection).toBe('row');
    });

    it('should generate column direction for stack preset', () => {
      const css = service.toCss({ preset: 'stack', direction: 'column', gap: 'lg' });
      expect(css.display).toBe('flex');
      expect(css.flexDirection).toBe('column');
    });

    it('should map align to CSS align-items', () => {
      const css = service.toCss({ preset: 'flex', align: 'center' });
      expect(css.alignItems).toBe('center');
    });

    it('should map justify to CSS justify-content', () => {
      const css = service.toCss({ preset: 'flex', justify: 'between' });
      expect(css.justifyContent).toBe('space-between');
    });

    it('should include gap CSS value', () => {
      const css = service.toCss({ preset: 'flex', gap: 'md' });
      expect(css.gap).toBeTruthy();
    });

    it('should include maxWidth for section preset', () => {
      const css = service.toCss({ preset: 'section', maxWidth: '1280px' });
      expect(css.maxWidth).toBe('1280px');
    });

    it('should produce display:block for card preset', () => {
      const css = service.toCss({ preset: 'card' });
      expect(css.display).toBe('block');
    });

    it('should produce flexWrap:wrap when wrap=true', () => {
      const css = service.toCss({ preset: 'flex', wrap: true });
      expect(css.flexWrap).toBe('wrap');
    });
  });

  describe('gapValue', () => {
    it('should return 0 for none', () => expect(service.gapValue('none')).toBe('0'));
    it('should return rem value for md', () => expect(service.gapValue('md')).toBe('1rem'));
    it('should return rem value for xl', () => expect(service.gapValue('xl')).toBe('2rem'));
  });

  describe('register / getConfig', () => {
    it('should register and retrieve a named config', () => {
      const config: LayoutConfig = { preset: 'grid', columns: 3, gap: 'sm' };
      service.register('my-layout', config);
      expect(service.getConfig('my-layout')).toEqual(config);
    });

    it('should return null for unknown config', () => {
      expect(service.getConfig('unknown')).toBeNull();
    });
  });
});
