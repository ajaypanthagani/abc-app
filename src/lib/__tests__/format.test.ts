import { describe, expect, it } from 'vitest';
import { compactNumber, formatNumber, monthLabel, percent, rupees, rupeesCompact } from '../format';

describe('formatNumber', () => {
  it('uses en-IN lakh grouping', () => {
    expect(formatNumber(120000)).toBe('1,20,000');
    expect(formatNumber(72341)).toBe('72,341');
  });
  it('renders em dash for missing values', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
  });
});

describe('compactNumber', () => {
  it('compacts with Indian units', () => {
    expect(compactNumber(950)).toBe('950');
    expect(compactNumber(74865)).toBe('74.9K');
    expect(compactNumber(1_420_000)).toBe('14.2L');
    expect(compactNumber(12_000_000)).toBe('1.2Cr');
  });
});

describe('dashboard money formatting', () => {
  it('formats paise as rupees with lakh grouping', () => {
    expect(rupees(48620000)).toBe('₹4,86,200');
    expect(rupees(null)).toBe('—');
    expect(rupeesCompact(9600000)).toBe('₹96K');
    expect(rupeesCompact(48620000)).toBe('₹4.9L');
  });
  it('labels months and percentages', () => {
    expect(monthLabel('2026-08')).toBe('Aug');
    expect(percent(0.0412)).toBe('4.1%');
  });
});
