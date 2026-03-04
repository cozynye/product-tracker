'use client'
import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateMonitor } from '@/actions/monitors'

interface IExcludedKeywordInputProps {
  monitorId: string
  keywords: string[]
}

export function ExcludedKeywordInput({ monitorId, keywords }: IExcludedKeywordInputProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || keywords.includes(trimmed)) return
    const next = [...keywords, trimmed]
    setInput('')
    startTransition(async () => {
      await updateMonitor(monitorId, { excluded_keywords: next })
      router.refresh()
    })
  }, [input, keywords, monitorId, router])

  const handleRemove = useCallback(
    (keyword: string) => () => {
      const next = keywords.filter((k) => k !== keyword)
      startTransition(async () => {
        await updateMonitor(monitorId, { excluded_keywords: next })
        router.refresh()
      })
    },
    [keywords, monitorId, router],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAdd()
      }
    },
    [handleAdd],
  )

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">제외 키워드</p>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <Badge key={kw} variant="secondary" className="gap-1 pr-1">
              {kw}
              <button
                onClick={handleRemove(kw)}
                disabled={isPending}
                className="rounded-full hover:bg-muted p-0.5 transition-colors"
                aria-label={`${kw} 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="제외할 키워드 입력"
          className="h-8 text-sm"
          disabled={isPending}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isPending || !input.trim()}
          className="h-8 shrink-0"
        >
          추가
        </Button>
      </div>
    </div>
  )
}
