import { InjectionToken } from '@angular/core';
import { ModuleConfig } from '../models/registry.models';

export const MODULE_CONFIG_TOKEN = new InjectionToken<ModuleConfig[]>('MODULE_CONFIG_TOKEN');
