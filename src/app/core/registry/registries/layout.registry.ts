import { Injectable, Type } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface LayoutDef {
  id: string;
  name: string;
  component: () => Promise<Type<unknown>>;
  description?: string;
  slots?: string[];
}

@Injectable({ providedIn: 'root' })
export class LayoutRegistryService extends BaseRegistry<LayoutDef> {
  readonly name = 'layout';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';
}
