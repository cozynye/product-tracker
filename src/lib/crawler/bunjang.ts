import axios from 'axios'
import type { ISnapshotInsert } from '@/types/database.types'

interface BunjangItem {
  pid: string
  name: string
  price: number
  status: string // '0'=판매중, '1'=예약중, '2'/'3'=거래완료
  type: string // 'PRODUCT' | 'AD'
  update_time: number // Unix timestamp
}

interface BunjangApiResponse {
  list: BunjangItem[]
}

const STATUS_MAP: Record<string, ISnapshotInsert['status']> = {
  '0': '판매중',
  '1': '예약중',
  '2': '거래완료',
  '3': '거래완료',
}

const MAX_PAGES = 5 // 최대 500건
const PAGE_SIZE = 100

async function fetchBunjangPage(
  keyword: string,
  page: number,
): Promise<BunjangItem[]> {
  const params = new URLSearchParams({
    q: keyword,
    order: 'score',
    page: String(page),
    n: String(PAGE_SIZE),
    stat_device: 'w',
    req_ref: 'search',
    version: '5',
    request_id: Date.now().toString(),
  })

  const { data } = await axios.get<BunjangApiResponse>(
    `https://api.bunjang.co.kr/api/1/find_v2.json?${params}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Origin: 'https://m.bunjang.co.kr',
        Referer: `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(keyword)}`,
      },
      timeout: 15_000,
    },
  )

  return data?.list ?? []
}

export async function crawlBunjang(
  keyword: string,
  monitorId: string,
): Promise<ISnapshotInsert[]> {
  const allItems: BunjangItem[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    const items = await fetchBunjangPage(keyword, page)
    if (!items.length) break
    allItems.push(...items)
    // 마지막 페이지 도달 시 조기 종료
    if (items.length < PAGE_SIZE) break
  }

  return allItems
    .filter((item) => item.type === 'PRODUCT')
    .map((item) => ({
      monitor_id: monitorId,
      platform: 'bunjang' as const,
      title: item.name,
      price: Number(item.price),
      status: STATUS_MAP[item.status] ?? '거래완료',
      url: `https://bunjang.co.kr/products/${item.pid}`,
      posted_at: new Date(item.update_time * 1000).toISOString(),
    }))
}
