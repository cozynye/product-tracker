import { ExternalLink, PackageSearch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ISnapshot } from '@/types/database.types'

const PLATFORM_LABEL: Record<ISnapshot['platform'], string> = {
  bunjang: '번개장터',
  joonggonara: '중고나라',
  manual: '직접입력',
}

const STATUS_VARIANT: Record<
  ISnapshot['status'],
  { label: string; className: string }
> = {
  판매중: {
    label: '판매중',
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800',
  },
  예약중: {
    label: '예약중',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800',
  },
  거래완료: {
    label: '거래완료',
    className: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
  },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}.${dd}`
}

interface ISnapshotListProps {
  snapshots: ISnapshot[]
  alertMinPrice?: number | null
  alertMaxPrice?: number | null
}

function isInAlertRange(
  price: number,
  alertMinPrice?: number | null,
  alertMaxPrice?: number | null,
): boolean {
  if (alertMinPrice == null && alertMaxPrice == null) return false
  const aboveMin = alertMinPrice == null || price >= alertMinPrice
  const belowMax = alertMaxPrice == null || price <= alertMaxPrice
  return aboveMin && belowMax
}

export function SnapshotList({ snapshots, alertMinPrice, alertMaxPrice }: ISnapshotListProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <PackageSearch className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          조건에 맞는 매물이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[1300px]">
      <table className="w-full text-sm" aria-label="매물 목록">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">날짜</th>
            <th className="pb-2 pr-3 font-medium text-right">가격</th>
            <th className="pb-2 pr-3 font-medium">플랫폼</th>
            <th className="pb-2 pr-3 font-medium">상태</th>
            <th className="pb-2 font-medium">제목</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {snapshots.map((snapshot) => {
            const statusStyle = STATUS_VARIANT[snapshot.status]
            return (
              <tr key={snapshot.id} className="group">
                <td className="py-2.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(snapshot.posted_at)}
                </td>
                <td className="py-2.5 pr-3 text-right font-medium tabular-nums whitespace-nowrap">
                  {snapshot.price.toLocaleString()}원
                </td>
                <td className="py-2.5 pr-3">
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {PLATFORM_LABEL[snapshot.platform]}
                  </Badge>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle.className}`}
                  >
                    {statusStyle.label}
                  </span>
                </td>
                <td className="py-2.5 max-w-[180px] sm:max-w-[360px]">
                  <a
                    href={snapshot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 truncate text-foreground hover:text-blue-600 transition-colors"
                    aria-label={`${snapshot.title} 매물 바로가기`}
                  >
                    <span className="truncate">{snapshot.title}</span>
                    <ExternalLink
                      className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-hidden="true"
                    />
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
