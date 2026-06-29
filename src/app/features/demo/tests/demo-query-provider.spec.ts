import { DemoQueryProvider } from '../mock/demo-query-provider';

describe('DemoQueryProvider', () => {
  let provider: DemoQueryProvider;

  beforeEach(() => { provider = new DemoQueryProvider(); });

  describe('search() — country', () => {
    it('should return all countries for empty query', async () => {
      const results = await provider.search('', { queryType: 'country' }, {});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter countries by name', async () => {
      const results = await provider.search('United', { queryType: 'country' }, {}) as { label: string }[];
      expect(results.every(r => r.label.toLowerCase().includes('united'))).toBeTrue();
    });

    it('should return objects with id and label', async () => {
      const results = await provider.search('', { queryType: 'country' }, {}) as { id: string; label: string }[];
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('label');
    });
  });

  describe('search() — user', () => {
    it('should return account managers', async () => {
      const results = await provider.search('', { queryType: 'user' }, {});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter account managers by name', async () => {
      const results = await provider.search('Sarah', { queryType: 'user' }, {}) as { label: string }[];
      expect(results.some(r => r.label.includes('Sarah'))).toBeTrue();
    });
  });

  describe('search() — industry', () => {
    it('should return industry list', async () => {
      const results = await provider.search('', { queryType: 'industry' }, {});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter industries', async () => {
      const results = await provider.search('tech', { queryType: 'industry' }, {}) as { label: string }[];
      expect(results.some(r => r.label.toLowerCase().includes('tech'))).toBeTrue();
    });
  });

  describe('search() — unknown type', () => {
    it('should return empty array for unknown queryType', async () => {
      const results = await provider.search('', { queryType: 'unknown' }, {});
      expect(results).toEqual([]);
    });
  });

  describe('search() — lookupType fallback', () => {
    it('should support lookupType as fallback for queryType', async () => {
      const results = await provider.search('', { lookupType: 'country' }, {});
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
