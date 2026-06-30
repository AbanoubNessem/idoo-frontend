import { TestBed } from '@angular/core/testing';
import { LocalizationEngineService } from './localization-engine.service';

describe('LocalizationEngineService', () => {
  let svc: LocalizationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(LocalizationEngineService);
  });

  afterEach(() => svc.ngOnDestroy());

  it('is created', () => expect(svc).toBeTruthy());

  // ─── Date Formatting ────────────────────────────────────────────────────

  it('formatDate() returns a FormattedDate', () => {
    const d      = new Date('2024-03-15');
    const result = svc.formatDate(d);
    expect(result.formatted).toBeTruthy();
    expect(result.raw).toBe(d);
    expect(result.locale).toBeTruthy();
  });

  it('formatDate() accepts a timestamp', () => {
    const result = svc.formatDate(0);
    expect(result.formatted).toBeTruthy();
  });

  it('formatDate() accepts a date string', () => {
    const result = svc.formatDate('2024-06-01');
    expect(result.formatted).toBeTruthy();
  });

  it('formatDateStyle() formats with different styles', () => {
    const d      = new Date('2024-03-15');
    const short  = svc.formatDateStyle(d, 'short');
    const long   = svc.formatDateStyle(d, 'long');
    expect(short).toBeTruthy();
    expect(long).toBeTruthy();
    expect(long.length).toBeGreaterThan(short.length);
  });

  it('formatTime() returns a FormattedDate with time', () => {
    const result = svc.formatTime(new Date());
    expect(result.formatted).toBeTruthy();
  });

  it('formatDateTime() combines date and time', () => {
    const result = svc.formatDateTime(new Date());
    expect(result.formatted).toBeTruthy();
  });

  // ─── Number Formatting ───────────────────────────────────────────────────

  it('formatNumber() formats a number', () => {
    const result = svc.formatNumber(1234567.89);
    expect(result.formatted).toBeTruthy();
    expect(result.raw).toBe(1234567.89);
  });

  it('formatInteger() has no decimal places', () => {
    const result = svc.formatInteger(1234);
    expect(result).not.toContain('.');
    expect(result).not.toContain(',0');
  });

  it('formatPercent() formats as percentage', () => {
    const result = svc.formatPercent(75);
    expect(result).toContain('%');
  });

  // ─── Currency Formatting ─────────────────────────────────────────────────

  it('formatCurrency() formats with currency symbol', () => {
    const result = svc.formatCurrency(1234.56, 'USD');
    expect(result.formatted).toContain('$');
    expect(result.currency).toBe('USD');
  });

  it('formatCurrency() returns a FormattedCurrency object', () => {
    const result = svc.formatCurrency(99.99, 'EUR', { locale: 'de-DE' });
    expect(result.raw).toBe(99.99);
    expect(result.formatted).toBeTruthy();
  });

  // ─── Relative Time ────────────────────────────────────────────────────────

  it('formatRelativeTime() formats a relative time', () => {
    const result = svc.formatRelativeTime({ value: -1, unit: 'day' });
    expect(result.formatted).toBeTruthy();
    expect(result.unit).toBe('day');
  });

  it('formatRelativeDate() computes the best unit', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const result    = svc.formatRelativeDate(yesterday);
    expect(result.formatted).toBeTruthy();
  });

  // ─── Plural Rules ─────────────────────────────────────────────────────────

  it('plural() returns "one" for count=1 in English', () => {
    expect(svc.plural(1, 'en-US')).toBe('one');
  });

  it('plural() returns "other" for count=5 in English', () => {
    expect(svc.plural(5, 'en-US')).toBe('other');
  });

  // ─── RTL Detection ───────────────────────────────────────────────────────

  it('isRtl() returns true for Arabic locale', () => {
    expect(svc.isRtl('ar-SA')).toBeTrue();
  });

  it('isRtl() returns false for English locale', () => {
    expect(svc.isRtl('en-US')).toBeFalse();
  });

  // ─── Locale Detection ────────────────────────────────────────────────────

  it('detectLocale() returns a non-empty string', () => {
    expect(svc.detectLocale()).toBeTruthy();
  });

  // ─── Locale Switching ────────────────────────────────────────────────────

  it('setLocale() emits a locale:changed event', () => {
    let received = false;
    const sub    = svc.events$.subscribe(e => {
      if (e.type === 'locale:changed') received = true;
    });
    svc.setLocale('de-DE');
    sub.unsubscribe();
    expect(received).toBeTrue();
  });
});
