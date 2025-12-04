import NodeCache from "node-cache"
import { config } from "../config"

const cache = new NodeCache({ stdTTL: config.cacheTtlSeconds, useClones: false })

export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key)
}

export function setCached<T>(key: string, value: T, ttlSeconds?: number) {
  if (typeof ttlSeconds === "number") {
    cache.set(key, value, ttlSeconds)
  } else {
    cache.set(key, value)
  }
}

export function invalidate(keys: string | string[]) {
  cache.del(keys)
}

export function flushCache() {
  cache.flushAll()
}

