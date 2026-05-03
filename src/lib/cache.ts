const TTL_MS = 5 * 60 * 1000 // 5 minutes

interface Entry {
  value: unknown
  expiresAt: number
}

const store = new Map<string, Entry>()

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T): void {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

export function cacheInvalidate(key: string): void {
  store.delete(key)
}
