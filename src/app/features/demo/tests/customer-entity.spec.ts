import { CustomerEntity } from '../customer/customer.entity';

describe('CustomerEntity', () => {
  it('should be defined as an entity', () => {
    expect(CustomerEntity).toBeDefined();
    expect(CustomerEntity.__type).toBe('entity');
  });

  it('should have the correct id', () => {
    expect(CustomerEntity.id).toBe('customer');
  });

  it('should have required display names', () => {
    expect(CustomerEntity.displayName).toBe('Customer');
    expect(CustomerEntity.pluralName).toBe('Customers');
  });

  it('should have all 22 fields', () => {
    expect(CustomerEntity.fields.length).toBeGreaterThanOrEqual(20);
  });

  it('should have firstName and lastName as required fields', () => {
    const firstName = CustomerEntity.fields.find(f => f.key === 'firstName');
    const lastName  = CustomerEntity.fields.find(f => f.key === 'lastName');
    expect(firstName).toBeDefined();
    expect(firstName!.required).toBeTrue();
    expect(lastName).toBeDefined();
    expect(lastName!.required).toBeTrue();
  });

  it('should have email with email validator', () => {
    const email = CustomerEntity.fields.find(f => f.key === 'email');
    expect(email).toBeDefined();
    expect(email!.validators?.some(v => v.type === 'email')).toBeTrue();
  });

  it('should have permissions defined', () => {
    expect(CustomerEntity.permissions).toBeDefined();
    expect(CustomerEntity.permissions!.length).toBeGreaterThan(0);
  });

  it('should have metadata with apiPath', () => {
    expect(CustomerEntity.metadata?.['apiPath']).toBe('/api/customers');
    expect(CustomerEntity.metadata?.['primaryKey']).toBe('id');
  });
});
