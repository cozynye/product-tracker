// Supabase CLI 생성 포맷을 수동으로 작성한 버전
// 실제 연동 후: npx supabase gen types typescript --project-id <id> > src/types/database.types.ts

export type Database = {
  public: {
    Tables: {
      user_monitors: {
        Row: {
          id: string
          keyword: string
          category: string
          target_price: number | null
          alert_min_price: number | null
          alert_price: number | null
          min_price: number | null
          max_price: number | null
          excluded_keywords: string[]
          last_crawled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          keyword: string
          category: string
          target_price?: number | null
          alert_min_price?: number | null
          alert_price?: number | null
          min_price?: number | null
          max_price?: number | null
          excluded_keywords?: string[]
          last_crawled_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          keyword?: string
          category?: string
          target_price?: number | null
          alert_min_price?: number | null
          alert_price?: number | null
          min_price?: number | null
          max_price?: number | null
          excluded_keywords?: string[]
          last_crawled_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      price_snapshots: {
        Row: {
          id: string
          monitor_id: string
          platform: string
          title: string
          price: number
          status: string
          url: string
          posted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          monitor_id: string
          platform: string
          title: string
          price: number
          status: string
          url: string
          posted_at: string
          created_at?: string
        }
        Update: {
          id?: string
          monitor_id?: string
          platform?: string
          title?: string
          price?: number
          status?: string
          url?: string
          posted_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'price_snapshots_monitor_id_fkey'
            columns: ['monitor_id']
            isOneToOne: false
            referencedRelation: 'user_monitors'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 앱 전용 도메인 타입 (DB Row 타입 위에 유니온 타입 입힘)
export interface IMonitor {
  id: string
  keyword: string
  category: string
  target_price: number | null
  alert_min_price: number | null
  alert_price: number | null
  min_price: number | null
  max_price: number | null
  excluded_keywords: string[]
  last_crawled_at: string | null
  created_at: string
}

export interface ISnapshot {
  id: string
  monitor_id: string
  platform: 'joonggonara' | 'bunjang' | 'manual'
  title: string
  price: number
  status: '판매중' | '예약중' | '거래완료'
  url: string
  posted_at: string
  created_at: string
}

export interface IHotDeal extends ISnapshot {
  status: '판매중'
}

// Server Action 입력 타입
export interface ICreateMonitorInput {
  keyword: string
  category: string
  target_price?: number
  alert_price?: number
  excluded_keywords?: string[]
}

export interface ISnapshotInsert {
  monitor_id: string
  platform: 'joonggonara' | 'bunjang' | 'manual'
  title: string
  price: number
  status: '판매중' | '예약중' | '거래완료'
  url: string
  posted_at: string
}
