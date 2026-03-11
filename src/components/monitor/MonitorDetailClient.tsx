'use client'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, RefreshCw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { deleteMonitor, crawlMonitorAction } from '@/actions/monitors'
import { PriceChart } from './PriceChart'
import { HotDealList } from './HotDealList'
import { SnapshotList } from './SnapshotList'
import { FilterBar } from './FilterBar'
import { PriceRangeFilter } from './PriceRangeFilter'
import { ExcludedKeywordInput } from './ExcludedKeywordInput'
import { ManualEntryDialog } from './ManualEntryDialog'
import { MonitorPriceSettings } from './MonitorPriceSettings'
import { updateMonitor } from '@/actions/monitors'
import { useMonitorFilter } from '@/hooks/useMonitorFilter'
import type { ChartRange } from '@/hooks/useMonitorFilter'
import type { IMonitor, ISnapshot } from '@/types/database.types'

const CHART_RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: 7,  label: '1주' },
  { value: 21, label: '3주' },
  { value: 30, label: '1달' },
  { value: 60, label: '2달' },
  { value: 90, label: '3달' },
]

interface IMonitorDetailClientProps {
  monitor: IMonitor
  initialSnapshots: ISnapshot[]
}

export function MonitorDetailClient({ monitor, initialSnapshots }: IMonitorDetailClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [isPendingCrawl, startCrawl] = useTransition()
  const [isPendingAlert, startAlert] = useTransition()
  const [isPendingDelete, startDelete] = useTransition()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    filtered,
    validSnapshots,
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
    monitor.alert_min_price ?? null,
    monitor.alert_price ?? null,
  )

  const notifiedSnapshots = useMemo(
    () => initialSnapshots
      .filter((s) => s.notified_at != null)
      .sort((a, b) => new Date(b.notified_at!).getTime() - new Date(a.notified_at!).getTime()),
    [initialSnapshots],
  )

  const selectedDaySnapshots = useMemo(() => {
    if (!selectedDate) return []
    const alertMinPrice = monitor.alert_min_price
    const alertMaxPrice = monitor.alert_price
    return validSnapshots.filter((s) => {
      const d = new Date(s.posted_at)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const matchDate = `${mm}/${dd}` === selectedDate
      const aboveAlertMin = alertMinPrice == null || s.price >= alertMinPrice
      const belowAlertMax = alertMaxPrice == null || s.price <= alertMaxPrice
      return matchDate && aboveAlertMin && belowAlertMax
    })
  }, [selectedDate, validSnapshots, monitor.alert_min_price, monitor.alert_price])

  const handleChartClick = useCallback((date: string | null) => {
    setSelectedDate((prev) => (prev === date ? null : date))
  }, [])

  const handleCrawlingToggle = useCallback((checked: boolean) => {
    startCrawl(async () => {
      await updateMonitor(monitor.id, { is_crawling_enabled: checked })
      router.refresh()
    })
  }, [monitor.id, router])

  const handleAlertToggle = useCallback((checked: boolean) => {
    startAlert(async () => {
      await updateMonitor(monitor.id, { is_alert_enabled: checked })
      router.refresh()
    })
  }, [monitor.id, router])

  const handleBack = useCallback(() => {
    router.push('/')
  }, [router])

  const handleDelete = useCallback(() => {
    startDelete(async () => {
      await deleteMonitor(monitor.id)
      router.push('/')
    })
  }, [monitor.id, router])

  const handleRefresh = useCallback(() => {
    startRefresh(async () => {
      try {
        const { bunjangCount, joonggnaraCount } = await crawlMonitorAction(monitor.id)
        const total = bunjangCount + joonggnaraCount
        toast.success(`수집 완료 — 총 ${total}건 (번개장터 ${bunjangCount} / 중고나라 ${joonggnaraCount})`)
        router.refresh()
      } catch {
        toast.error('수집 중 오류가 발생했습니다.')
      }
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
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5" title="자동 크롤링">
            <span className="text-xs text-muted-foreground hidden sm:inline">크롤링</span>
            <Switch
              checked={monitor.is_crawling_enabled}
              onCheckedChange={handleCrawlingToggle}
              disabled={isPendingCrawl}
              aria-label="자동 크롤링 활성화"
            />
          </div>
          <div className="flex items-center gap-1.5" title="알림">
            <span className="text-xs text-muted-foreground hidden sm:inline">알림</span>
            <Switch
              checked={monitor.is_alert_enabled}
              onCheckedChange={handleAlertToggle}
              disabled={isPendingAlert}
              aria-label="알림 활성화"
            />
          </div>
          <ManualEntryDialog monitorId={monitor.id} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="수동 수집"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="ml-1.5 hidden sm:inline">수집</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPendingDelete}
            aria-label="검색어 삭제"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
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
          onPointClick={handleChartClick}
        />
      </section>

      {/* ── 선택 날짜 매물 ── */}
      {selectedDate && selectedDaySnapshots.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-medium">{selectedDate} 매물</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setSelectedDate(null)}
              aria-label="날짜 선택 해제"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <SnapshotList
            snapshots={selectedDaySnapshots}
            targetPrice={monitor.target_price}
            alertMinPrice={monitor.alert_min_price}
            alertMaxPrice={monitor.alert_price}
          />
        </section>
      )}

      {/* ── 핫딜 ── */}
      {hotDeals.length > 0 && (
        <section>
          <HotDealList deals={hotDeals} />
        </section>
      )}

      {/* ── 알림 발송 이력 ── */}
      {notifiedSnapshots.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            알림 발송 이력 ({notifiedSnapshots.length}건)
          </h2>
          <div className="rounded-lg border divide-y text-sm">
            {notifiedSnapshots.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 gap-3">
                <div className="min-w-0">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {s.title}
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    발송: {new Date(s.notified_at!).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="font-semibold tabular-nums shrink-0">
                  {s.price.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
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
          targetPrice={monitor.target_price}
          alertMinPrice={monitor.alert_min_price}
          alertMaxPrice={monitor.alert_price}
        />
      </section>

      {/* ── 삭제 확인 다이얼로그 ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>검색어 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{monitor.keyword}</span> 검색어와 수집된 모든 데이터가 삭제됩니다. 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPendingDelete}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPendingDelete}
            >
              {isPendingDelete ? '삭제 중…' : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
