import { getApiErrorMessage } from '@/utils/apiError';
import type { CoverProvider } from './constants';

// Builds a short lookup error from an RTK / HTTP failure.
export function coverFetchErrorMessage(err: unknown, provider: CoverProvider): string {
  const status: number | string | null =
    err && typeof err === 'object' && 'status' in err
      ? ((err as { status: number | string }).status ?? null)
      : null;

  if (status === 404) {
    return provider === 'IGDB' ? 'No IGDB game found' : `No ${provider} cover found`;
  }
  if (status === 400) {
    return provider === 'Open Library'
      ? `${provider} rejected the request`
      : `${provider} is not configured`;
  }
  if (status === 502) return `${provider} unavailable`;

  const detail = getApiErrorMessage(err, '');
  if (detail && detail.length <= 80) return detail;

  return `${provider} cover fetch failed`;
}
