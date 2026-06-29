import { Injectable, inject } from '@angular/core';
import { ColorPalette, ColorScale, ColorTokenMap, SemanticColor } from '../ui.types';
import { DesignTokenRegistryService } from './design-token-registry.service';

const PALETTES: Record<string, Partial<Record<ColorScale, string>>> = {
  blue: {
    50:  '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  violet: {
    50:  '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
  },
  emerald: {
    50:  '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22',
  },
  amber: {
    50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03',
  },
  red: {
    50:  '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  slate: {
    50:  '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
};

const LIGHT_SEMANTIC: ColorTokenMap = {
  'primary':         PALETTES['blue'][600]!,
  'primary-hover':   PALETTES['blue'][700]!,
  'primary-subtle':  PALETTES['blue'][50]!,
  'secondary':       PALETTES['slate'][600]!,
  'accent':          PALETTES['violet'][600]!,
  'success':         PALETTES['emerald'][600]!,
  'warning':         PALETTES['amber'][500]!,
  'error':           PALETTES['red'][600]!,
  'info':            PALETTES['blue'][500]!,
  'surface':         '#ffffff',
  'surface-variant': PALETTES['slate'][50]!,
  'background':      PALETTES['slate'][50]!,
  'on-surface':      PALETTES['slate'][900]!,
  'on-background':   PALETTES['slate'][800]!,
  'border':          PALETTES['slate'][200]!,
  'divider':         PALETTES['slate'][100]!,
  'shadow':          'rgba(0,0,0,0.08)',
  'text-primary':    PALETTES['slate'][900]!,
  'text-secondary':  PALETTES['slate'][500]!,
  'text-disabled':   PALETTES['slate'][300]!,
  'text-inverse':    '#ffffff',
};

const DARK_SEMANTIC: ColorTokenMap = {
  'primary':         PALETTES['blue'][400]!,
  'primary-hover':   PALETTES['blue'][300]!,
  'primary-subtle':  'rgba(59,130,246,0.12)',
  'secondary':       PALETTES['slate'][400]!,
  'accent':          PALETTES['violet'][400]!,
  'success':         PALETTES['emerald'][400]!,
  'warning':         PALETTES['amber'][400]!,
  'error':           PALETTES['red'][400]!,
  'info':            PALETTES['blue'][400]!,
  'surface':         PALETTES['slate'][900]!,
  'surface-variant': PALETTES['slate'][800]!,
  'background':      PALETTES['slate'][950]!,
  'on-surface':      PALETTES['slate'][50]!,
  'on-background':   PALETTES['slate'][100]!,
  'border':          PALETTES['slate'][700]!,
  'divider':         PALETTES['slate'][800]!,
  'shadow':          'rgba(0,0,0,0.4)',
  'text-primary':    PALETTES['slate'][50]!,
  'text-secondary':  PALETTES['slate'][400]!,
  'text-disabled':   PALETTES['slate'][600]!,
  'text-inverse':    PALETTES['slate'][900]!,
};

@Injectable({ providedIn: 'root' })
export class ColorSystemService {
  private readonly tokenRegistry = inject(DesignTokenRegistryService);

  readonly palettes: Readonly<Record<string, ColorPalette>> = Object.fromEntries(
    Object.entries(PALETTES).map(([name, shades]) => [name, { name, shades }]),
  );

  getLightSemanticTokens(): ColorTokenMap {
    return LIGHT_SEMANTIC;
  }

  getDarkSemanticTokens(): ColorTokenMap {
    return DARK_SEMANTIC;
  }

  getSemanticColor(name: SemanticColor, mode: 'light' | 'dark' = 'light'): string {
    const map = mode === 'dark' ? DARK_SEMANTIC : LIGHT_SEMANTIC;
    return map[name] ?? '';
  }

  getPalette(name: string): ColorPalette | null {
    return this.palettes[name] ?? null;
  }

  getPaletteShade(palette: string, shade: ColorScale): string | null {
    return this.palettes[palette]?.shades[shade] ?? null;
  }

  registerLightTokens(): void {
    for (const [key, value] of Object.entries(LIGHT_SEMANTIC)) {
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`color.${key}`, 'color', value),
      );
    }
  }

  registerDarkTokens(): void {
    for (const [key, value] of Object.entries(DARK_SEMANTIC)) {
      this.tokenRegistry.register(
        DesignTokenRegistryService.buildToken(`color.${key}`, 'color', value),
      );
    }
  }
}
