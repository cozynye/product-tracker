'use client'
import { useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addManualSnapshot } from '@/actions/snapshots'

interface IManualEntryDialogProps {
  monitorId: string
}

const today = new Date().toISOString().slice(0, 10)

export function ManualEntryDialog({ monitorId }: IManualEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState<'판매중' | '예약중' | '거래완료'>('판매중')
  const [url, setUrl] = useState('')
  const [postedAt, setPostedAt] = useState(today)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) {
      setTitle('')
      setPrice('')
      setStatus('판매중')
      setUrl('')
      setPostedAt(today)
      setSubmitError(null)
    }
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)

      const parsedPrice = parseInt(price.replace(/,/g, ''), 10)
      if (!title.trim()) return setSubmitError('제목을 입력하세요.')
      if (isNaN(parsedPrice) || parsedPrice <= 0) return setSubmitError('올바른 가격을 입력하세요.')

      startTransition(async () => {
        try {
          await addManualSnapshot({
            monitor_id: monitorId,
            platform: 'manual',
            title: title.trim(),
            price: parsedPrice,
            status,
            url: url.trim() || `manual-${Date.now()}`,
            posted_at: new Date(postedAt).toISOString(),
          })
          handleOpenChange(false)
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : '저장에 실패했습니다.')
        }
      })
    },
    [monitorId, title, price, status, url, postedAt, handleOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          수동 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>매물 수동 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="manual-title">제목 *</Label>
            <Input
              id="manual-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="매물 제목"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-price">가격 (원) *</Label>
            <Input
              id="manual-price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예: 150000"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-status">상태</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
              disabled={isPending}
            >
              <SelectTrigger id="manual-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="판매중">판매중</SelectItem>
                <SelectItem value="예약중">예약중</SelectItem>
                <SelectItem value="거래완료">거래완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-url">URL (선택)</Label>
            <Input
              id="manual-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-date">게시일</Label>
            <Input
              id="manual-date"
              type="date"
              value={postedAt}
              onChange={(e) => setPostedAt(e.target.value)}
              disabled={isPending}
            />
          </div>

          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
