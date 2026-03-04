'use client'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { IMonitor } from '@/types/database.types'

interface IMonitorCardProps {
  monitor: IMonitor
  onDelete: (id: string) => void
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '수집 전'
  const diff = Date.now() - new Date(dateString).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export function MonitorCard({ monitor, onDelete }: IMonitorCardProps) {
  const router = useRouter()

  const handleCardClick = useCallback(() => {
    router.push(`/monitor/${monitor.id}`)
  }, [router, monitor.id])

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete(monitor.id)
    },
    [onDelete, monitor.id],
  )

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`${monitor.keyword} 모니터 상세 보기`}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-tight">{monitor.keyword}</h3>
          <Badge variant="secondary">{monitor.category}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          onClick={handleDelete}
          aria-label={`${monitor.keyword} 삭제`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
              {monitor.alert_price != null
                ? `${monitor.alert_price.toLocaleString()}원`
                : '미설정'}
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
