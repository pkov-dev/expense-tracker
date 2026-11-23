import { describe, expect, it } from 'vitest';
import {
  CATEGORY_ICON_NAMES,
  categoryColorSchema,
  createCategorySchema,
  isCategoryIconName,
  updateCategorySchema,
} from './category';

describe('category icons', () => {
  it.each(CATEGORY_ICON_NAMES)('accepts the known icon %s', (icon) => {
    expect(createCategorySchema.safeParse({ name: 'Food', icon }).success).toBe(true);
    expect(isCategoryIconName(icon)).toBe(true);
  });

  // These resolve to members of Object.prototype when used as an object key.
  it.each([
    'constructor',
    '__proto__',
    'toString',
    'hasOwnProperty',
    'valueOf',
    'unknown-icon',
    'Tag',
    ' tag',
    '',
  ])('rejects %j', (icon) => {
    expect(createCategorySchema.safeParse({ name: 'Food', icon }).success).toBe(false);
    expect(isCategoryIconName(icon)).toBe(false);
  });

  it('allows no icon at all or an explicit null', () => {
    expect(createCategorySchema.safeParse({ name: 'Food' }).success).toBe(true);
    expect(createCategorySchema.safeParse({ name: 'Food', icon: null }).success).toBe(true);
  });

  it('is a type guard that tolerates non-strings', () => {
    expect(isCategoryIconName(null)).toBe(false);
    expect(isCategoryIconName(undefined)).toBe(false);
    expect(isCategoryIconName(42)).toBe(false);
  });
});

describe('category color', () => {
  it('normalizes HEX to lower case', () => {
    expect(categoryColorSchema.parse('#A1B2C3')).toBe('#a1b2c3');
  });

  it.each(['a1b2c3', '#abc', '#12345g', 'red', ''])('rejects %j', (color) => {
    expect(categoryColorSchema.safeParse(color).success).toBe(false);
  });
});

describe('updateCategorySchema', () => {
  it('needs at least one field', () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
    expect(updateCategorySchema.safeParse({ name: 'Rent' }).success).toBe(true);
  });
});
