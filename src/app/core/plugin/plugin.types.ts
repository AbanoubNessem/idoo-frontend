// ─── Plugin Lifecycle States ──────────────────────────────────────────────────

export type PluginLifecycleState =
  | 'DISCOVERED'
  | 'VALIDATED'
  | 'RESOLVED'
  | 'LOADED'
  | 'INITIALIZED'
  | 'REGISTERED'
  | 'READY'
  | 'ACTIVE'
  | 'FAILED'
  | 'DISABLED'
  | 'STOPPED'
  | 'UNLOADED';

// ─── Plugin Category ──────────────────────────────────────────────────────────

export type PluginCategory =
  | 'erp'
  | 'analytics'
  | 'integration'
  | 'tenant-config'
  | 'core-extension'
  | 'marketplace';

// ─── Plugin Error Codes ───────────────────────────────────────────────────────

export type PluginErrorCode =
  | 'MANIFEST_INVALID'
  | 'DEPENDENCY_MISSING'
  | 'DEPENDENCY_CYCLE'
  | 'VERSION_INCOMPATIBLE'
  | 'INIT_FAILED'
  | 'REGISTRATION_FAILED'
  | 'CAPABILITY_CONFLICT'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface PluginError {
  code: PluginErrorCode;
  pluginId: string;
  message: string;
  cause?: Error;
  timestamp: string;
}

// ─── Plugin Boot Result ───────────────────────────────────────────────────────

export interface PluginBootResult {
  pluginId: string;
  success: boolean;
  state: PluginLifecycleState;
  durationMs: number;
  error?: PluginError;
  warnings: string[];
}

// ─── Plugin System Status ─────────────────────────────────────────────────────

export type PluginSystemStatus =
  | 'idle'
  | 'discovering'
  | 'loading'
  | 'registering'
  | 'ready'
  | 'error';

// ─── Plugin Runtime Entry ─────────────────────────────────────────────────────

export interface PluginRuntimeEntry {
  manifest: import('./plugin-manifest.model').PluginManifest;
  state: PluginLifecycleState;
  bootResult: PluginBootResult | null;
  loadedAt: string | null;
  activeAt: string | null;
  error: PluginError | null;
}

// ─── Plugin Dependency ────────────────────────────────────────────────────────

export interface PluginDependency {
  pluginId: string;
  version: string;
  optional?: boolean;
  reason?: string;
}

// ─── Plugin Diagnostics Report ────────────────────────────────────────────────

export interface PluginDiagnosticsReport {
  totalDiscovered: number;
  totalLoaded: number;
  totalFailed: number;
  totalDisabled: number;
  plugins: PluginRuntimeEntry[];
  systemStatus: PluginSystemStatus;
  generatedAt: string;
}
