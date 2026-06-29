import { DynamicFormHistory, buildSnapshot } from '../state/dynamic-form-history';
import { FormSnapshot } from '../form.types';

function makeSnap(label?: string): FormSnapshot {
  return buildSnapshot('form-1', { name: label ?? 'default' }, {}, label);
}

describe('DynamicFormHistory', () => {
  let history: DynamicFormHistory;

  beforeEach(() => {
    history = new DynamicFormHistory(10);
  });

  it('should start empty', () => {
    expect(history.size()).toBe(0);
    expect(history.canUndo()).toBeFalse();
    expect(history.canRedo()).toBeFalse();
  });

  it('should push a snapshot', () => {
    history.push(makeSnap('v1'));
    expect(history.size()).toBe(1);
  });

  it('should allow undo after push', () => {
    history.push(makeSnap('v1'));
    history.push(makeSnap('v2'));
    expect(history.canUndo()).toBeTrue();
  });

  it('should return previous snapshot on undo', () => {
    history.push(makeSnap('v1'));
    history.push(makeSnap('v2'));
    const snap = history.undo();
    expect(snap?.model['name']).toBe('v1');
  });

  it('should enable redo after undo', () => {
    history.push(makeSnap('v1'));
    history.push(makeSnap('v2'));
    history.undo();
    expect(history.canRedo()).toBeTrue();
  });

  it('should return next snapshot on redo', () => {
    history.push(makeSnap('v1'));
    history.push(makeSnap('v2'));
    history.undo();
    const snap = history.redo();
    expect(snap?.model['name']).toBe('v2');
  });

  it('should return null when undo from first entry', () => {
    history.push(makeSnap('v1'));
    expect(history.undo()).toBeNull();
  });

  it('should return null when redo at latest', () => {
    history.push(makeSnap('v1'));
    expect(history.redo()).toBeNull();
  });

  it('should discard redo entries when pushing after undo', () => {
    history.push(makeSnap('v1'));
    history.push(makeSnap('v2'));
    history.undo();
    history.push(makeSnap('v3'));
    expect(history.canRedo()).toBeFalse();
    expect(history.size()).toBe(2);
  });

  it('should respect maxSize and trim oldest entries', () => {
    const small = new DynamicFormHistory(3);
    small.push(makeSnap('v1'));
    small.push(makeSnap('v2'));
    small.push(makeSnap('v3'));
    small.push(makeSnap('v4'));
    expect(small.size()).toBe(3);
  });

  it('should clear all entries', () => {
    history.push(makeSnap('v1'));
    history.push(makeSnap('v2'));
    history.clear();
    expect(history.size()).toBe(0);
    expect(history.canUndo()).toBeFalse();
  });

  it('should peek current snapshot without changing index', () => {
    history.push(makeSnap('v1'));
    history.push(makeSnap('v2'));
    const peeked = history.peek();
    expect(peeked?.model['name']).toBe('v2');
    expect(history.canRedo()).toBeFalse();
  });
});

describe('buildSnapshot', () => {
  it('should create snapshot with formId and model', () => {
    const snap = buildSnapshot('form-x', { a: 1 }, {}, 'test-label');
    expect(snap.formId).toBe('form-x');
    expect(snap.model['a']).toBe(1);
    expect(snap.label).toBe('test-label');
    expect(snap.capturedAt).toBeTruthy();
  });

  it('should generate unique ids', () => {
    const s1 = buildSnapshot('f', {}, {});
    const s2 = buildSnapshot('f', {}, {});
    expect(s1.id).not.toBe(s2.id);
  });
});
