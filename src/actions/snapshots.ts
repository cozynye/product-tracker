'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ISnapshot, ISnapshotInsert } from '@/types/database.types'

export async function upsertSnapshots(snapshots: ISnapshotInsert[]): Promise<void> {
  if (!snapshots.length) return
  // 같은 (monitor_id, url) 중복 제거 — 배치 내 중복 시 PostgreSQL upsert 에러 방지
  const seen = new Set<string>()
  const unique = snapshots.filter((s) => {
    const key = `${s.monitor_id}::${s.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const supabase = await createClient()
  const { error } = await supabase
    .from('price_snapshots')
    .upsert(unique, { onConflict: 'monitor_id,url' })
  if (error) throw new Error(error.message)
}

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000

export async function getSnapshots(monitorId: string): Promise<ISnapshot[]> {
  const supabase = await createClient()
  const cutoff = new Date(Date.now() - THREE_MONTHS_MS).toISOString()
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('*')
    .eq('monitor_id', monitorId)
    .gte('posted_at', cutoff)
    .order('posted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ISnapshot[]
}

export async function deleteOldSnapshots(monitorId: string): Promise<void> {
  const supabase = await createClient()
  const cutoff = new Date(Date.now() - THREE_MONTHS_MS).toISOString()
  const { error } = await supabase
    .from('price_snapshots')
    .delete()
    .eq('monitor_id', monitorId)
    .lt('posted_at', cutoff)
  if (error) throw new Error(error.message)
}

export async function updateLastCrawledAt(monitorId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_monitors')
    .update({ last_crawled_at: new Date().toISOString() })
    .eq('id', monitorId)
  if (error) throw new Error(error.message)
}

export async function addManualSnapshot(snapshot: ISnapshotInsert): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('price_snapshots')
    .upsert(snapshot, { onConflict: 'monitor_id,url' })
  if (error) throw new Error(error.message)
  revalidatePath(`/monitor/${snapshot.monitor_id}`)
}
