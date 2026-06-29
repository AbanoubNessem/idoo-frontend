import { Injectable, inject } from '@angular/core';
import { TypeScale, TypographySpec, TypographyTokenMap } from '../ui.types';
import { DesignTokenRegistryService } from './design-token-registry.service';

const SYSTEM_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`;
const MONO_FONT   = `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`;

const SCALE: Record<TypeScale, TypographySpec> = {
  'display-large':  { fontFamily: SYSTEM_FONT, fontSize: '3.5625rem', fontWeight: 400, lineHeight: '4rem',    letterSpacing: '-0.016em' },
  'display-medium': { fontFamily: SYSTEM_FONT, fontSize: '2.8125rem', fontWeight: 400, lineHeight: '3.25rem', letterSpacing: '0' },
  'display-small':  { fontFamily: SYSTEM_FONT, fontSize: '2.25rem',   fontWeight: 400, lineHeight: '2.75rem', letterSpacing: '0' },
  'headline-large': { fontFamily: SYSTEM_FONT, fontSize: '2rem',      fontWeight: 400, lineHeight: '2.5rem',  letterSpacing: '0' },
  'headline-medium':{ fontFamily: SYSTEM_FONT, fontSize: '1.75rem',   fontWeight: 400, lineHeight: '2.25rem', letterSpacing: '0' },
  'headline-small': { fontFamily: SYSTEM_FONT, fontSize: '1.5rem',    fontWeight: 400, lineHeight: '2rem',    letterSpacing: '0' },
  'title-large':    { fontFamily: SYSTEM_FONT, fontSize: '1.375rem',  fontWeight: 400, lineHeight: '1.75rem', letterSpacing: '0' },
  'title-medium':   { fontFamily: SYSTEM_FONT, fontSize: '1rem',      fontWeight: 500, lineHeight: '1.5rem',  letterSpacing: '0.009em' },
  'title-small':    { fontFamily: SYSTEM_FONT, fontSize: '0.875rem',  fontWeight: 500, lineHeight: '1.25rem', letterSpacing: '0.007em' },
  'body-large':     { fontFamily: SYSTEM_FONT, fontSize: '1rem',      fontWeight: 400, lineHeight: '1.5rem',  letterSpacing: '0.031em' },
  'body-medium':    { fontFamily: SYSTEM_FONT, fontSize: '0.875rem',  fontWeight: 400, lineHeight: '1.25rem', letterSpacing: '0.016em' },
  'body-small':     { fontFamily: SYSTEM_FONT, fontSize: '0.75rem',   fontWeight: 400, lineHeight: '1rem',    letterSpacing: '0.025em' },
  'label-large':    { fontFamily: SYSTEM_FONT, fontSize: '0.875rem',  fontWeight: 500, lineHeight: '1.25rem', letterSpacing: '0.007em' },
  'label-medium':   { fontFamily: SYSTEM_FONT, fontSize: '0.75rem',   fontWeight: 500, lineHeight: '1rem',    letterSpacing: '0.031em' },
  'label-small':    { fontFamily: SYSTEM_FONT, fontSize: '0.6875rem', fontWeight: 500, lineHeight: '1rem',    letterSpacing: '0.045em' },
};

@Injectable({ providedIn: 'root' })
export class TypographySystemService {
  private readonly tokenRegistry = inject(DesignTokenRegistryService);

  readonly systemFont = SYSTEM_FONT;
  readonly monoFont   = MONO_FONT;

  getScale(): TypographyTokenMap {
    return SCALE;
  }

  getSpec(scale: TypeScale): TypographySpec | null {
    return SCALE[scale] ?? null;
  }

  registerTokens(): void {
    for (const [scale, spec] of Object.entries(SCALE) as [TypeScale, TypographySpec][]) {
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`typography.${scale}.font-size`, 'typography', spec.fontSize),
      );
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`typography.${scale}.font-weight`, 'typography', spec.fontWeight),
      );
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`typography.${scale}.line-height`, 'typography', spec.lineHeight),
      );
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`typography.${scale}.letter-spacing`, 'typography', spec.letterSpacing),
      );
    }
    this.tokenRegistry.register(
      DesignTokenRegistryService.buildToken('typography.font-family.system', 'typography', SYSTEM_FONT),
    );
    this.tokenRegistry.register(
      DesignTokenRegistryService.buildToken('typography.font-family.mono', 'typography', MONO_FONT),
    );
  }

  getAllScales(): ReadonlyArray<TypeScale> {
    return Object.keys(SCALE) as TypeScale[];
  }
}
