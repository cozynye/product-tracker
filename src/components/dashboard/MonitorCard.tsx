'use client'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IMonitor } from '@/types/database.types'

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '수집 전'
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

function formatAlertPrice(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min.toLocaleString()}~${max.toLocaleString()}원`
  if (max != null) return `~${max.toLocaleString()}원`
  if (min != null) return `${min.toLocaleString()}원~`
  return '미설정'
}

interface IMonitorCardProps {
  monitor: IMonitor
}

export function MonitorCard({ monitor }: IMonitorCardProps) {
  const router = useRouter()

  const handleCardClick = useCallback(() => {
    router.push(`/monitor/${monitor.id}`)
  }, [router, monitor.id])

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`${monitor.keyword} 모니터 상세 보기`}
    >
      <CardHeader className="pb-1">
        <Badge variant="secondary" className="w-fit">{monitor.category}</Badge>
        <h3 className="font-semibold text-base leading-tight">{monitor.keyword}</h3>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">적정가</dt>
            <dd className="font-medium">
              {monitor.target_price != null
                ? `${monitor.target_price.toLocaleString()}원`
                : '미설정'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">알림가</dt>
            <dd className="font-medium">
              {formatAlertPrice(monitor.alert_min_price, monitor.alert_price)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          최근 수집: {formatTimeAgo(monitor.last_crawled_at)}
        </p>
      </CardContent>
    </Card>
  )
}
