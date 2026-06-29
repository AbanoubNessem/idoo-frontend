import { TestBed } from '@angular/core/testing';
import { DynamicFormSnapshotService } from '../snapshot/dynamic-form-snapshot.service';
import { DynamicFormState } from '../state/dynamic-form-state';

describe('DynamicFormSnapshotService', () => {
  let service: DynamicFormSnapshotService;
  let state: DynamicFormState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFormSnapshotService);
    state = new DynamicFormState();
    state.initField('name', { value: 'Alice' });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with zero snapshots', () => {
    expect(service.count()).toBe(0);
  });

  it('should capture a snapshot', () => {
    const snap = service.capture('f1', state, 'test');
    expect(snap.formId).toBe('f1');
    expect(snap.label).toBe('test');
    expect(snap.model['name']).toBe('Alice');
  });

  it('should store captured snapshots', () => {
    service.capture('f1', state);
    expect(service.count()).toBe(1);
  });

  it('should restore snapshot into state', () => {
    const snap = service.capture('f1', state);
    state.setValue('name', 'Bob');
    service.restore(snap, state);
    expect(state.getField('name').value).toBe('Alice');
  });

  it('should retrieve snapshot by id', () => {
    const snap = service.capture('f1', state);
    expect(service.get(snap.id)).toEqual(snap);
  });

  it('should filter snapshots by form id', () => {
    service.capture('f1', state);
    service.capture('f2', state);
    expect(service.forForm('f1').length).toBe(1);
  });

  it('should remove a snapshot by id', () => {
    const snap = service.capture('f1', state);
    service.remove(snap.id);
    expect(service.get(snap.id)).toBeUndefined();
  });

  it('should clear all snapshots for a form', () => {
    service.capture('f1', state);
    service.capture('f1', state);
    service.capture('f2', state);
    service.clearForm('f1');
    expect(service.forForm('f1').length).toBe(0);
    expect(service.forForm('f2').length).toBe(1);
  });

  it('should save and load draft from localStorage', () => {
    const snap = service.capture('f1', state);
    service.saveDraft('f1', snap);
    expect(service.hasDraft('f1')).toBeTrue();
    const loaded = service.loadDraft('f1');
    expect(loaded?.formId).toBe('f1');
    service.clearDraft('f1');
    expect(service.hasDraft('f1')).toBeFalse();
  });
});
