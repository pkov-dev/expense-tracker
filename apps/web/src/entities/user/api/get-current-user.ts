import 'server-only';

import type { UserDto } from '@expense-tracker/shared';
import { cache } from 'react';
import { authorizedRequest } from '@/shared/api';

/** Deduplicated per request: the layout and pages can both call it for free. */
export const getCurrentUser = cache(() => authorizedRequest<UserDto>('/api/auth/me'));
