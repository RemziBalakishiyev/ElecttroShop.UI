/** Unwrap `{ value: T }` API envelopes or return data as-is. */
export function unwrapApiData<T>(response: unknown): T {
  if (response === null || response === undefined) {
    return response as T;
  }
  if (typeof response === "object" && "value" in response) {
    const value = (response as { value: unknown }).value;
    if (value !== null && value !== undefined) {
      return value as T;
    }
  }
  return response as T;
}
