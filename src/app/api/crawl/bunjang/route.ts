import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crawlMonitor } from '@/lib/crawler/crawl'
import type { IMonitor } from '@/types/database.types'

export async function POST(request: Request) {
  try {
    const { monitorId, force = false } = await request.json()

    if (!monitorId) {
      return NextResponse.json({ error: 'monitorId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: monitor, error } = await supabase
      .from('user_monitors')
      .select('*')
      .eq('id', monitorId)
      .single()

    if (error || !monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
    }

    const result = await crawlMonitor(monitor as IMonitor, 'bunjang', force)

    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[POST /api/crawl/bunjang]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
