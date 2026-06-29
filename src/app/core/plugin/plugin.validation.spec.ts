import { describe, it, expect } from 'vitest';
import { validateManifest } from './plugin.validation';
import { PluginManifest } from './plugin-manifest.model';

const validManifest: PluginManifest = {
  id: 'HR',
  name: 'Human Resources',
  version: '1.0.0',
  minimumPlatformVersion: '^1.0.0',
  category: 'erp',
  author: { name: 'iDoo' },
  enabledByDefault: true,
};

describe('validateManifest', () => {
  it('should accept a valid manifest', () => {
    const result = validateManifest(validManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing id', () => {
    const result = validateManifest({ ...validManifest, id: '' } as PluginManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('id'))).toBe(true);
  });

  it('should reject lowercase id', () => {
    const result = validateManifest({ ...validManifest, id: 'hr' } as PluginManifest);
    expect(result.valid).toBe(false);
  });

  it('should reject invalid SemVer version', () => {
    const result = validateManifest({ ...validManifest, version: 'v1.0' } as PluginManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('version'))).toBe(true);
  });

  it('should reject missing author.name', () => {
    const result = validateManifest({ ...validManifest, author: { name: '' } });
    expect(result.valid).toBe(false);
  });

  it('should warn when no entities/routes/widgets', () => {
    const result = validateManifest(validManifest);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should accept manifest with entities', () => {
    const result = validateManifest({ ...validManifest, entities: [{ id: 'hr:employee', apiPath: '/v1/employees', labelSingular: 'Employee', labelPlural: 'Employees', labelField: 'name', icon: 'person', permissions: { list: 'HR:EMPLOYEES:READ' } }] });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
