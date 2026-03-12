'use client'
import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMonitor, updateMonitor } from '@/actions/monitors'
import { CATEGORIES } from '@/lib/categories'
import type { IMonitor } from '@/types/database.types'

interface IMonitorFormDialogProps {
  mode: 'add' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
  initialData?: IMonitor
}

function toStr(v: number | null | undefined): string {
  return v != null ? String(v) : ''
}

export function MonitorFormDialog({
  mode,
  open,
  onOpenChange,
  onDone,
  initialData,
}: IMonitorFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [keyword, setKeyword] = useState(initialData?.keyword ?? '')
  const [category, setCategory] = useState(initialData?.category ?? '')
  const [targetPrice, setTargetPrice] = useState(toStr(initialData?.target_price))
  const [alertPrice, setAlertPrice] = useState(toStr(initialData?.alert_price))
  const [minPrice, setMinPrice] = useState(toStr(initialData?.min_price))
  const [maxPrice, setMaxPrice] = useState(toStr(initialData?.max_price))
  const [excludedKeywords, setExcludedKeywords] = useState(
    initialData?.excluded_keywords.join(', ') ?? ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!keyword.trim()) next.keyword = '검색어를 입력하세요'
    if (!category) next.category = '카테고리를 선택하세요'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function resetForm() {
    setKeyword('')
    setCategory('')
    setTargetPrice('')
    setAlertPrice('')
    setMinPrice('')
    setMaxPrice('')
    setExcludedKeywords('')
    setErrors({})
  }

  function handleClose(v: boolean) {
    if (isPending) return
    if (!v && mode === 'add') resetForm()
    onOpenChange(v)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const excludedList = excludedKeywords
      ? excludedKeywords.split(',').map((kw) => kw.trim()).filter(Boolean)
      : []

    startTransition(async () => {
      if (mode === 'add') {
        await createMonitor({
          keyword: keyword.trim(),
          category,
          target_price: targetPrice ? Number(targetPrice) : undefined,
          alert_price: alertPrice ? Number(alertPrice) : undefined,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          excluded_keywords: excludedList,
        })
        resetForm()
      } else if (initialData) {
        await updateMonitor(initialData.id, {
          keyword: keyword.trim(),
          category,
          target_price: targetPrice ? Number(targetPrice) : null,
          alert_price: alertPrice ? Number(alertPrice) : null,
          min_price: minPrice ? Number(minPrice) : null,
          max_price: maxPrice ? Number(maxPrice) : null,
          excluded_keywords: excludedList,
        })
      }
      onOpenChange(false)
      onDone()
    })
  }

  const title = mode === 'add' ? '검색어 등록' : '검색어 수정'
  const submitLabel = mode === 'add'
    ? (isPending ? '등록 중...' : '등록')
    : (isPending ? '저장 중...' : '저장')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="form-keyword">검색어 *</Label>
            <Input
              id="form-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예) 롤렉스 서브마리너"
              aria-invalid={!!errors.keyword}
            />
            {errors.keyword && (
              <p role="alert" className="text-xs text-destructive">{errors.keyword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-category">카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="form-category" aria-invalid={!!errors.category}>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p role="alert" className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="form-target-price">적정가 (원)</Label>
              <Input
                id="form-target-price"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="예) 1500000"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-alert-price">알림가 (원)</Label>
              <Input
                id="form-alert-price"
                type="number"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="예) 1200000"
                min={0}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>가격 범위 (원) — 알림 발송 조건</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="최솟값"
                min={0}
              />
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="최댓값"
                min={0}
              />
            </div>
            {mode === 'add' && (
              <p className="text-xs text-muted-foreground">
                알림가 이하이면서 이 범위 안에 있을 때만 슬랙 알림 발송
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="form-excluded">제외 키워드 (쉼표로 구분)</Label>
            <Input
              id="form-excluded"
              value={excludedKeywords}
              onChange={(e) => setExcludedKeywords(e.target.value)}
              placeholder="예) 부품, 수리, 케이스"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
