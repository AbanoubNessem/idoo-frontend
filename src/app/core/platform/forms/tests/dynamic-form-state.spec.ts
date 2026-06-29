import { DynamicFormState } from '../state/dynamic-form-state';

describe('DynamicFormState', () => {
  let state: DynamicFormState;

  beforeEach(() => {
    state = new DynamicFormState();
  });

  it('should initialize with uninitialized phase', () => {
    expect(state.phase()).toBe('uninitialized');
  });

  it('should initialize a field with defaults', () => {
    state.initField('name');
    const field = state.getField('name');
    expect(field.value).toBeNull();
    expect(field.errors).toEqual([]);
    expect(field.touched).toBeFalse();
    expect(field.dirty).toBeFalse();
  });

  it('should initialize a field with overrides', () => {
    state.initField('email', { value: 'test@test.com', required: true });
    const field = state.getField('email');
    expect(field.value).toBe('test@test.com');
    expect(field.required).toBeTrue();
  });

  it('should update value and set dirty', () => {
    state.initField('age', { value: 10 });
    state.setValue('age', 25);
    expect(state.getField('age').value).toBe(25);
    expect(state.getField('age').dirty).toBeTrue();
  });

  it('should not set dirty if value is unchanged', () => {
    state.initField('flag', { value: 'same' });
    state.setValue('flag', 'same');
    expect(state.getField('flag').dirty).toBeFalse();
  });

  it('should set errors on a field', () => {
    state.initField('code');
    state.setErrors('code', ['Invalid code']);
    expect(state.getField('code').errors).toEqual(['Invalid code']);
  });

  it('should clear errors on a specific field', () => {
    state.initField('x');
    state.setErrors('x', ['error']);
    state.clearErrors('x');
    expect(state.getField('x').errors).toEqual([]);
  });

  it('should clear all errors when no key given', () => {
    state.initField('a');
    state.initField('b');
    state.setErrors('a', ['err1']);
    state.setErrors('b', ['err2']);
    state.clearErrors();
    expect(state.getField('a').errors).toEqual([]);
    expect(state.getField('b').errors).toEqual([]);
  });

  it('should compute isValid false when errors exist', () => {
    state.initField('x');
    state.setErrors('x', ['required']);
    expect(state.isValid()).toBeFalse();
  });

  it('should compute isValid true when no errors', () => {
    state.initField('x');
    expect(state.isValid()).toBeTrue();
  });

  it('should compute isDirty from dirty fields', () => {
    state.initField('a');
    state.initField('b', { value: 1 });
    state.setValue('b', 2);
    expect(state.isDirty()).toBeTrue();
  });

  it('should compute model from all field values', () => {
    state.initField('name', { value: 'Alice' });
    state.initField('age', { value: 30 });
    const model = state.model();
    expect(model['name']).toBe('Alice');
    expect(model['age']).toBe(30);
  });

  it('should set and read phase', () => {
    state.setPhase('ready');
    expect(state.phase()).toBe('ready');
  });

  it('should hide and unhide fields', () => {
    state.initField('secret');
    state.setHidden('secret', true);
    expect(state.getField('secret').hidden).toBeTrue();
    state.setHidden('secret', false);
    expect(state.getField('secret').hidden).toBeFalse();
  });

  it('should mark field as touched', () => {
    state.initField('phone');
    state.setTouched('phone', true);
    expect(state.getField('phone').touched).toBeTrue();
  });

  it('should compute allErrors returning only fields with errors', () => {
    state.initField('a');
    state.initField('b');
    state.setErrors('a', ['required']);
    const errors = state.allErrors();
    expect(Object.keys(errors)).toEqual(['a']);
  });

  it('should reset all fields', () => {
    state.initField('x', { value: 'old', dirty: true });
    state.reset(['x'], { x: 'fresh' });
    expect(state.getField('x').value).toBe('fresh');
    expect(state.getField('x').dirty).toBeFalse();
  });

  it('should set autosave status', () => {
    state.setAutosaveStatus('saving');
    expect(state.autosaveStatus()).toBe('saving');
  });

  it('should record lastSavedAt when status is saved', () => {
    state.setAutosaveStatus('saved');
    expect(state.lastSavedAt()).not.toBeNull();
  });

  it('should initialize and read section state', () => {
    state.initSection('sec1', { collapsed: true });
    expect(state.getSection('sec1').collapsed).toBeTrue();
  });

  it('should toggle section collapsed', () => {
    state.initSection('sec2');
    state.setSectionCollapsed('sec2', true);
    expect(state.getSection('sec2').collapsed).toBeTrue();
  });

  it('should build validation result', () => {
    state.initField('a');
    state.setErrors('a', ['err1', 'err2']);
    const result = state.buildValidationResult();
    expect(result.valid).toBeFalse();
    expect(result.errorCount).toBe(2);
  });

  it('should snapshot and restore field states', () => {
    state.initField('name', { value: 'Alice' });
    const snap = state.snapshot();
    state.setValue('name', 'Bob');
    state.restoreSnapshot(snap);
    expect(state.getField('name').value).toBe('Alice');
  });
});
