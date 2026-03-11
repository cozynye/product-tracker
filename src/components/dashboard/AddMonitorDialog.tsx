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
import { createMonitor } from '@/actions/monitors'

const CATEGORIES = ['시계', '슈프림'] as const

interface IAddMonitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function AddMonitorDialog({ open, onOpenChange, onCreated }: IAddMonitorDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [excludedKeywords, setExcludedKeywords] = useState('')
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      await createMonitor({
        keyword: keyword.trim(),
        category,
        target_price: targetPrice ? Number(targetPrice) : undefined,
        alert_price: alertPrice ? Number(alertPrice) : undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        excluded_keywords: excludedKeywords
          ? excludedKeywords.split(',').map((kw) => kw.trim()).filter(Boolean)
          : [],
      })
      resetForm()
      onOpenChange(false)
      onCreated()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) { resetForm(); onOpenChange(v) } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>검색어 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="keyword">검색어 *</Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예) 롤렉스 서브마리너"
              aria-invalid={!!errors.keyword}
              aria-describedby={errors.keyword ? 'keyword-error' : undefined}
            />
            {errors.keyword && (
              <p id="keyword-error" role="alert" className="text-xs text-destructive">
                {errors.keyword}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="category"
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'category-error' : undefined}
              >
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p id="category-error" role="alert" className="text-xs text-destructive">
                {errors.category}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-price">적정가 (원)</Label>
              <Input
                id="target-price"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="예) 1500000"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alert-price">알림가 (원)</Label>
              <Input
                id="alert-price"
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
                placeholder="최솟값 (예) 500000"
                min={0}
              />
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="최댓값 (예) 1200000"
                min={0}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              알림가 이하이면서 이 범위 안에 있을 때만 슬랙 알림 발송
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="excluded-keywords">제외 키워드 (쉼표로 구분)</Label>
            <Input
              id="excluded-keywords"
              value={excludedKeywords}
              onChange={(e) => setExcludedKeywords(e.target.value)}
              placeholder="예) 부품, 수리, 케이스"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); onOpenChange(false) }}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
