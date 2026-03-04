'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { IChartDataPoint } from '@/hooks/useMonitorFilter'

interface IPriceChartProps {
  data: IChartDataPoint[]
  targetPrice?: number | null
  alertMinPrice?: number | null
  alertMaxPrice?: number | null
  onPointClick?: (date: string | null) => void
}

const LABEL_MAP: Record<string, string> = {
  minPrice: '최저가',
  avgPrice: '평균가',
}

function formatYAxis(value: number): string {
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`
  return value.toLocaleString()
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {LABEL_MAP[entry.name] ?? entry.name}: {entry.value.toLocaleString()}원
        </p>
      ))}
    </div>
  )
}

export function PriceChart({ data, targetPrice, alertMinPrice, alertMaxPrice, onPointClick }: IPriceChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">30일 이내 수집된 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        onClick={(payload) => onPointClick?.(payload?.activeLabel != null ? String(payload.activeLabel) : null)}
        style={{ cursor: onPointClick ? 'pointer' : 'default' }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => (value === 'minPrice' ? '최저가' : '평균가')}
        />
        <Line
          type="monotone"
          dataKey="minPrice"
          name="minPrice"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3, fill: '#3b82f6' }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="avgPrice"
          name="avgPrice"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
        {targetPrice != null && (
          <ReferenceLine
            y={targetPrice}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: '적정가', position: 'insideTopRight', fontSize: 11, fill: '#ef4444' }}
          />
        )}
        {/* 알림가 범위 — 두 값 모두 있으면 영역, 하나만 있으면 선 */}
        {alertMinPrice != null && alertMaxPrice != null && (
          <ReferenceArea
            y1={alertMinPrice}
            y2={alertMaxPrice}
            fill="#f59e0b"
            fillOpacity={0.12}
            strokeOpacity={0}
          />
        )}
        {alertMinPrice != null && (
          <ReferenceLine
            y={alertMinPrice}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: '알림 최소', position: 'insideBottomRight', fontSize: 10, fill: '#f59e0b' }}
          />
        )}
        {alertMaxPrice != null && (
          <ReferenceLine
            y={alertMaxPrice}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: '알림 최대', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
