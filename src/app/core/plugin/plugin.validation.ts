import { PluginManifest } from './plugin-manifest.model';

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const SEMVER_RANGE_PATTERN = /^[\^~>=<]?\d+\.[\d*]+\.[\d*]+$/;
const PLUGIN_ID_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export function validateManifest(manifest: PluginManifest): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest.id) {
    errors.push('id is required');
  } else if (!PLUGIN_ID_PATTERN.test(manifest.id)) {
    errors.push('id must be uppercase alphanumeric (e.g., HR, FLEET_MGMT)');
  }

  if (!manifest.name) errors.push('name is required');

  if (!manifest.version) {
    errors.push('version is required');
  } else if (!SEMVER_PATTERN.test(manifest.version)) {
    errors.push('version must be valid SemVer (e.g., 1.0.0)');
  }

  if (!manifest.minimumPlatformVersion) {
    errors.push('minimumPlatformVersion is required');
  } else if (!SEMVER_RANGE_PATTERN.test(manifest.minimumPlatformVersion)) {
    errors.push('minimumPlatformVersion must be a valid SemVer range (e.g., ^1.0.0)');
  }

  if (!manifest.category) errors.push('category is required');
  if (!manifest.author?.name) errors.push('author.name is required');

  if (manifest.overridePriority !== undefined) {
    if (!Number.isInteger(manifest.overridePriority)) {
      errors.push('overridePriority must be an integer');
    }
  }

  if (!manifest.entities?.length && !manifest.routes?.length && !manifest.widgets?.length) {
    warnings.push('Plugin contributes no entities, routes, or widgets.');
  }

  return { valid: errors.length === 0, errors, warnings };
}
