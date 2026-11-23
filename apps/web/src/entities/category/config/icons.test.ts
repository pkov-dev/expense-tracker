import { CATEGORY_ICON_NAMES } from '@expense-tracker/shared';
import { describe, expect, it } from 'vitest';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from './icons';

describe('CATEGORY_ICONS', () => {
  it.each(CATEGORY_ICON_NAMES)('has a component for %s', (name) => {
    expect(['function', 'object']).toContain(typeof CATEGORY_ICONS[name]);
    expect(CATEGORY_ICONS[name]).toBeTruthy();
  });

  it('has nothing but the shared names', () => {
    expect(Object.keys(CATEGORY_ICONS).sort()).toEqual([...CATEGORY_ICON_NAMES].sort());
  });

  it('defaults to an icon that exists', () => {
    expect(CATEGORY_ICONS[DEFAULT_CATEGORY_ICON]).toBeTruthy();
  });
});
