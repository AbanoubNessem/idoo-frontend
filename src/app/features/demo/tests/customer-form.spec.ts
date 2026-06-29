import { CustomerFormDef, CustomerEditFormDef } from '../customer/customer.form';

describe('CustomerFormDef', () => {
  it('should be defined with correct id and layout', () => {
    expect(CustomerFormDef.id).toBe('customer-create');
    expect(CustomerFormDef.layout).toBe('tabs');
    expect(CustomerFormDef.mode).toBe('create');
  });

  it('should have exactly 4 tabs', () => {
    expect(CustomerFormDef.tabs).toBeDefined();
    expect(CustomerFormDef.tabs!.length).toBe(4);
  });

  it('should have Basic Info tab with identity and contact sections', () => {
    const basicTab = CustomerFormDef.tabs!.find(t => t.id === 'basic');
    expect(basicTab).toBeDefined();
    expect(basicTab!.sections.some(s => s.id === 'identity')).toBeTrue();
    expect(basicTab!.sections.some(s => s.id === 'contact-info')).toBeTrue();
  });

  it('should have contacts tab with arrays (contacts array)', () => {
    const contactsTab = CustomerFormDef.tabs!.find(t => t.id === 'contacts');
    expect(contactsTab).toBeDefined();
    const section = contactsTab!.sections[0];
    expect(section.arrays).toBeDefined();
    expect(section.arrays!.length).toBeGreaterThan(0);
    expect(section.arrays![0].key).toBe('contacts');
  });

  it('should have valueExpression on displayName', () => {
    const basicTab    = CustomerFormDef.tabs!.find(t => t.id === 'basic')!;
    const identitySec = basicTab.sections.find(s => s.id === 'identity')!;
    const displayName = identitySec.fields!.find(f => f.key === 'displayName');
    expect(displayName?.valueExpression).toBeTruthy();
  });

  it('should have hiddenExpression on industry field', () => {
    const basicTab    = CustomerFormDef.tabs!.find(t => t.id === 'basic')!;
    const identitySec = basicTab.sections.find(s => s.id === 'identity')!;
    const industry    = identitySec.fields!.find(f => f.key === 'industry');
    expect(industry?.hiddenExpression).toBeTruthy();
  });

  it('should have permission guard on vatNumber', () => {
    const basicTab    = CustomerFormDef.tabs!.find(t => t.id === 'basic')!;
    const contactSec  = basicTab.sections.find(s => s.id === 'contact-info')!;
    const vat         = contactSec.fields!.find(f => f.key === 'vatNumber');
    expect(vat?.permissions).toContain('can_view_financial');
  });

  it('should have draftMode enabled', () => {
    expect(CustomerFormDef.draftMode).toBeTrue();
  });
});

describe('CustomerEditFormDef', () => {
  it('should have id customer-edit and mode edit', () => {
    expect(CustomerEditFormDef.id).toBe('customer-edit');
    expect(CustomerEditFormDef.mode).toBe('edit');
  });

  it('should share the same tab structure as CustomerFormDef', () => {
    expect(CustomerEditFormDef.tabs?.length).toBe(CustomerFormDef.tabs?.length);
  });
});
