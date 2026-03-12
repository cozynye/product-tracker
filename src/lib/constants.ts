import type { ISnapshot } from '@/types/database.types'

export const PLATFORM_LABEL: Record<ISnapshot['platform'], string> = {
  bunjang: '번개장터',
  joonggonara: '중고나라',
  manual: '직접입력',
}
