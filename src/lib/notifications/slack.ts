import { PLATFORM_LABEL } from '@/lib/constants'
import type { ISnapshot } from '@/types/database.types'

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export interface ISlackAlertItem {
  keyword: string
  platform: string
  title: string
  price: number
  alertPrice: number
  url: string
}

export async function sendSlackAlert(items: ISlackAlertItem[]): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[slack] SLACK_WEBHOOK_URL이 설정되지 않았습니다.')
    return
  }

  const text = [
    `🔔 *[${items[0].keyword}] 알림가 이하 매물 ${items.length}건*`,
    '',
    ...items.map((item) =>
      `• *${item.title}*\n  └ ${item.price.toLocaleString()}원 (알림가: ${item.alertPrice.toLocaleString()}원) | ${PLATFORM_LABEL[item.platform as ISnapshot['platform']] ?? item.platform}\n  └ ${item.url}`
    ),
  ].join('\n')

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`[slack] 알림 전송 실패: ${response.status} ${body}`)
  }

  console.log(`[slack] 알림 ${items.length}건 전송 완료`)
}

export async function sendSlackError(keyword: string, errorMessage: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return

  const text = `🚨 *[크롤링 실패] ${keyword}*\n\`${errorMessage}\``

  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch((e) => console.error('[slack] 에러 알림 전송 실패:', e))
}
