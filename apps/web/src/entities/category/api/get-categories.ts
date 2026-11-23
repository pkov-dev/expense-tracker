import 'server-only';

import type { CategoryDto } from '@expense-tracker/shared';
import { cache } from 'react';
import { authorizedRequest } from '@/shared/api/server';

export const getCategories = cache(() => authorizedRequest<CategoryDto[]>('/api/categories'));
