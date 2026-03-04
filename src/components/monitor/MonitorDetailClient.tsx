'use client'
import { useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriceChart } from './PriceChart'
import { HotDealList } from './HotDealList'
import { SnapshotList } from './SnapshotList'
import { FilterBar } from './FilterBar'
import { PriceRangeFilter } from './PriceRangeFilter'
import { ExcludedKeywordInput } from './ExcludedKeywordInput'
import { ManualEntryDialog } from './ManualEntryDialog'
import { MonitorPriceSettings } from './MonitorPriceSettings'
import { useMonitorFilter } from '@/hooks/useMonitorFilter'
import type { ChartRange } from '@/hooks/useMonitorFilter'
import type { IMonitor, ISnapshot } from '@/types/database.types'

const CHART_RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: 1, label: '1일' },
  { value: 7, label: '1주' },
  { value: 30, label: '1달' },
]

interface IMonitorDetailClientProps {
  monitor: IMonitor
  initialSnapshots: ISnapshot[]
}

export function MonitorDetailClient({ monitor, initialSnapshots }: IMonitorDetailClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  const {
    filtered,
    hotDeals,
    chartData,
    currentAvgPrice,
    chartRange,
    setChartRange,
    platform,
    setPlatform,
    status,
    setStatus,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
  } = useMonitorFilter(
    initialSnapshots,
    monitor.target_price,
    monitor.excluded_keywords,
    monitor.min_price,
    monitor.max_price,
  )

  const handleBack = useCallback(() => {
    router.push('/')
  }, [router])

  const handleRefresh = useCallback(() => {
    startRefresh(async () => {
      await Promise.all([
        fetch(`/api/crawl/bunjang`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monitorId: monitor.id, force: true }),
        }),
        fetch(`/api/crawl/joonggonara`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monitorId: monitor.id, force: true }),
        }),
      ])
      router.refresh()
    })
  }, [monitor.id, router])

  return (
    <div className="space-y-5">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="뒤로가기">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold truncate">{monitor.keyword}</h1>
          <Badge variant="secondary" className="shrink-0">{monitor.category}</Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ManualEntryDialog monitorId={monitor.id} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="강제 새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="ml-1.5 hidden sm:inline">새로고침</span>
          </Button>
        </div>
      </div>

      {/* ── 현재 평균가 ── */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground mb-0.5">현재 평균가 (판매중 기준)</p>
        {currentAvgPrice != null ? (
          <p className="text-2xl font-bold tabular-nums">
            {currentAvgPrice.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">원</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">수집된 판매중 데이터 없음</p>
        )}
      </div>

      {/* ── 적정가 / 알림가 설정 ── */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground mb-2">가격 설정</h2>
        <MonitorPriceSettings
          monitorId={monitor.id}
          targetPrice={monitor.target_price}
          alertMinPrice={monitor.alert_min_price}
          alertPrice={monitor.alert_price}
        />
      </section>

      {/* ── 제외 키워드 ── */}
      <section>
        <ExcludedKeywordInput
          monitorId={monitor.id}
          keywords={monitor.excluded_keywords}
        />
      </section>

      {/* ── 가격 추이 차트 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">가격 추이</h2>
          <div className="flex gap-1">
            {CHART_RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={chartRange === opt.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setChartRange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <PriceChart
          data={chartData}
          targetPrice={monitor.target_price}
          alertMinPrice={monitor.alert_min_price}
          alertMaxPrice={monitor.alert_price}
        />
      </section>

      {/* ── 핫딜 ── */}
      {hotDeals.length > 0 && (
        <section>
          <HotDealList deals={hotDeals} />
        </section>
      )}

      {/* ── 필터 + 전체 리스트 ── */}
      <section className="space-y-3">
        <FilterBar
          platform={platform}
          onPlatformChange={setPlatform}
          status={status}
          onStatusChange={setStatus}
        />
        <PriceRangeFilter
          monitorId={monitor.id}
          savedMin={monitor.min_price}
          savedMax={monitor.max_price}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
        />
        <SnapshotList
          snapshots={filtered}
          alertMinPrice={monitor.alert_min_price}
          alertMaxPrice={monitor.alert_price}
        />
      </section>
    </div>
  )
}
