import { DemoValidator } from '../mock/demo-validator';

describe('DemoValidator', () => {
  let validator: DemoValidator;

  beforeEach(() => { validator = new DemoValidator(); });

  describe('required', () => {
    it('should fail for null', async () => {
      const errors = await validator.validate(null, [{ type: 'required' }], {});
      expect(errors.length).toBeGreaterThan(0);
    });
    it('should fail for empty string', async () => {
      const errors = await validator.validate('', [{ type: 'required' }], {});
      expect(errors.length).toBeGreaterThan(0);
    });
    it('should fail for empty array', async () => {
      const errors = await validator.validate([], [{ type: 'required' }], {});
      expect(errors.length).toBeGreaterThan(0);
    });
    it('should pass for non-empty value', async () => {
      const errors = await validator.validate('hello', [{ type: 'required' }], {});
      expect(errors).toHaveSize(0);
    });
    it('should use custom message', async () => {
      const errors = await validator.validate('', [{ type: 'required', message: 'Custom msg' }], {});
      expect(errors[0]).toBe('Custom msg');
    });
  });

  describe('email', () => {
    it('should fail for invalid email', async () => {
      const errors = await validator.validate('notanemail', [{ type: 'email' }], {});
      expect(errors.length).toBeGreaterThan(0);
    });
    it('should pass for valid email', async () => {
      const errors = await validator.validate('user@example.com', [{ type: 'email' }], {});
      expect(errors).toHaveSize(0);
    });
    it('should pass for empty value (not required)', async () => {
      const errors = await validator.validate('', [{ type: 'email' }], {});
      expect(errors).toHaveSize(0);
    });
  });

  describe('phone', () => {
    it('should fail for invalid phone', async () => {
      const errors = await validator.validate('abc', [{ type: 'phone' }], {});
      expect(errors.length).toBeGreaterThan(0);
    });
    it('should pass for valid phone', async () => {
      const errors = await validator.validate('+1 234 567 8900', [{ type: 'phone' }], {});
      expect(errors).toHaveSize(0);
    });
  });

  describe('minLength', () => {
    it('should fail when value is too short', async () => {
      const errors = await validator.validate('ab', [{ type: 'minLength', params: { min: 5 } }], {});
      expect(errors.length).toBeGreaterThan(0);
    });
    it('should pass when value meets minimum', async () => {
      const errors = await validator.validate('hello', [{ type: 'minLength', params: { min: 5 } }], {});
      expect(errors).toHaveSize(0);
    });
  });

  describe('maxLength', () => {
    it('should fail when value exceeds maximum', async () => {
      const errors = await validator.validate('hello world', [{ type: 'maxLength', params: { max: 5 } }], {});
      expect(errors.length).toBeGreaterThan(0);
    });
    it('should pass when value is within maximum', async () => {
      const errors = await validator.validate('hi', [{ type: 'maxLength', params: { max: 5 } }], {});
      expect(errors).toHaveSize(0);
    });
  });

  describe('multiple validators', () => {
    it('should collect all errors', async () => {
      const errors = await validator.validate('', [
        { type: 'required', message: 'Required' },
        { type: 'minLength', params: { min: 10 }, message: 'Too short' },
      ], {});
      expect(errors).toContain('Required');
    });
  });
});
