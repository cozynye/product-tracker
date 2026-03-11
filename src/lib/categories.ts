export const CATEGORIES = [
  '시계',
  '슈프림',
  '나이키',
  '조던',
  '뉴발란스',
  '스톤아일랜드',
  '레고',
  '아이패드',
  '맥북',
] as const

export type Category = (typeof CATEGORIES)[number]
