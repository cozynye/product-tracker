import { crawlBunjang } from './bunjang'
import { crawlJoonggonara } from './joonggonara'
import { isCacheValid, applyExcludedKeywords } from './utils'
import { upsertSnapshots, updateLastCrawledAt, deleteOldSnapshots } from '@/actions/snapshots'
import { checkAndSendAlerts } from '@/lib/notifications/alert'
import { sendSlackError } from '@/lib/notifications/slack'
import type { IMonitor, ISnapshotInsert } from '@/types/database.types'

export interface CrawlResult {
  cached: boolean
  bunjangCount: number
  joonggnaraCount: number
}

interface SafeCrawlResult {
  items: ISnapshotInsert[]
  error?: string
}

async function safeCrawl(fn: () => Promise<ISnapshotInsert[]>): Promise<SafeCrawlResult> {
  try {
    return { items: await fn() }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.error('[crawl] error:', error)
    return { items: [], error }
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

  const bunjangResult: SafeCrawlResult = { items: [] }
  const joonggonaraResult: SafeCrawlResult = { items: [] }

  const crawlTasks: Promise<void>[] = []

  if (platform === 'bunjang' || platform === 'all') {
    crawlTasks.push(
      safeCrawl(() => crawlBunjang(monitor.keyword, monitor.id)).then((r) => {
        Object.assign(bunjangResult, r)
      })
    )
  }
  if (platform === 'joonggonara' || platform === 'all') {
    crawlTasks.push(
      safeCrawl(() => crawlJoonggonara(monitor.keyword, monitor.id)).then((r) => {
        Object.assign(joonggonaraResult, r)
      })
    )
  }

  await Promise.all(crawlTasks)

  const slackAlerts: Promise<void>[] = []
  if (bunjangResult.error) {
    slackAlerts.push(sendSlackError(`번개장터 (${monitor.keyword})`, bunjangResult.error))
  }
  if (joonggonaraResult.error) {
    slackAlerts.push(sendSlackError(`중고나라 (${monitor.keyword})`, joonggonaraResult.error))
  }
  if (slackAlerts.length) await Promise.allSettled(slackAlerts)

  const filtered = applyExcludedKeywords(
    [...bunjangResult.items, ...joonggonaraResult.items],
    monitor.excluded_keywords,
  )

  await upsertSnapshots(filtered)
  await checkAndSendAlerts(monitor)
  await deleteOldSnapshots(monitor.id)
  await updateLastCrawledAt(monitor.id)

  return {
    cached: false,
    bunjangCount: bunjangResult.items.length,
    joonggnaraCount: joonggonaraResult.items.length,
  }
}
