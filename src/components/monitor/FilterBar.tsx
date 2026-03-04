import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { PlatformFilter, StatusFilter } from '@/hooks/useMonitorFilter'

const PLATFORM_OPTIONS: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'bunjang', label: '번개장터' },
  { value: 'joonggonara', label: '중고나라' },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '판매중', label: '판매중' },
  { value: '예약중', label: '예약중' },
  { value: '거래완료', label: '거래완료' },
]

interface IFilterBarProps {
  platform: PlatformFilter
  onPlatformChange: (value: PlatformFilter) => void
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
}

export function FilterBar({
  platform,
  onPlatformChange,
  status,
  onStatusChange,
}: IFilterBarProps) {
  const handlePlatformClick = useCallback(
    (value: PlatformFilter) => () => {
      onPlatformChange(value)
    },
    [onPlatformChange],
  )

  const handleStatusClick = useCallback(
    (value: StatusFilter) => () => {
      onStatusChange(value)
    },
    [onStatusChange],
  )

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3" role="group" aria-label="필터">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="플랫폼 필터">
        <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">플랫폼</span>
        {PLATFORM_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={platform === opt.value ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handlePlatformClick(opt.value)}
            aria-pressed={platform === opt.value}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="상태 필터">
        <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">상태</span>
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={status === opt.value ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleStatusClick(opt.value)}
            aria-pressed={status === opt.value}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
