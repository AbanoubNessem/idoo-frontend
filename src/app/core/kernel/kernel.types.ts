import { Signal } from '@angular/core';

// ─── Boot State Machine ───────────────────────────────────────────────────────

export type KernelState =
  | 'idle'
  | 'booting'
  | 'ready'
  | 'degraded'
  | 'error'
  | 'shutting-down'
  | 'offline';

export interface KernelStateTransition {
  from: KernelState;
  to: KernelState;
  trigger: string;
}

// ─── Boot Context ────────────────────────────────────────────────────────────

export interface BootStepResult {
  stepId: string;
  success: boolean;
  durationMs: number;
  error?: Error;
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface BootContext {
  config: PlatformConfig;
  discoveredManifestIds: string[];
  sortedPluginIds: string[];
  loadedPluginIds: string[];
  failedPluginIds: string[];
  sessionRestored: boolean;
  stepResults: Map<string, BootStepResult>;
  warnings: string[];
  isDegraded: boolean;
  startedAt: number;
}

// ─── Platform Config ──────────────────────────────────────────────────────────

export interface PlatformConfig {
  apiUrl: string;
  production: boolean;
  platformVersion: string;
  bootTimeoutMs: number;
  enableHotReload: boolean;
  featureFlags: string[];
}

// ─── Version ─────────────────────────────────────────────────────────────────

export interface PlatformVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface KernelHealthReport {
  overallStatus: HealthStatus;
  checks: HealthCheckResult[];
  generatedAt: string;
  platformVersion: string;
}

export interface IHealthCheck {
  readonly name: string;
  readonly description: string;
  check(): Promise<HealthCheckResult>;
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export interface DiagnosticsReport {
  kernelState: KernelState;
  platformVersion: string;
  bootDurationMs: number;
  health: KernelHealthReport;
  stepResults: BootStepResult[];
  warnings: string[];
  registeredPluginCount: number;
  failedPluginCount: number;
  generatedAt: string;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export type LifecycleHookType =
  | 'beforeBoot'
  | 'afterBoot'
  | 'beforeShutdown'
  | 'afterShutdown'
  | 'onDegraded'
  | 'onError';

export type LifecycleHookFn = () => void | Promise<void>;

// ─── Kernel Events ────────────────────────────────────────────────────────────

export interface KernelEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  source: 'kernel' | 'plugin' | 'registry' | 'runtime';
}

export interface KernelBootStartedEvent extends KernelEvent<{ config: PlatformConfig }> {
  type: 'kernel:boot:started';
}

export interface KernelBootCompletedEvent extends KernelEvent<{ durationMs: number; isDegraded: boolean }> {
  type: 'kernel:boot:completed';
}

export interface KernelBootFailedEvent extends KernelEvent<{ error: string; stepId: string }> {
  type: 'kernel:boot:failed';
}

export interface KernelStateChangedEvent extends KernelEvent<{ from: KernelState; to: KernelState }> {
  type: 'kernel:state:changed';
}

export interface KernelShutdownStartedEvent extends KernelEvent<Record<string, never>> {
  type: 'kernel:shutdown:started';
}

export interface KernelShutdownCompletedEvent extends KernelEvent<Record<string, never>> {
  type: 'kernel:shutdown:completed';
}

export type AnyKernelEvent =
  | KernelBootStartedEvent
  | KernelBootCompletedEvent
  | KernelBootFailedEvent
  | KernelStateChangedEvent
  | KernelShutdownStartedEvent
  | KernelShutdownCompletedEvent;

// ─── Kernel API ───────────────────────────────────────────────────────────────

export interface KernelAPI {
  readonly state: Signal<KernelState>;
  readonly isReady: Signal<boolean>;
  readonly isDegraded: Signal<boolean>;
  boot(): Promise<void>;
  shutdown(): Promise<void>;
  getVersion(): PlatformVersion;
  getHealth(): Promise<KernelHealthReport>;
  getDiagnostics(): DiagnosticsReport;
}

// ─── Boot Metrics ────────────────────────────────────────────────────────────

export interface StepTiming {
  stepId: string;
  stepName: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface BootMetricsSummary {
  totalDurationMs: number;
  stepTimings: StepTiming[];
  slowestStep: string;
  pluginsDiscovered: number;
  pluginsLoaded: number;
  pluginsFailed: number;
}
