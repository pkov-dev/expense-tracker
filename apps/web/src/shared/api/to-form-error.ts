import { ApiError } from './client';
import type { FormState } from './form-state';

interface FormErrorMessages {
  /** Shown for every status that has no entry of its own. */
  fallback: string;
  byStatus?: Partial<Record<number, string>>;
}

/**
 * Turns an API failure into the `FormState` a Server Action returns. Anything that is not an `ApiError`
 * (e.g. the redirect Next throws on a dead session) must propagate, so it is rethrown.
 */
export function toFormError(
  error: unknown,
  { fallback, byStatus = {} }: FormErrorMessages,
): FormState {
  if (!(error instanceof ApiError)) throw error;
  return { error: byStatus[error.status] ?? fallback };
}
