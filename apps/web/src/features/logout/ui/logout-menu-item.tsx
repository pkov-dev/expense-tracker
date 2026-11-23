import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '@/shared/ui/dropdown-menu';
import { logoutAction } from '../api/logout.action';

/** Server-rendered `<form action>`: works without client JS state. */
export function LogoutMenuItem() {
  return (
    <form action={logoutAction}>
      <DropdownMenuItem asChild>
        <button type="submit" className="w-full cursor-pointer">
          <LogOut />
          Выйти
        </button>
      </DropdownMenuItem>
    </form>
  );
}
