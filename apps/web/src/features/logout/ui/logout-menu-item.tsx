'use client';

import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { DropdownMenuItem } from '@/shared/ui/dropdown-menu';
import { logoutAction } from '../api/logout.action';

export function LogoutMenuItem() {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      disabled={isPending}
      onSelect={(event) => {
        // Keep the menu (and with it this item) mounted until the action has run; the action redirects.
        event.preventDefault();
        startTransition(async () => {
          await logoutAction();
        });
      }}
    >
      <LogOut />
      {isPending ? 'Выходим…' : 'Выйти'}
    </DropdownMenuItem>
  );
}
