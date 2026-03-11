import { crawlBunjang } from './bunjang'
import { crawlJoonggonara } from './joonggonara'
import { isCacheValid, applyExcludedKeywords } from './utils'
import { upsertSnapshots, updateLastCrawledAt, deleteOldSnapshots } from '@/actions/snapshots'
import { checkAndSendAlerts } from '@/lib/notifications/alert'
import type { IMonitor, ISnapshotInsert } from '@/types/database.types'

export interface CrawlResult {
  cached: boolean
  bunjangCount: number
  joonggnaraCount: number
}

async function safeCrawl(fn: () => Promise<ISnapshotInsert[]>): Promise<ISnapshotInsert[]> {
  try {
    return await fn()
  } catch (e) {
    console.error('[crawl] error:', e instanceof Error ? e.message : e)
    return []
  }
}

export async function crawlMonitor(
  monitor: IMonitor,
  platform: 'bunjang' | 'joonggonara' | 'all' = 'all',
  force = false,
): Promise<CrawlResult> {
  if (!force && isCacheValid(monitor.last_crawled_at)) {
    return { cached: true, bunjangCount: 0, joonggnaraCount: 0 }
  }

  let bunjangRaw: ISnapshotInsert[] = []
  let joonggonaraRaw: ISnapshotInsert[] = []

  if (platform === 'bunjang' || platform === 'all') {
    bunjangRaw = await safeCrawl(() => crawlBunjang(monitor.keyword, monitor.id))
  }
  if (platform === 'joonggonara' || platform === 'all') {
    joonggonaraRaw = await safeCrawl(() => crawlJoonggonara(monitor.keyword, monitor.id))
  }

  const filtered = applyExcludedKeywords(
    [...bunjangRaw, ...joonggonaraRaw],
    monitor.excluded_keywords,
  )

  await upsertSnapshots(filtered)
  await checkAndSendAlerts(monitor)
  await deleteOldSnapshots(monitor.id)
  await updateLastCrawledAt(monitor.id)

  return {
    cached: false,
    bunjangCount: bunjangRaw.length,
    joonggnaraCount: joonggonaraRaw.length,
  }
}
