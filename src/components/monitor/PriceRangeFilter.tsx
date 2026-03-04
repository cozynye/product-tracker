'use client'
import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateMonitor } from '@/actions/monitors'

interface IPriceRangeFilterProps {
  monitorId: string
  savedMin: number | null
  savedMax: number | null
  minPrice: number | null
  maxPrice: number | null
  onMinChange: (value: number | null) => void
  onMaxChange: (value: number | null) => void
}

function parsePrice(val: string): number | null {
  const trimmed = val.replace(/,/g, '').trim()
  if (trimmed === '') return null
  const n = parseInt(trimmed, 10)
  return isNaN(n) || n < 0 ? null : n
}

export function PriceRangeFilter({
  monitorId,
  savedMin,
  savedMax,
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: IPriceRangeFilterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [minInput, setMinInput] = useState(savedMin != null ? String(savedMin) : '')
  const [maxInput, setMaxInput] = useState(savedMax != null ? String(savedMax) : '')

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setMinInput(val)
      onMinChange(parsePrice(val))
    },
    [onMinChange],
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setMaxInput(val)
      onMaxChange(parsePrice(val))
    },
    [onMaxChange],
  )

  const isDirty =
    parsePrice(minInput) !== savedMin || parsePrice(maxInput) !== savedMax

  const handleSave = useCallback(() => {
    startTransition(async () => {
      await updateMonitor(monitorId, {
        min_price: parsePrice(minInput),
        max_price: parsePrice(maxInput),
      })
      router.refresh()
    })
  }, [monitorId, minInput, maxInput, router])

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="가격 범위 필터">
        <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">가격</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            value={minInput}
            onChange={handleMinChange}
            placeholder="최소"
            className="h-7 w-24 text-xs"
            aria-label="최소 가격"
          />
          <span className="text-xs text-muted-foreground">~</span>
          <Input
            type="number"
            min={0}
            value={maxInput}
            onChange={handleMaxChange}
            placeholder="최대"
            className="h-7 w-24 text-xs"
            aria-label="최대 가격"
          />
          <span className="text-xs text-muted-foreground">원</span>
        </div>
        {isDirty && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={handleSave}
            disabled={isPending}
          >
            <Save className="h-3 w-3" />
            저장
          </Button>
        )}
        {(minPrice != null || maxPrice != null) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => {
              setMinInput('')
              setMaxInput('')
              onMinChange(null)
              onMaxChange(null)
            }}
          >
            초기화
          </Button>
        )}
      </div>
    </div>
  )
}
