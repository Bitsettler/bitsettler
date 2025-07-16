/**
 * case-utils.ts
 * --------------
 * Helper functions for converting object keys between snake_case and camelCase.
 * We keep the on-disk JSON dumps exactly as exported from SpacetimeDB (snake_case),
 * but consumers can import the data and immediately run `camelCaseDeep` to get
 * objects whose keys match the generated TypeScript bindings (camelCase).
 */

/** Convert a single snake_case (or kebab-case) string to camelCase */
function toCamel(key: string): string {
  return key.replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
}

/**
 * Recursively convert all object keys to camelCase.
 * Arrays are traversed; primitives returned as-is.
 */
export function camelCaseDeep<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((v) => camelCaseDeep(v)) as unknown as T
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toCamel(k)] = camelCaseDeep(v)
    }
    return out as unknown as T
  }

  return value as T
}
