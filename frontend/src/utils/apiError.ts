import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const NETWORK_UNAVAILABLE_MESSAGE = 'Unable to reach the server. Check that the backend is running.';

/** Extracts a user-facing message from an RTK Query / fetchBaseQuery error.
 *
 * @param error - Unknown mutation/query error value.
 * @param fallback - Message when no readable message can be parsed.
 * @returns Human-readable error string.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  if (isFetchBaseQueryError(error)) {
    // Backend down / CORS / offline — status is FETCH_ERROR, not an HTTP code.
    if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') {
      return NETWORK_UNAVAILABLE_MESSAGE;
    }

    const fromData = messageFromData(error.data);
    if (fromData) return fromData;

    if ('error' in error && typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
  }

  if (isSerializedError(error) && error.message?.trim()) {
    // Browsers often throw TypeError: Failed to fetch when the API is unreachable.
    if (isFailedFetchMessage(error.message)) {
      return NETWORK_UNAVAILABLE_MESSAGE;
    }
    return error.message;
  }

  return fallback;
}

function isFailedFetchMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('failed to fetch') || lower.includes('networkerror');
}

function isFetchBaseQueryError(error: object): error is FetchBaseQueryError {
  return 'status' in error;
}

function isSerializedError(error: object): error is SerializedError {
  return 'message' in error || 'name' in error || 'code' in error || 'stack' in error;
}

/** Reads FastAPI-style `detail` or a plain string body from response data.
 *
 * @param data - Unknown response data.
 * @returns Human-readable error string or null.
 */
function messageFromData(data: unknown): string | null {
  if (data == null) return null;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed || null;
  }

  if (typeof data !== 'object' || !('detail' in data)) return null;

  const detail = (data as { detail: unknown }).detail;
  if (detail == null) return null;

  if (typeof detail === 'string') {
    const trimmed = detail.trim();
    return trimmed || null;
  }

  // FastAPI validation errors: [{ loc, msg, type }, ...]
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === 'object' && first !== null && 'msg' in first) {
      return String((first as { msg: unknown }).msg);
    }
    return String(first);
  }

  return String(detail);
}
