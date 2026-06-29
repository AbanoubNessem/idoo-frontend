import { Injectable, signal, computed } from '@angular/core';
import { IconDefinition, IconVariant } from '../ui.types';

function sanitizeSvg(svg: string): string {
  // Strip script tags and on* attributes for XSS safety
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  private readonly _icons = new Map<string, IconDefinition>();
  private readonly _count = signal(0);

  readonly iconCount = computed(() => this._count());

  register(icon: IconDefinition): void {
    if (!icon.name?.trim()) throw new Error('IconRegistry: icon name is required');
    const sanitized: IconDefinition = { ...icon, svg: sanitizeSvg(icon.svg) };
    this._icons.set(this.key(icon.name, icon.variant), sanitized);
    this._count.set(this._icons.size);
  }

  registerAll(icons: ReadonlyArray<IconDefinition>): void {
    for (const icon of icons) this.register(icon);
  }

  get(name: string, variant: IconVariant = 'outlined'): IconDefinition | null {
    return this._icons.get(this.key(name, variant))
      ?? this._icons.get(this.key(name, 'filled'))
      ?? null;
  }

  getSvg(name: string, variant: IconVariant = 'outlined'): string | null {
    return this.get(name, variant)?.svg ?? null;
  }

  has(name: string, variant: IconVariant = 'outlined'): boolean {
    return this._icons.has(this.key(name, variant));
  }

  getByVariant(variant: IconVariant): ReadonlyArray<IconDefinition> {
    return Array.from(this._icons.values()).filter(i => i.variant === variant);
  }

  search(query: string): ReadonlyArray<IconDefinition> {
    const q = query.toLowerCase();
    return Array.from(this._icons.values()).filter(
      i => i.name.toLowerCase().includes(q) || i.tags?.some(t => t.toLowerCase().includes(q)),
    );
  }

  remove(name: string, variant: IconVariant = 'outlined'): boolean {
    const existed = this._icons.delete(this.key(name, variant));
    if (existed) this._count.set(this._icons.size);
    return existed;
  }

  clear(): void {
    this._icons.clear();
    this._count.set(0);
  }

  getAll(): ReadonlyArray<IconDefinition> {
    return Array.from(this._icons.values());
  }

  private key(name: string, variant: IconVariant): string {
    return `${name}:${variant}`;
  }
}
