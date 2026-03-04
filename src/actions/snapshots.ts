'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ISnapshot, ISnapshotInsert } from '@/types/database.types'

export async function upsertSnapshots(snapshots: ISnapshotInsert[]): Promise<void> {
  if (!snapshots.length) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('price_snapshots')
    .upsert(snapshots, { onConflict: 'monitor_id,url' })
  if (error) throw new Error(error.message)
}

export async function getSnapshots(monitorId: string): Promise<ISnapshot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('*')
    .eq('monitor_id', monitorId)
    .order('posted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ISnapshot[]
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
