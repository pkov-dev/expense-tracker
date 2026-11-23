import type { ComponentProps } from 'react';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../config/icons';

/** Unknown / missing icon names fall back to a generic tag. */
export function CategoryIcon({ name, ...props }: { name: string | null } & Omit<ComponentProps<'svg'>, 'name'>) {
  const Icon = (name && CATEGORY_ICONS[name]) || CATEGORY_ICONS[DEFAULT_CATEGORY_ICON];
  return Icon ? <Icon aria-hidden {...props} /> : null;
}
