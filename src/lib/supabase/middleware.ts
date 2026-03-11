import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 — 미들웨어에서 반드시 호출해야 쿠키가 최신 상태 유지됨
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 로그인 페이지는 인증 없이 접근 가능
  if (pathname.startsWith('/login')) {
    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // Cron API는 Bearer 토큰으로 직접 인증 — 세션 불필요
  if (pathname.startsWith('/api/cron')) {
    return supabaseResponse
  }

  // 인증되지 않은 요청은 로그인 페이지로
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}
