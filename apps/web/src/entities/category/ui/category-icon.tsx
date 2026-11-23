import { isCategoryIconName } from '@expense-tracker/shared';
import type { ComponentProps } from 'react';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../config/icons';

/**
 * Unknown / missing icon names fall back to a generic tag. The name comes from the database, so it is
 * checked against the known list first — a plain `CATEGORY_ICONS[name]` would resolve prototype keys
 * such as "constructor" to a non-component and crash the render.
 */
export function CategoryIcon({ name, ...props }: { name: string | null } & Omit<ComponentProps<'svg'>, 'name'>) {
  const Icon = CATEGORY_ICONS[isCategoryIconName(name) ? name : DEFAULT_CATEGORY_ICON];
  return <Icon aria-hidden {...props} />;
}
