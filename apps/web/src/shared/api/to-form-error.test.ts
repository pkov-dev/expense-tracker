import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { toFormError } from './to-form-error';

const messages = { fallback: 'generic', byStatus: { 404: 'gone', 409: 'duplicate' } };

describe('toFormError', () => {
  it('uses the message of the status', () => {
    expect(toFormError(new ApiError(404, 'x'), messages)).toEqual({ error: 'gone' });
    expect(toFormError(new ApiError(409, 'x'), messages)).toEqual({ error: 'duplicate' });
  });

  it('falls back for other statuses, including network failures', () => {
    expect(toFormError(new ApiError(500, 'x'), messages)).toEqual({ error: 'generic' });
    expect(toFormError(new ApiError(503, 'x'), messages)).toEqual({ error: 'generic' });
    expect(toFormError(new ApiError(400, 'x'), { fallback: 'generic' })).toEqual({
      error: 'generic',
    });
  });

  // Next implements `redirect()` by throwing; swallowing it would leave a dead session on a page.
  it('rethrows anything that is not an ApiError', () => {
    const redirect = new Error('NEXT_REDIRECT');
    expect(() => toFormError(redirect, messages)).toThrow(redirect);
    expect(() => toFormError('string', messages)).toThrow();
  });
});
