'use client'
import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateMonitor } from '@/actions/monitors'

// ── 단일값 행 (적정가) ──────────────────────────────────────────
interface IPriceRowProps {
  label: string
  value: number | null
  description: string
  onSave: (next: number | null) => Promise<void>
  isPending: boolean
}

function PriceRow({ label, value, description, onSave, isPending }: IPriceRowProps) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  const startEdit = useCallback(() => {
    setInput(value != null ? String(value) : '')
    setEditing(true)
  }, [value])

  const cancelEdit = useCallback(() => {
    setEditing(false)
    setInput('')
  }, [])

  const handleSave = useCallback(async () => {
    const trimmed = input.trim()
    const parsed = trimmed === '' ? null : parseInt(trimmed, 10)
    if (trimmed !== '' && (isNaN(parsed!) || parsed! <= 0)) return
    await onSave(parsed)
    setEditing(false)
  }, [input, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') cancelEdit()
    },
    [handleSave, cancelEdit],
  )

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-16 shrink-0">
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 flex-1">
          <Input
            type="number"
            min={0}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="미설정"
            className="h-7 w-32 text-sm"
            autoFocus
            disabled={isPending}
          />
          <span className="text-sm text-muted-foreground">원</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={isPending} aria-label="저장">
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit} disabled={isPending} aria-label="취소">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          {value != null ? (
            <span className="text-sm font-semibold tabular-nums">{value.toLocaleString()}원</span>
          ) : (
            <span className="text-sm text-muted-foreground">미설정</span>
          )}
          <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded" aria-label={`${label} 수정`}>
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
    </div>
  )
}

// ── 범위값 행 (알림가: 이상 ~ 이하) ────────────────────────────
interface IAlertRangeRowProps {
  minValue: number | null
  maxValue: number | null
  onSave: (min: number | null, max: number | null) => Promise<void>
  isPending: boolean
}

function AlertRangeRow({ minValue, maxValue, onSave, isPending }: IAlertRangeRowProps) {
  const [editing, setEditing] = useState(false)
  const [minInput, setMinInput] = useState('')
  const [maxInput, setMaxInput] = useState('')

  const startEdit = useCallback(() => {
    setMinInput(minValue != null ? String(minValue) : '')
    setMaxInput(maxValue != null ? String(maxValue) : '')
    setEditing(true)
  }, [minValue, maxValue])

  const cancelEdit = useCallback(() => {
    setEditing(false)
  }, [])

  const handleSave = useCallback(async () => {
    const parseVal = (s: string) => {
      const t = s.trim()
      if (t === '') return null
      const n = parseInt(t, 10)
      return isNaN(n) || n <= 0 ? null : n
    }
    await onSave(parseVal(minInput), parseVal(maxInput))
    setEditing(false)
  }, [minInput, maxInput, onSave])

  const hasValue = minValue != null || maxValue != null

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-16 shrink-0">
        <p className="text-xs text-muted-foreground">알림가</p>
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 flex-wrap">
          <Input
            type="number"
            min={0}
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder="최소 (선택)"
            className="h-7 w-28 text-sm"
            autoFocus
            disabled={isPending}
          />
          <span className="text-sm text-muted-foreground">원 이상</span>
          <span className="text-sm text-muted-foreground">~</span>
          <Input
            type="number"
            min={0}
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder="최대 (선택)"
            className="h-7 w-28 text-sm"
            disabled={isPending}
          />
          <span className="text-sm text-muted-foreground">원 이하</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={isPending} aria-label="저장">
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit} disabled={isPending} aria-label="취소">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          {hasValue ? (
            <span className="text-sm font-semibold tabular-nums">
              {minValue != null ? `${minValue.toLocaleString()}원 이상` : ''}
              {minValue != null && maxValue != null && ' ~ '}
              {maxValue != null ? `${maxValue.toLocaleString()}원 이하` : ''}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">미설정</span>
          )}
          <button onClick={startEdit} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded" aria-label="알림가 수정">
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground hidden sm:block">향후 카카오 알림 기준 범위</p>
    </div>
  )
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
interface IMonitorPriceSettingsProps {
  monitorId: string
  targetPrice: number | null
  alertMinPrice: number | null
  alertPrice: number | null
}

export function MonitorPriceSettings({
  monitorId,
  targetPrice,
  alertMinPrice,
  alertPrice,
}: IMonitorPriceSettingsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSaveTarget = useCallback(
    (next: number | null) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          await updateMonitor(monitorId, { target_price: next })
          router.refresh()
          resolve()
        })
      }),
    [monitorId, router],
  )

  const handleSaveAlert = useCallback(
    (min: number | null, max: number | null) =>
      new Promise<void>((resolve) => {
        startTransition(async () => {
          await updateMonitor(monitorId, { alert_min_price: min, alert_price: max })
          router.refresh()
          resolve()
        })
      }),
    [monitorId, router],
  )

  return (
    <div className="rounded-lg border divide-y">
      <PriceRow
        label="적정가"
        value={targetPrice}
        description="이하 판매중 매물 → 핫딜 표시"
        onSave={handleSaveTarget}
        isPending={isPending}
      />
      <AlertRangeRow
        minValue={alertMinPrice}
        maxValue={alertPrice}
        onSave={handleSaveAlert}
        isPending={isPending}
      />
    </div>
  )
}
