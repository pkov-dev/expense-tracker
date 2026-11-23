import { LayoutList, Tags, type LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Транзакции', href: '/', icon: LayoutList },
  { title: 'Категории', href: '/categories', icon: Tags },
];
