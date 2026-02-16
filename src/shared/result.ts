/**
 * Unified result type for service functions.
 * All backend service calls should return Result<T>.
 */
export type Result<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; data?: undefined; message: string };

/**
 * Helper to create a success result.
 */
export function ok<T>(data: T, message?: string): Result<T> {
  return { ok: true, data, message };
}

/**
 * Helper to create an error result.
 */
export function err<T = never>(message: string): Result<T> {
  return { ok: false, message };
}
