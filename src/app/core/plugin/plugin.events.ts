import { PluginLifecycleState } from './plugin.types';

export type PluginEventType =
  | 'plugin:discovered'
  | 'plugin:validated'
  | 'plugin:resolved'
  | 'plugin:loaded'
  | 'plugin:initialized'
  | 'plugin:registered'
  | 'plugin:ready'
  | 'plugin:active'
  | 'plugin:failed'
  | 'plugin:disabled'
  | 'plugin:stopped'
  | 'plugin:unloaded'
  | 'plugin:system:ready'
  | 'plugin:system:error';

export interface PluginSystemEvent {
  type: PluginEventType;
  pluginId: string;
  state: PluginLifecycleState;
  timestamp: string;
  metadata?: Record<string, unknown>;
  error?: string;
}
