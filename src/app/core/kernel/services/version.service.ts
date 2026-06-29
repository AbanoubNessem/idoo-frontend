import { Injectable, inject } from '@angular/core';
import { PLATFORM_CONFIG_TOKEN } from '../kernel.tokens';
import { PlatformVersion } from '../kernel.types';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private readonly config = inject(PLATFORM_CONFIG_TOKEN);
  private readonly parsed: PlatformVersion = this.parse(this.config.platformVersion);

  getVersion(): PlatformVersion {
    return this.parsed;
  }

  getRaw(): string {
    return this.parsed.raw;
  }

  satisfies(range: string): boolean {
    return this.satisfiesRange(this.parsed, range);
  }

  isCompatibleWith(requiredRange: string): boolean {
    return this.satisfies(requiredRange);
  }

  compareVersions(a: string, b: string): -1 | 0 | 1 {
    const va = this.parse(a);
    const vb = this.parse(b);
    if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
    if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
    if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
    return 0;
  }

  parse(raw: string): PlatformVersion {
    const clean = raw.replace(/^[^0-9]*/, '');
    const parts = clean.split('.').map(Number);
    return {
      major: parts[0] ?? 0,
      minor: parts[1] ?? 0,
      patch: parts[2] ?? 0,
      raw,
    };
  }

  private satisfiesRange(version: PlatformVersion, range: string): boolean {
    const v = version;

    if (range === '*') return true;

    if (range.startsWith('^')) {
      const min = this.parse(range.slice(1));
      return v.major === min.major && this.compareVersionTuples(v, min) >= 0;
    }

    if (range.startsWith('~')) {
      const min = this.parse(range.slice(1));
      return v.major === min.major && v.minor === min.minor && v.patch >= min.patch;
    }

    if (range.startsWith('>=')) {
      const min = this.parse(range.slice(2).trim());
      return this.compareVersionTuples(v, min) >= 0;
    }

    if (range.startsWith('>')) {
      const min = this.parse(range.slice(1).trim());
      return this.compareVersionTuples(v, min) > 0;
    }

    if (range.startsWith('<=')) {
      const max = this.parse(range.slice(2).trim());
      return this.compareVersionTuples(v, max) <= 0;
    }

    if (range.startsWith('<')) {
      const max = this.parse(range.slice(1).trim());
      return this.compareVersionTuples(v, max) < 0;
    }

    const exact = this.parse(range);
    return v.major === exact.major && v.minor === exact.minor && v.patch === exact.patch;
  }

  private compareVersionTuples(a: PlatformVersion, b: PlatformVersion): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }
}
