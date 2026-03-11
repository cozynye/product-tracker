import axios from 'axios'
import * as cheerio from 'cheerio'
import { sendSlackError } from '@/lib/notifications/slack'
import type { ISnapshotInsert } from '@/types/database.types'

interface JoongnaItem {
  seq: number
  title: string
  price: number
  state: number // 0=판매중, 1=예약중, 2=판매완료
  sortDate: string
  url?: string
}

interface NextData {
  props?: {
    pageProps?: {
      dehydratedState?: {
        queries?: Array<{
          state?: {
            data?: {
              data?: {
                items?: JoongnaItem[]
              }
            }
          }
        }>
      }
    }
  }
}

const STATUS_MAP: Record<number, ISnapshotInsert['status']> = {
  0: '판매중',
  1: '예약중',
  2: '거래완료',
}

type ParseResult =
  | { ok: true; items: JoongnaItem[] }
  | { ok: false; reason: 'no_script' | 'no_items' }

function parseNextData(html: string): ParseResult {
  const $ = cheerio.load(html)
  const scriptContent = $('#__NEXT_DATA__').html()
  if (!scriptContent) return { ok: false, reason: 'no_script' }

  const nextData: NextData = JSON.parse(scriptContent)
  const queries = nextData?.props?.pageProps?.dehydratedState?.queries ?? []

  for (const query of queries) {
    const items = query?.state?.data?.data?.items
    if (Array.isArray(items) && items.length > 0) {
      return { ok: true, items }
    }
  }
  return { ok: false, reason: 'no_items' }
}

export async function crawlJoonggonara(
  keyword: string,
  monitorId: string,
): Promise<ISnapshotInsert[]> {
  const pageUrl = `https://web.joongna.com/search/${encodeURIComponent(keyword)}`

  const { data: html } = await axios.get<string>(pageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
    },
    timeout: 15_000,
  })

  const result = parseNextData(html)

  if (!result.ok) {
    const msg = result.reason === 'no_script'
      ? '중고나라: __NEXT_DATA__ 스크립트 없음 — 페이지 구조 변경 가능성'
      : '중고나라: items 파싱 실패 — dehydratedState 구조 변경 가능성'
    console.error(`[joonggonara] ${msg}`)
    await sendSlackError(`중고나라 크롤러 (${keyword})`, msg)
    return []
  }

  const { items } = result

  return items.map((item) => ({
    monitor_id: monitorId,
    platform: 'joonggonara' as const,
    title: item.title,
    price: Number(item.price ?? 0),
    status: STATUS_MAP[item.state] ?? '거래완료',
    url: `https://web.joongna.com/product/${item.seq}`,
    posted_at: new Date(item.sortDate).toISOString(),
  }))
}
