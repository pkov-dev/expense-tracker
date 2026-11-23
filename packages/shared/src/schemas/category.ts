import { z } from 'zod';

/** HEX color, "#rrggbb" (normalized to lowercase). */
export const categoryColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a HEX value like #1a2b3c')
  .transform((value) => value.toLowerCase());

/**
 * Icons a category may use (kebab-case lucide names). The single source of truth: the API validates
 * against it and the web app maps every name to a component (`Record<CategoryIconName, …>`).
 */
export const CATEGORY_ICON_NAMES = [
  'shopping-cart',
  'utensils',
  'coffee',
  'car',
  'fuel',
  'house',
  'heart-pulse',
  'graduation-cap',
  'plane',
  'gift',
  'shirt',
  'gamepad-2',
  'film',
  'smartphone',
  'wifi',
  'briefcase',
  'wallet',
  'tag',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

export const categoryIconSchema = z.enum(CATEGORY_ICON_NAMES);

export function isCategoryIconName(value: unknown): value is CategoryIconName {
  return categoryIconSchema.safeParse(value).success;
}

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: categoryColorSchema.optional(),
  icon: categoryIconSchema.nullable().optional(),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}
