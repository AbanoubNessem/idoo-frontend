import { Injectable } from '@angular/core';
import { FormQueryProvider } from '../../../core/platform/forms/form.types';
import { MOCK_COUNTRIES, MOCK_ACCOUNT_MANAGERS } from './mock-data';

@Injectable()
export class DemoQueryProvider implements FormQueryProvider {

  async search(
    query: string,
    config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Promise<unknown[]> {
    // Simulate network latency in demo
    await this._delay(150);

    const queryType = config['queryType'] as string ?? config['lookupType'] as string ?? '';
    const q = query.toLowerCase().trim();

    switch (queryType) {
      case 'country':
        return MOCK_COUNTRIES
          .filter(c => !q || c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
          .map(c => ({ id: c.code, label: `${c.flag ?? ''} ${c.label}`.trim(), description: c.code }));

      case 'user':
        return MOCK_ACCOUNT_MANAGERS
          .filter(m => !q || m.name.toLowerCase().includes(q))
          .map(m => ({ id: m.id, label: m.name, description: m.role }));

      case 'industry':
        return [
          { id: 'tech',         label: 'Technology' },
          { id: 'finance',      label: 'Finance' },
          { id: 'healthcare',   label: 'Healthcare' },
          { id: 'retail',       label: 'Retail' },
          { id: 'manufacturing', label: 'Manufacturing' },
          { id: 'realestate',   label: 'Real Estate' },
          { id: 'education',    label: 'Education' },
          { id: 'other',        label: 'Other' },
        ].filter(i => !q || i.label.toLowerCase().includes(q));

      default:
        return [];
    }
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
