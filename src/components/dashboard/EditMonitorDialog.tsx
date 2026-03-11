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
import { updateMonitor } from '@/actions/monitors'
import type { IMonitor } from '@/types/database.types'

const CATEGORIES = ['시계', '슈프림'] as const

interface IEditMonitorDialogProps {
  monitor: IMonitor
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function EditMonitorDialog({ monitor, open, onOpenChange, onUpdated }: IEditMonitorDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [keyword, setKeyword] = useState(monitor.keyword)
  const [category, setCategory] = useState(monitor.category)
  const [targetPrice, setTargetPrice] = useState(monitor.target_price?.toString() ?? '')
  const [alertPrice, setAlertPrice] = useState(monitor.alert_price?.toString() ?? '')
  const [minPrice, setMinPrice] = useState(monitor.min_price?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(monitor.max_price?.toString() ?? '')
  const [excludedKeywords, setExcludedKeywords] = useState(monitor.excluded_keywords.join(', '))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!keyword.trim()) next.keyword = '검색어를 입력하세요'
    if (!category) next.category = '카테고리를 선택하세요'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      await updateMonitor(monitor.id, {
        keyword: keyword.trim(),
        category,
        target_price: targetPrice ? Number(targetPrice) : null,
        alert_price: alertPrice ? Number(alertPrice) : null,
        min_price: minPrice ? Number(minPrice) : null,
        max_price: maxPrice ? Number(maxPrice) : null,
        excluded_keywords: excludedKeywords
          ? excludedKeywords.split(',').map((kw) => kw.trim()).filter(Boolean)
          : [],
      })
      onOpenChange(false)
      onUpdated()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>검색어 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-keyword">검색어 *</Label>
            <Input
              id="edit-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-invalid={!!errors.keyword}
            />
            {errors.keyword && (
              <p role="alert" className="text-xs text-destructive">{errors.keyword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-category">카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category" aria-invalid={!!errors.category}>
                <SelectValue />
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
              <Label htmlFor="edit-target-price">적정가 (원)</Label>
              <Input
                id="edit-target-price"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-alert-price">알림가 (원)</Label>
              <Input
                id="edit-alert-price"
                type="number"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-excluded">제외 키워드 (쉼표로 구분)</Label>
            <Input
              id="edit-excluded"
              value={excludedKeywords}
              onChange={(e) => setExcludedKeywords(e.target.value)}
              placeholder="예) 부품, 수리, 케이스"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
