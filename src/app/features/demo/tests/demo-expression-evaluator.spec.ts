import { DemoExpressionEvaluator } from '../mock/demo-expression-evaluator';

describe('DemoExpressionEvaluator', () => {
  let evaluator: DemoExpressionEvaluator;

  beforeEach(() => { evaluator = new DemoExpressionEvaluator(); });

  describe('evaluate()', () => {
    it('should evaluate simple arithmetic', () => {
      expect(evaluator.evaluate('1 + 2', {})).toBe(3);
    });

    it('should evaluate context variable', () => {
      expect(evaluator.evaluate('name', { name: 'Alice' })).toBe('Alice');
    });

    it('should evaluate ternary expression', () => {
      const result = evaluator.evaluate(
        'customerType === "individual"',
        { customerType: 'individual' },
      );
      expect(result).toBeTrue();
    });

    it('should evaluate string concatenation', () => {
      const result = evaluator.evaluate(
        'firstName + " " + lastName',
        { firstName: 'John', lastName: 'Doe' },
      );
      expect(result).toBe('John Doe');
    });

    it('should return undefined for empty expression', () => {
      expect(evaluator.evaluate('', {})).toBeUndefined();
      expect(evaluator.evaluate('   ', {})).toBeUndefined();
    });

    it('should return undefined for invalid expression (not throw)', () => {
      expect(() => evaluator.evaluate('!!@invalid@@', {})).not.toThrow();
    });

    it('should return undefined on runtime error in expression', () => {
      const result = evaluator.evaluate('undeclaredVar.property', {});
      expect(result).toBeUndefined();
    });
  });

  describe('evaluateBoolean()', () => {
    it('should return true for truthy expression', () => {
      expect(evaluator.evaluateBoolean('1 === 1', {})).toBeTrue();
    });

    it('should return false for falsy expression', () => {
      expect(evaluator.evaluateBoolean('1 === 2', {})).toBeFalse();
    });

    it('should return false for empty expression', () => {
      expect(evaluator.evaluateBoolean('', {})).toBeFalse();
    });

    it('should evaluate hiddenExpression from customer form', () => {
      // industry hidden when customerType === "individual"
      const hidden = evaluator.evaluateBoolean(
        'customerType === "individual"',
        { customerType: 'individual' },
      );
      expect(hidden).toBeTrue();

      const shown = evaluator.evaluateBoolean(
        'customerType === "individual"',
        { customerType: 'business' },
      );
      expect(shown).toBeFalse();
    });

    it('should evaluate displayName valueExpression', () => {
      const result = evaluator.evaluate(
        'firstName && lastName ? firstName + " " + lastName : displayName',
        { firstName: 'Jane', lastName: 'Smith', displayName: '' },
      );
      expect(result).toBe('Jane Smith');
    });
  });
});
