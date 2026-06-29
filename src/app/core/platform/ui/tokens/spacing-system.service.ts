import { Injectable, inject } from '@angular/core';
import { SpacingScale, SpacingToken } from '../ui.types';
import { DesignTokenRegistryService } from './design-token-registry.service';

const BASE_PX = 4;

const SCALES: SpacingScale[] = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24, 32];

function buildToken(scale: SpacingScale): SpacingToken {
  const px = scale * BASE_PX;
  return { scale, px, rem: px === 0 ? '0' : `${px / 16}rem` };
}

const TOKEN_MAP: ReadonlyMap<SpacingScale, SpacingToken> = new Map(
  SCALES.map(s => [s, buildToken(s)]),
);

@Injectable({ providedIn: 'root' })
export class SpacingSystemService {
  private readonly tokenRegistry = inject(DesignTokenRegistryService);

  readonly basePx = BASE_PX;

  get(scale: SpacingScale): SpacingToken {
    return TOKEN_MAP.get(scale) ?? buildToken(scale);
  }

  px(scale: SpacingScale): number {
    return this.get(scale).px;
  }

  rem(scale: SpacingScale): string {
    return this.get(scale).rem;
  }

  getAll(): ReadonlyArray<SpacingToken> {
    return Array.from(TOKEN_MAP.values());
  }

  fromPx(px: number): SpacingToken {
    const scale = (px / BASE_PX) as SpacingScale;
    return { scale, px, rem: px === 0 ? '0' : `${px / 16}rem` };
  }

  registerTokens(): void {
    for (const token of TOKEN_MAP.values()) {
      const key = `spacing.${String(token.scale).replace('.', '_')}`;
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(key, 'spacing', token.rem),
      );
    }
    // Border radius
    const radii: [string, string][] = [
      ['none', '0'],
      ['sm',   '0.25rem'],
      ['md',   '0.375rem'],
      ['lg',   '0.5rem'],
      ['xl',   '0.75rem'],
      ['2xl',  '1rem'],
      ['full', '9999px'],
    ];
    for (const [name, val] of radii) {
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`border-radius.${name}`, 'border-radius', val),
      );
    }

    // Elevation (box-shadow)
    const elevations: [string, string][] = [
      ['none', 'none'],
      ['xs',   '0 1px 2px 0 rgba(0,0,0,0.05)'],
      ['sm',   '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)'],
      ['md',   '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)'],
      ['lg',   '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'],
      ['xl',   '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'],
      ['2xl',  '0 25px 50px -12px rgba(0,0,0,0.25)'],
    ];
    for (const [name, val] of elevations) {
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`elevation.${name}`, 'elevation', val),
      );
    }

    // Opacity
    const opacities: [string, number][] = [
      ['0', 0], ['5', 0.05], ['10', 0.1], ['20', 0.2], ['25', 0.25],
      ['50', 0.5], ['75', 0.75], ['90', 0.9], ['95', 0.95], ['100', 1],
    ];
    for (const [name, val] of opacities) {
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`opacity.${name}`, 'opacity', val),
      );
    }
  }
}
