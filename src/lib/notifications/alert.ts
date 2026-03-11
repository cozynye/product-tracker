import { createClient } from '@/lib/supabase/server'
import { sendSlackAlert } from './slack'
import type { IMonitor } from '@/types/database.types'

export async function checkAndSendAlerts(monitor: IMonitor): Promise<void> {
  console.log(`[alert] ${monitor.keyword} — is_alert_enabled: ${monitor.is_alert_enabled}, alert_price: ${monitor.alert_price}, min: ${monitor.min_price}, max: ${monitor.max_price}`)
  if (!monitor.is_alert_enabled) return
  if (!monitor.alert_price) return

  const supabase = await createClient()

  // 알림 조건: 판매중 + 알림가 이하 + 가격 범위 내 + 아직 알림 안 보낸 것
  let query = supabase
    .from('price_snapshots')
    .select('id, title, price, platform, url')
    .eq('monitor_id', monitor.id)
    .eq('status', '판매중')
    .lte('price', monitor.alert_price)
    .is('notified_at', null)

  if (monitor.min_price != null) {
    query = query.gte('price', monitor.min_price)
  }
  if (monitor.max_price != null) {
    query = query.lte('price', monitor.max_price)
  }

  const { data: alertItems, error } = await query

  if (error) {
    console.error('[alert] 알림 조건 조회 실패:', error.message)
    return
  }
  console.log(`[alert] ${monitor.keyword} — 조건 충족 매물 ${alertItems?.length ?? 0}건`)
  if (!alertItems?.length) return

  try {
    await sendSlackAlert(
      alertItems.map((item) => ({
        keyword: monitor.keyword,
        platform: item.platform,
        title: item.title,
        price: item.price,
        alertPrice: monitor.alert_price!,
        url: item.url,
      })),
    )
  } catch (e) {
    console.error('[alert] 슬랙 전송 실패 — notified_at 업데이트 안 함:', e instanceof Error ? e.message : e)
    return
  }

  // 슬랙 전송 성공 후에만 notified_at 업데이트
  const ids = alertItems.map((item) => item.id)
  await supabase
    .from('price_snapshots')
    .update({ notified_at: new Date().toISOString() })
    .in('id', ids)
}
