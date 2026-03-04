'use client'
import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonitorCard } from '@/components/dashboard/MonitorCard'
import { AddMonitorDialog } from '@/components/dashboard/AddMonitorDialog'
import { deleteMonitor } from '@/actions/monitors'
import type { IMonitor } from '@/types/database.types'

interface IDashboardClientProps {
  monitors: IMonitor[]
}

export function DashboardClient({ monitors }: IDashboardClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [, startTransition] = useTransition()

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        await deleteMonitor(id)
        router.refresh()
      })
    },
    [router],
  )

  const handleCreated = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">PriceTracker</h1>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">검색어 등록</span>
        </Button>
      </div>

      {monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">
            등록된 검색어가 없습니다.
            <br />
            상단의 &apos;검색어 등록&apos; 버튼으로 시작하세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddMonitorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}
