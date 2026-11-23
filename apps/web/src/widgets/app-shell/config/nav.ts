import { LayoutList, Tags, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/shared/config';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Транзакции', href: ROUTES.transactions, icon: LayoutList },
  { title: 'Категории', href: ROUTES.categories, icon: Tags },
];
