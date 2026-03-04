'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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

export async function updateMonitor(
  id: string,
  data: Partial<Pick<IMonitor, 'target_price' | 'alert_min_price' | 'alert_price' | 'min_price' | 'max_price' | 'excluded_keywords'>>,
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
