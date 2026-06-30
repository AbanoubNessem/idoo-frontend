import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { LayoutEngineService } from '../layout-engine.service';
import { LayoutDefinition } from '../layout.types';

const gridDef: LayoutDefinition = { id: 'eng-grid', type: 'grid', config: { grid: { columns: 3 } } };
const flexDef: LayoutDefinition = { id: 'eng-flex', type: 'flex' };

describe('LayoutEngineService', () => {
  let service: LayoutEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutEngineService);
  });

  afterEach(() => {
    service.destroy('eng-grid');
    service.destroy('eng-flex');
  });

  it('registers and resolves a definition', () => {
    service.register(gridDef);
    const resolved = service.resolve('eng-grid');
    expect(resolved).not.toBeNull();
    expect(resolved!.definition.id).toBe('eng-grid');
  });

  it('has() returns true after register', () => {
    service.register(flexDef);
    expect(service.has('eng-flex')).toBeTrue();
  });

  it('resolve() returns null for unknown id', () => {
    expect(service.resolve('totally-unknown')).toBeNull();
  });

  it('create() produces a ready instance', () => {
    service.register(gridDef);
    const inst = service.create('eng-grid');
    expect(inst.phase).toBe('ready');
  });

  it('create() with inline definition (no prior register)', () => {
    const inst = service.create({ id: 'inline-def', type: 'stack' });
    expect(inst.phase).toBe('ready');
    service.destroy('inline-def');
  });

  it('destroy() removes the instance', () => {
    service.register(flexDef);
    service.create('eng-flex');
    service.destroy('eng-flex');
    expect(service.getInstance('eng-flex')).toBeNull();
  });

  it('setDirection() updates direction signal', () => {
    service.setDirection('rtl');
    expect(service.direction()).toBe('rtl');
    service.setDirection('ltr');
  });

  it('toCssString() returns non-empty CSS', () => {
    const css = service.toCssString(gridDef);
    expect(css).toContain('display: grid');
  });

  it('builder property is available', () => {
    expect(service.builder).toBeTruthy();
    const def = service.builder.grid('b-test', 4).build();
    expect(def.config?.grid?.columns).toBe(4);
  });

  it('serialize/deserialize round-trips a definition', () => {
    const json = service.serialize(gridDef);
    const result = service.deserialize(json);
    expect(result.id).toBe('eng-grid');
  });
});
