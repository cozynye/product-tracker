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

export type ChartRange = 1 | 7 | 30

export interface IUseMonitorFilterReturn {
  filtered: ISnapshot[]
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
): IUseMonitorFilterReturn {
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [chartRange, setChartRange] = useState<ChartRange>(30)
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

  // 판매중 전체 평균가 (제외 키워드 적용 후)
  const currentAvgPrice = useMemo(() => {
    const forSale = validSnapshots.filter((s) => s.status === '판매중')
    if (!forSale.length) return null
    return Math.round(forSale.reduce((sum, s) => sum + s.price, 0) / forSale.length)
  }, [validSnapshots])

  const hotDeals = useMemo<ISnapshot[]>(() => {
    if (targetPrice === null) return []
    return validSnapshots.filter(
      (s) => s.status === '판매중' && s.price <= targetPrice,
    )
  }, [validSnapshots, targetPrice])

  const chartData = useMemo<IChartDataPoint[]>(() => {
    const cutoff = Date.now() - chartRange * 24 * 60 * 60 * 1000
    const recent = validSnapshots.filter(
      (s) => new Date(s.posted_at).getTime() >= cutoff,
    )

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
  }, [validSnapshots, chartRange])

  const filtered = useMemo<ISnapshot[]>(() => {
    return validSnapshots.filter((s) => {
      const matchPlatform = platform === 'all' || s.platform === platform
      const matchStatus = status === 'all' || s.status === status
      const matchMin = minPrice == null || s.price >= minPrice
      const matchMax = maxPrice == null || s.price <= maxPrice
      return matchPlatform && matchStatus && matchMin && matchMax
    })
  }, [validSnapshots, platform, status, minPrice, maxPrice])

  return {
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
  }
}
