import { TestBed } from '@angular/core/testing';
import { MaterialAdapterConnector } from '../adapter/material-adapter.connector';
import { MaterialAdapter } from '../../rendering/adapters/material.adapter';
import { ComponentRegistryService } from '../registry/component-registry.service';
import { PlatformTextFieldComponent } from '../fields/text-field/platform-text-field.component';
import { PlatformSelectFieldComponent } from '../fields/select-field/platform-select-field.component';
import { PlatformCheckboxFieldComponent } from '../fields/checkbox-field/platform-checkbox-field.component';
import { PlatformMarkdownFieldComponent } from '../fields/markdown-field/platform-markdown-field.component';

describe('MaterialAdapterConnector', () => {
  let connector: MaterialAdapterConnector;
  let adapter: MaterialAdapter;
  let registry: ComponentRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    connector = TestBed.inject(MaterialAdapterConnector);
    adapter   = TestBed.inject(MaterialAdapter);
    registry  = TestBed.inject(ComponentRegistryService);
  });

  it('should be created', () => {
    expect(connector).toBeTruthy();
  });

  it('should not be connected before connect() is called', () => {
    expect(connector.connected).toBeFalse();
  });

  it('should be connected after connect() is called', () => {
    connector.connect();
    expect(connector.connected).toBeTrue();
  });

  it('should be idempotent — second connect() is a no-op', () => {
    connector.connect();
    connector.connect();
    expect(connector.connected).toBeTrue();
  });

  it('should register PlatformTextFieldComponent for "text" type in adapter', () => {
    connector.connect();
    expect(adapter.getFieldComponent('text')).toBe(PlatformTextFieldComponent);
  });

  it('should register PlatformSelectFieldComponent for "select" type in adapter', () => {
    connector.connect();
    expect(adapter.getFieldComponent('select')).toBe(PlatformSelectFieldComponent);
  });

  it('should register PlatformCheckboxFieldComponent for "boolean" type in adapter', () => {
    connector.connect();
    expect(adapter.getFieldComponent('boolean')).toBe(PlatformCheckboxFieldComponent);
  });

  it('should register PlatformMarkdownFieldComponent for "markdown" type in adapter', () => {
    connector.connect();
    expect(adapter.getFieldComponent('markdown')).toBe(PlatformMarkdownFieldComponent);
  });

  it('should register all 19 field types in the ComponentRegistry', () => {
    connector.connect();
    expect(registry.registeredCount()).toBeGreaterThanOrEqual(19);
  });

  it('should register components with category "field" in registry', () => {
    connector.connect();
    const fields = registry.query({ category: 'field' });
    expect(fields.length).toBeGreaterThanOrEqual(19);
  });

  it('should register text field with correct fieldType in registry', () => {
    connector.connect();
    const entry = registry.get('platform-text-field');
    expect(entry?.fieldType).toBe('text');
  });

  it('should register all entries with version 5.0', () => {
    connector.connect();
    const entries = registry.all();
    expect(entries.every(e => e.version === '5.0')).toBeTrue();
  });

  it('should tag each entry with "material"', () => {
    connector.connect();
    const matEntries = registry.query({ tags: ['material'] });
    expect(matEntries.length).toBeGreaterThanOrEqual(19);
  });
});
