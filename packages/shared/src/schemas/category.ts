import { z } from 'zod';

/** HEX color, "#rrggbb" (normalized to lowercase). */
export const categoryColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a HEX value like #1a2b3c')
  .transform((value) => value.toLowerCase());

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: categoryColorSchema.optional(),
  /** Icon name, e.g. a lucide icon like "shopping-cart". */
  icon: z.string().trim().min(1).max(50).nullable().optional(),
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
