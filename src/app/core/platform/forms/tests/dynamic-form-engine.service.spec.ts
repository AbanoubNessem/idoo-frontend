import { TestBed } from '@angular/core/testing';
import { DynamicFormEngine } from '../engine/dynamic-form-engine.service';
import { DynamicFormRegistryService } from '../registry/dynamic-form-registry.service';
import { FormDefinition } from '../form.types';

const minimalDef: FormDefinition = {
  id: 'engine-test-form',
  version: '1.0',
  mode: 'create',
  layout: 'simple',
  sections: [{
    id: 's1', layout: 'grid', columns: 1,
    fields: [{ key: 'name', label: 'Name', type: 'text' }],
  }],
};

describe('DynamicFormEngine', () => {
  let engine: DynamicFormEngine;
  let registry: DynamicFormRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine   = TestBed.inject(DynamicFormEngine);
    registry = TestBed.inject(DynamicFormRegistryService);
  });

  afterEach(() => {
    engine.destroyAll();
  });

  it('should be created', () => {
    expect(engine).toBeTruthy();
  });

  it('should start with zero instances', () => {
    expect(engine.instanceCount()).toBe(0);
  });

  it('should expose sub-service facades', () => {
    expect(engine.Registry).toBe(registry);
    expect(engine.Diagnostics).toBeTruthy();
    expect(engine.Metrics).toBeTruthy();
    expect(engine.Events).toBeTruthy();
    expect(engine.Lifecycle).toBeTruthy();
  });

  it('should create a form instance', async () => {
    const instance = await engine.createForm(minimalDef, {});
    expect(instance).toBeTruthy();
    expect(instance.id).toBeTruthy();
    expect(engine.instanceCount()).toBe(1);
  });

  it('should retrieve instance by id', async () => {
    const instance = await engine.createForm(minimalDef, {});
    const retrieved = engine.getInstance(instance.id);
    expect(retrieved).toBe(instance);
  });

  it('should return null for unknown instance id', () => {
    expect(engine.getInstance('does-not-exist')).toBeNull();
  });

  it('should destroy instance and decrement count', async () => {
    const instance = await engine.createForm(minimalDef, {});
    engine.destroyInstance(instance.id);
    expect(engine.instanceCount()).toBe(0);
    expect(engine.getInstance(instance.id)).toBeNull();
  });

  it('should destroy all instances', async () => {
    await engine.createForm(minimalDef, {});
    await engine.createForm({ ...minimalDef, id: 'form2' }, {});
    engine.destroyAll();
    expect(engine.instanceCount()).toBe(0);
  });

  it('should create form by key via registry', async () => {
    engine.registerForm(minimalDef, ['test']);
    const instance = await engine.createFormByKey(minimalDef.id, {});
    expect(instance.definition.id).toBe(minimalDef.id);
  });

  it('should throw when creating by unknown key', async () => {
    await expectAsync(engine.createFormByKey('does-not-exist')).toBeRejected();
  });

  it('should register form in registry', () => {
    engine.registerForm(minimalDef, ['my-tag']);
    expect(engine.Registry.has(minimalDef.id)).toBeTrue();
  });

  it('should expose activeIds for all instances', async () => {
    const inst = await engine.createForm(minimalDef, {});
    expect(engine.activeIds()).toContain(inst.id);
  });

  it('should enable and disable diagnostics via engine', () => {
    engine.enableDiagnostics();
    expect(engine.Diagnostics.enabled()).toBeTrue();
    engine.disableDiagnostics();
    expect(engine.Diagnostics.enabled()).toBeFalse();
  });

  it('should return summary of all active instances', async () => {
    const inst = await engine.createForm(minimalDef, {});
    const summary = engine.getSummary();
    expect(summary.length).toBe(1);
    expect(summary[0].id).toBe(inst.id);
  });
});
