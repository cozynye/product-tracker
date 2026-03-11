'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { crawlMonitor } from '@/lib/crawler/crawl'
import type { IMonitor, ICreateMonitorInput } from '@/types/database.types'

export async function getMonitors(): Promise<IMonitor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_monitors')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as IMonitor[]
}

export async function createMonitor(input: ICreateMonitorInput): Promise<IMonitor> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_monitors')
    .insert({
      keyword: input.keyword,
      category: input.category,
      target_price: input.target_price ?? null,
      alert_price: input.alert_price ?? null,
      min_price: input.min_price ?? null,
      max_price: input.max_price ?? null,
      excluded_keywords: input.excluded_keywords ?? [],
      last_crawled_at: null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/')
  return data as IMonitor
}

export async function deleteMonitor(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_monitors')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function crawlMonitorAction(monitorId: string): Promise<{ bunjangCount: number; joonggnaraCount: number }> {
  const supabase = await createClient()
  const { data: monitor, error } = await supabase
    .from('user_monitors')
    .select('*')
    .eq('id', monitorId)
    .single()
  if (error || !monitor) throw new Error('Monitor not found')
  const result = await crawlMonitor(monitor as IMonitor, 'all', true)
  revalidatePath(`/monitor/${monitorId}`)
  return { bunjangCount: result.bunjangCount, joonggnaraCount: result.joonggnaraCount }
}

export async function updateMonitor(
  id: string,
  data: Partial<Pick<IMonitor, 'target_price' | 'alert_min_price' | 'alert_price' | 'min_price' | 'max_price' | 'excluded_keywords' | 'is_crawling_enabled' | 'is_alert_enabled'>>,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_monitors')
    .update(data)
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath(`/monitor/${id}`)
}
