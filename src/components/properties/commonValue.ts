/** Undefined is an explicit mixed value, never the first item's value. */
export function commonValue<T>(values: T[]): T | undefined {
  return values.length && values.every((v) => v === values[0]) ? values[0] : undefined;
}
