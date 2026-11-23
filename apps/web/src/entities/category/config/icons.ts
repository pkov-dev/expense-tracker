import type { CategoryIconName } from '@expense-tracker/shared';
import {
  Briefcase,
  Car,
  Coffee,
  Film,
  Fuel,
  Gamepad2,
  GraduationCap,
  Gift,
  HeartPulse,
  House,
  type LucideIcon,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  Utensils,
  Wallet,
  Wifi,
} from 'lucide-react';

/**
 * Icon names stored in `Category.icon` → component. Typed against the shared name list, so adding an
 * icon to `CATEGORY_ICON_NAMES` without a component here is a compile error.
 */
export const CATEGORY_ICONS: Record<CategoryIconName, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  coffee: Coffee,
  car: Car,
  fuel: Fuel,
  house: House,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  plane: Plane,
  gift: Gift,
  shirt: Shirt,
  'gamepad-2': Gamepad2,
  film: Film,
  smartphone: Smartphone,
  wifi: Wifi,
  briefcase: Briefcase,
  wallet: Wallet,
  tag: Tag,
};

export const DEFAULT_CATEGORY_ICON: CategoryIconName = 'tag';
