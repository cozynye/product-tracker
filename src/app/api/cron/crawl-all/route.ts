import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crawlMonitor } from '@/lib/crawler/crawl'
import { sendSlackError } from '@/lib/notifications/slack'
import type { IMonitor } from '@/types/database.types'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const force = new URL(request.url).searchParams.get('force') === 'true'

  const supabase = await createClient()
  const { data: monitors, error } = await supabase
    .from('user_monitors')
    .select('*')
    .eq('is_crawling_enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = { crawled: 0, skipped: 0, errors: 0 }

  const settled = await Promise.allSettled(
    (monitors ?? []).map((m) => crawlMonitor(m as IMonitor, 'all', force))
  )

  const slackErrors: Promise<void>[] = []
  settled.forEach((outcome, i) => {
    const monitor = (monitors ?? [])[i] as IMonitor
    if (outcome.status === 'fulfilled') {
      if (outcome.value.cached) {
        results.skipped++
      } else {
        results.crawled++
      }
    } else {
      const message = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)
      console.error(`[cron] monitor ${monitor.id} failed:`, message)
      slackErrors.push(sendSlackError(monitor.keyword, message))
      results.errors++
    }
  })

  await Promise.allSettled(slackErrors)

  return NextResponse.json({ success: true, ...results })
}
