import { useState, useMemo } from 'react'
import type { ISnapshot } from '@/types/database.types'

export type PlatformFilter = 'all' | 'bunjang' | 'joonggonara' | 'manual'
export type StatusFilter = 'all' | '판매중' | '예약중' | '거래완료'

export interface IChartDataPoint {
  date: string
  minPrice: number
  avgPrice: number
  count: number
}

export type ChartRange = 7 | 21 | 30 | 60 | 90

export interface IUseMonitorFilterReturn {
  filtered: ISnapshot[]
  validSnapshots: ISnapshot[]
  hotDeals: ISnapshot[]
  chartData: IChartDataPoint[]
  currentAvgPrice: number | null
  chartRange: ChartRange
  setChartRange: (value: ChartRange) => void
  platform: PlatformFilter
  setPlatform: (value: PlatformFilter) => void
  status: StatusFilter
  setStatus: (value: StatusFilter) => void
  minPrice: number | null
  maxPrice: number | null
  setMinPrice: (value: number | null) => void
  setMaxPrice: (value: number | null) => void
}

function formatMMDD(dateStr: string): string {
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

export function useMonitorFilter(
  snapshots: ISnapshot[],
  targetPrice: number | null,
  excludedKeywords: string[] = [],
  initialMinPrice: number | null = null,
  initialMaxPrice: number | null = null,
  alertMinPrice: number | null = null,
  alertMaxPrice: number | null = null,
): IUseMonitorFilterReturn {
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [chartRange, setChartRange] = useState<ChartRange>(30) // 디폴트: 1달
  const [minPrice, setMinPrice] = useState<number | null>(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState<number | null>(initialMaxPrice)

  // 제외 키워드가 제목에 포함된 스냅샷을 먼저 걸러냄
  const validSnapshots = useMemo(() => {
    if (!excludedKeywords.length) return snapshots
    return snapshots.filter((s) => {
      const lower = s.title.toLowerCase()
      return !excludedKeywords.some((kw) => lower.includes(kw.toLowerCase()))
    })
  }, [snapshots, excludedKeywords])

  // 판매중 평균가 (제외 키워드 + 알림가 범위 적용 후)
  const currentAvgPrice = useMemo(() => {
    const forSale = validSnapshots.filter((s) => {
      if (s.status !== '판매중') return false
      const aboveAlertMin = alertMinPrice == null || s.price >= alertMinPrice
      const belowAlertMax = alertMaxPrice == null || s.price <= alertMaxPrice
      return aboveAlertMin && belowAlertMax
    })
    if (!forSale.length) return null
    return Math.round(forSale.reduce((sum, s) => sum + s.price, 0) / forSale.length)
  }, [validSnapshots, alertMinPrice, alertMaxPrice])

  const hotDeals = useMemo<ISnapshot[]>(() => {
    if (targetPrice === null) return []
    return validSnapshots.filter((s) => {
      if (s.status !== '판매중' || s.price > targetPrice) return false
      const aboveAlertMin = alertMinPrice == null || s.price >= alertMinPrice
      const belowAlertMax = alertMaxPrice == null || s.price <= alertMaxPrice
      return aboveAlertMin && belowAlertMax
    })
  }, [validSnapshots, targetPrice, alertMinPrice, alertMaxPrice])

  const chartData = useMemo<IChartDataPoint[]>(() => {
    const cutoff = Date.now() - chartRange * 24 * 60 * 60 * 1000
    const recent = validSnapshots.filter((s) => {
      if (new Date(s.posted_at).getTime() < cutoff) return false
      const aboveAlertMin = alertMinPrice == null || s.price >= alertMinPrice
      const belowAlertMax = alertMaxPrice == null || s.price <= alertMaxPrice
      return aboveAlertMin && belowAlertMax
    })

    const grouped = recent.reduce<Record<string, number[]>>((acc, s) => {
      const key = formatMMDD(s.posted_at)
      if (!acc[key]) acc[key] = []
      acc[key].push(s.price)
      return acc
    }, {})

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, prices]) => ({
        date,
        minPrice: Math.min(...prices),
        avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
        count: prices.length,
      }))
  }, [validSnapshots, chartRange, alertMinPrice, alertMaxPrice])

  const filtered = useMemo<ISnapshot[]>(() => {
    return validSnapshots.filter((s) => {
      const matchPlatform = platform === 'all' || s.platform === platform
      const matchStatus = status === 'all' || s.status === status
      const matchMin = minPrice == null || s.price >= minPrice
      const matchMax = maxPrice == null || s.price <= maxPrice
      const aboveAlertMin = alertMinPrice == null || s.price >= alertMinPrice
      const belowAlertMax = alertMaxPrice == null || s.price <= alertMaxPrice
      return matchPlatform && matchStatus && matchMin && matchMax && aboveAlertMin && belowAlertMax
    })
  }, [validSnapshots, platform, status, minPrice, maxPrice, alertMinPrice, alertMaxPrice])

  return {
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
  }
}
