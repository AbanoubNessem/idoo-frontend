import { TestBed } from '@angular/core/testing';
import { TableEmptyRendererService } from '../renderers/table-empty-renderer.service';
import { TableLoadingRendererService } from '../renderers/table-loading-renderer.service';
import { TableErrorRendererService } from '../renderers/table-error-renderer.service';

// ─── TableEmptyRendererService ────────────────────────────────────────────────

describe('TableEmptyRendererService', () => {
  let service: TableEmptyRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableEmptyRendererService);
    service.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build an empty node with default message', () => {
    const node = service.buildEmptyNode();
    expect(node.type).toBe('empty');
    expect(node.message).toBe('No records found.');
    expect(node.visible).toBeTrue();
  });

  it('should override message via argument', () => {
    const node = service.buildEmptyNode({ message: 'Nothing here' });
    expect(node.message).toBe('Nothing here');
  });

  it('should configure default message globally', () => {
    service.configure({ message: 'Empty table' });
    expect(service.buildEmptyNode().message).toBe('Empty table');
  });

  it('should reset to default config', () => {
    service.configure({ message: 'Custom' });
    service.reset();
    expect(service.buildEmptyNode().message).toBe('No records found.');
  });

  it('should include icon when set', () => {
    const node = service.buildEmptyNode({ icon: '🗋' });
    expect(node.icon).toBe('🗋');
  });
});

// ─── TableLoadingRendererService ──────────────────────────────────────────────

describe('TableLoadingRendererService', () => {
  let service: TableLoadingRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableLoadingRendererService);
    service.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a loading node with default skeleton rows', () => {
    const node = service.buildLoadingNode(4);
    expect(node.type).toBe('loading');
    expect(node.skeletonRows).toBe(5);
    expect(node.columnCount).toBe(4);
    expect(node.visible).toBeTrue();
  });

  it('should override skeletonRows via argument', () => {
    expect(service.buildLoadingNode(3, { skeletonRows: 10 }).skeletonRows).toBe(10);
  });

  it('should configure globally', () => {
    service.configure({ skeletonRows: 8 });
    expect(service.buildLoadingNode(3).skeletonRows).toBe(8);
  });

  it('should reset to 5 skeleton rows', () => {
    service.configure({ skeletonRows: 8 });
    service.reset();
    expect(service.buildLoadingNode(3).skeletonRows).toBe(5);
  });
});

// ─── TableErrorRendererService ────────────────────────────────────────────────

describe('TableErrorRendererService', () => {
  let service: TableErrorRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableErrorRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build error node from string', () => {
    const node = service.buildErrorNode('Something failed');
    expect(node.type).toBe('error');
    expect(node.message).toBe('Something failed');
    expect(node.visible).toBeTrue();
  });

  it('should build error node from Error object', () => {
    const err = new Error('bang');
    const node = service.buildErrorNode(err);
    expect(node.message).toBe('bang');
    expect(node.details).toBeTruthy();
  });

  it('should build error node from ErrorConfig object', () => {
    const node = service.buildErrorNode({ message: 'cfg error', details: 'stack...' });
    expect(node.message).toBe('cfg error');
    expect(node.details).toBe('stack...');
  });

  it('fromHttpStatus 401 should produce unauthorized message', () => {
    const node = service.fromHttpStatus(401);
    expect(node.message).toContain('Unauthorized');
  });

  it('fromHttpStatus 403 should produce access denied message', () => {
    const node = service.fromHttpStatus(403);
    expect(node.message).toContain('denied');
  });

  it('fromHttpStatus 404 should produce not found message', () => {
    expect(service.fromHttpStatus(404).message).toContain('not found');
  });

  it('fromHttpStatus 500 should produce server error message', () => {
    expect(service.fromHttpStatus(500).message).toContain('Server error');
  });

  it('fromHttpStatus unknown should fall back to statusText', () => {
    expect(service.fromHttpStatus(418, "I'm a teapot").message).toContain('teapot');
  });
});
