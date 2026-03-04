import { ExternalLink, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ISnapshot } from '@/types/database.types'

const PLATFORM_LABEL: Record<ISnapshot['platform'], string> = {
  bunjang: '번개장터',
  joonggonara: '중고나라',
  manual: '직접입력',
}

interface IHotDealListProps {
  deals: ISnapshot[]
}

export function HotDealList({ deals }: IHotDealListProps) {
  if (deals.length === 0) return null

  return (
    <section aria-label="핫딜 목록">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold">적정가 이하 매물</h2>
        <Badge variant="secondary" className="text-xs">
          {deals.length}건
        </Badge>
      </div>
      <ul className="flex flex-col gap-2 max-h-[272px] overflow-y-auto pr-1">
        {deals.map((deal) => (
          <li
            key={deal.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-orange-50/50 px-4 py-3 dark:bg-orange-950/10"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Badge variant="outline" className="shrink-0 text-xs">
                {PLATFORM_LABEL[deal.platform]}
              </Badge>
              <span className="truncate text-sm text-foreground">{deal.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-bold text-blue-600">
                {deal.price.toLocaleString()}원
              </span>
              <a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`${deal.title} 바로가기`}
              >
                바로가기
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
