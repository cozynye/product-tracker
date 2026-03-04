import type { ISnapshotInsert } from '@/types/database.types'

const CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3시간

export function isCacheValid(lastCrawledAt: string | null): boolean {
  if (!lastCrawledAt) return false
  return Date.now() - new Date(lastCrawledAt).getTime() < CACHE_TTL_MS
}

export function applyExcludedKeywords(
  snapshots: ISnapshotInsert[],
  excludedKeywords: string[],
): ISnapshotInsert[] {
  if (!excludedKeywords.length) return snapshots
  const lower = excludedKeywords.map((kw) => kw.toLowerCase())
  return snapshots.filter(
    (s) => !lower.some((kw) => s.title.toLowerCase().includes(kw)),
  )
}
