import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCacheValid } from '@/lib/crawler/utils'
import { crawlMonitor } from '@/lib/crawler/crawl'
import { getSnapshots } from '@/actions/snapshots'
import { MonitorDetailClient } from '@/components/monitor/MonitorDetailClient'
import type { IMonitor } from '@/types/database.types'

interface MonitorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MonitorDetailPage({ params }: MonitorDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_monitors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const monitor = data as IMonitor

  if (!isCacheValid(monitor.last_crawled_at)) {
    try {
      await crawlMonitor(monitor, 'all', false)
    } catch {
      // 크롤링 실패해도 기존 데이터로 계속 진행
    }
  }

  const snapshots = await getSnapshots(id)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <MonitorDetailClient monitor={monitor} initialSnapshots={snapshots} />
    </div>
  )
}
