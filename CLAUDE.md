# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

중고나라·번개장터 크롤링 기반 **시세 분석 서비스 (PriceTracker)**. Next.js 15 App Router + TypeScript + Tailwind CSS + shadcn/ui + Supabase + Recharts + Cheerio 스택. 사용자가 등록한 검색어에 대한 중고 매물 시세를 추적하고, 적정가 이하 핫딜 매물을 강조 표시한다.

## 빠른 탐색 (Quick Navigation)

| 자주 찾는 것                                     | 섹션                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| 개발 명령어                                      | [Development Commands](#development-commands)                 |
| 디렉토리 구조                                    | [Directory Structure](#directory-structure)                   |
| 🤖 서브에이전트 워크플로우 (코드 작성 방식)      | [Sub-Agent Workflow](#-sub-agent-workflow)                    |
| 🔴 Supabase client/server 분리 (혼용 시 에러)    | [Supabase Patterns](#-supabase-patterns--critical)            |
| shadcn/ui 컴포넌트 추가 방법                     | [shadcn/ui Rules](#shadcnui-rules)                            |
| 크롤링 API Route 구조                            | [Crawling Architecture](#crawling-architecture)               |
| Recharts 차트 패턴                               | [Recharts Patterns](#recharts-patterns)                       |
| 🔴 컴포넌트 Props 패턴 (setState 직접 전달 금지) | [Component Props Pattern](#component-props-pattern-critical)  |
| 도메인 용어 사전                                 | [Domain Glossary](#domain-glossary)                           |
| 🔴 E2E 테스트 (Playwriter)                       | [Playwriter E2E Testing](#-playwriter-e2e-testing--mandatory) |

---

## 🤖 Sub-Agent Workflow

**모든 코드 작성은 2개 에이전트가 병렬로 독립 작성 → 리뷰어가 합성** 하는 방식을 기본으로 한다.

### 에이전트 역할 정의

| 에이전트            | `subagent_type`              | 담당 영역                                                                              |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| **디자인 에이전트** | `frontend-architect`         | UI 컴포넌트 구조, shadcn/ui 통합, Tailwind 클래스 설계, Recharts 시각화, 접근성        |
| **개발 에이전트**   | `feature-dev:code-architect` | 비즈니스 로직 아키텍처, Supabase 패턴, API Route 설계, Server Actions, TypeScript 타입 |
| **리뷰어**          | `feature-dev:code-reviewer`  | 두 버전을 비교하여 버그·보안·품질·패턴 준수 검토 후 최종 합성                          |

### 표준 워크플로우 (신규 기능 / 컴포넌트)

```
Step 1. 병렬 작성 (디자인 에이전트 + 개발 에이전트 동시 실행)
         ├─ frontend-architect  → UI 중심 구현 (접근성, 반응형, Tailwind 최적화)
         └─ feature-dev:code-architect → 로직 중심 구현 (타입 안전성, Supabase, 성능)

Step 2. 리뷰 및 합성 (feature-dev:code-reviewer)
         └─ 두 구현을 비교 → 장점 합성 → 최종 코드 확정

Step 3. E2E 검증 (Playwriter)
         └─ 합성된 코드를 실제 브라우저에서 검증
```

### 상황별 에이전트 선택

| 상황                 | 사용 에이전트                                                                     | 비고         |
| -------------------- | --------------------------------------------------------------------------------- | ------------ |
| 새 페이지/컴포넌트   | `frontend-architect` + `feature-dev:code-architect` → `feature-dev:code-reviewer` | 병렬 후 합성 |
| Supabase 쿼리/Action | `feature-dev:code-architect` → `feature-dev:code-reviewer`                        | 단일 후 리뷰 |
| 크롤러 로직          | `feature-dev:code-architect` → `feature-dev:code-reviewer`                        | 단일 후 리뷰 |
| UI 개선/리디자인     | `frontend-architect` → `feature-dev:code-reviewer`                                | 단일 후 리뷰 |
| Recharts 차트        | `frontend-architect` + `feature-dev:code-architect` → `feature-dev:code-reviewer` | 병렬 후 합성 |
| 버그 수정            | `feature-dev:code-explorer` (원인 탐색) → `feature-dev:code-reviewer` (패치 검증) | 순차         |
| 리팩토링             | `refactoring-expert` → `feature-dev:code-reviewer`                                | 순차         |
| 코드베이스 파악      | `feature-dev:code-explorer`                                                       | 읽기 전용    |

### 에이전트별 특기 사항

**`frontend-architect`** (디자인 에이전트)

- shadcn/ui Dialog, Card, Badge 컴포넌트 패턴에 강함
- Tailwind 반응형 (`sm:`, `md:`, `lg:`) 및 dark mode 처리
- Recharts `ResponsiveContainer` + `ReferenceLine` 적정가 시각화
- 접근성(aria-label, role, keyboard navigation) 자동 반영

**`feature-dev:code-architect`** (개발 에이전트)

- Supabase client/server 분리 패턴 아키텍처 설계
- Server Action + `createServerClient` 흐름 설계
- `price_snapshots` upsert 로직, `excluded_keywords` 필터링 로직
- TypeScript 타입 계층 (`IMonitor`, `ISnapshot`, `IHotDeal`) 설계

**`feature-dev:code-reviewer`** (리뷰어 — 항상 마지막)

- 두 에이전트 출력의 버그, 보안 취약점, 타입 오류 탐지
- CLAUDE.md 패턴 준수 확인 (`on[Action]` Props, Supabase 분리 등)
- hotDeal 판별 조건(`price <= target_price && status === '판매중'`) 로직 검증
- 최종 합성 코드 제안

**`feature-dev:code-explorer`** (탐색 전용)

- 버그 원인 추적, 기존 코드 패턴 파악할 때만 사용
- 코드를 수정하지 않음 — 정보 수집 전용

### 프롬프트 템플릿

신규 기능 작성 시 병렬 에이전트 호출 예시:

```
Agent 1 (frontend-architect):
"price-tracker 프로젝트의 MonitorCard 컴포넌트를 작성해라.
shadcn/ui Card 사용, keyword/category/targetPrice/hotDealCount 표시,
onSelect/onDelete prop 패턴, Tailwind 스타일링. CLAUDE.md Props 패턴 준수."

Agent 2 (feature-dev:code-architect):
"price-tracker 프로젝트의 MonitorCard 컴포넌트를 작성해라.
IMonitorCardProps 타입 정의, useCallback 적용, hotDeal 뱃지 조건 로직,
server action 연결 구조, CLAUDE.md 패턴 준수."

→ 두 결과를 feature-dev:code-reviewer에게 전달하여 최종 합성
```

---

## Development Commands

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버 실행
npm run lint      # ESLint
```

---

## Code Architecture

### Directory Structure

```
src/
├── app/                    # App Router pages & layouts
│   ├── (dashboard)/        # 메인 대시보드 (검색어 카드 리스트)
│   ├── monitor/[id]/       # 상세 분석 페이지 (그래프 + 아이템 리스트)
│   └── api/
│       └── crawl/
│           └── [platform]/ # 크롤링 API Route (joonggonara / bunjang)
├── components/             # 재사용 UI 컴포넌트
│   ├── ui/                 # shadcn/ui 자동 생성 컴포넌트 (직접 수정 가능)
│   ├── dashboard/          # 대시보드 전용 컴포넌트
│   └── monitor/            # 상세 분석 페이지 전용 컴포넌트
├── hooks/                  # 커스텀 훅 (usePriceData, useMonitor 등)
├── lib/
│   ├── supabase/           # Supabase 클라이언트 (browser / server 분리)
│   └── crawler/            # 크롤러 로직 (Cheerio 파싱)
├── types/                  # TypeScript 타입 정의
└── actions/                # Server Actions (Supabase CRUD)
```

---

## Key Technologies & Patterns

### 🔴 Supabase Patterns — CRITICAL

Client/Server 혼용 시 쿠키 접근 에러 또는 SSR 불일치가 발생한다. **컨텍스트에 따라 반드시 분리 사용.**

```typescript
// ✅ Client Component ('use client') → browser client
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ✅ Server Component / API Route / Server Action → server client
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          /* ... */
        },
      },
    }
  );
}
```

**파일 위치 규칙**:

- `src/lib/supabase/client.ts` — browser client (Client Component용)
- `src/lib/supabase/server.ts` — server client (Server Component / API Route / Action용)

**테이블 스키마**:

| 테이블            | 주요 컬럼                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `user_monitors`   | `id`, `user_id`, `keyword`, `category`, `target_price`, `alert_price`, `excluded_keywords(text[])` |
| `price_snapshots` | `id`, `monitor_id(FK)`, `platform`, `title`, `price`, `status`, `url`, `posted_at`                 |

**Server Actions** (`src/actions/`에 집중):

```typescript
// src/actions/monitors.ts
"use server";
import { createClient } from "@/lib/supabase/server";

export async function createMonitor(data: ICreateMonitorInput) {
  const supabase = createClient();
  const { data: monitor, error } = await supabase
    .from("user_monitors")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return monitor;
}
```

---

### shadcn/ui Rules

- **설치**: `npx shadcn@latest add [component]` — `src/components/ui/`에 자동 생성
- `src/components/ui/` 파일은 직접 수정 가능 (shadcn은 생성 도구일 뿐, 재생성 시 덮어씌워짐 주의)
- 커스텀 컴포넌트는 `src/components/{feature}/` 하위에 위치 (예: `src/components/dashboard/MonitorCard.tsx`)
- Dialog(모달)는 shadcn Dialog 컴포넌트 활용 — 검색어 등록, 수동 데이터 입력 모달에 사용

```typescript
// ✅ 검색어 등록 모달 패턴
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IAddMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMonitorDialog({
  open,
  onOpenChange,
}: IAddMonitorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>검색어 등록</DialogTitle>
        </DialogHeader>
        {/* 폼 내용 */}
      </DialogContent>
    </Dialog>
  );
}
```

---

### Crawling Architecture

- **API Route 위치**: `src/app/api/crawl/[platform]/route.ts`
- **지원 플랫폼**: `joonggonara` (중고나라), `bunjang` (번개장터)
- Cheerio로 서버사이드 HTML 파싱 → `price_snapshots`에 upsert
- 상세 페이지 진입 시 실시간 크롤링 수행 (하이브리드 전략)

```typescript
// src/app/api/crawl/[platform]/route.ts
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const { monitorId, keyword } = await request.json();
  const platform = params.platform; // 'joonggonara' | 'bunjang'

  // 1. HTML fetch & Cheerio 파싱
  // 2. 결과를 ISnapshotInsert[] 형태로 변환
  // 3. Supabase upsert
  const supabase = createClient();
  await supabase.from("price_snapshots").upsert(snapshots);

  return Response.json({ success: true, count: snapshots.length });
}
```

---

### Recharts Patterns

- **반드시 Client Component** (`'use client'`)에서만 사용
- `PriceChart` 컴포넌트: `src/components/monitor/PriceChart.tsx`
- 적정가 라인은 `ReferenceLine`으로 수평 점선 표시

```typescript
"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface IPriceChartProps {
  data: IChartDataPoint[];
  targetPrice?: number;
}

export function PriceChart({ data, targetPrice }: IPriceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#3b82f6" />
        {targetPrice && (
          <ReferenceLine
            y={targetPrice}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: "적정가", position: "right" }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

### Component Props Pattern (CRITICAL)

setState를 직접 prop으로 전달 금지. 반드시 핸들러 함수로 감싸서 전달.

```typescript
// ❌ WRONG
interface IMonitorCardProps {
  setSelectedId: (id: string) => void;
}
<MonitorCard setSelectedId={setSelectedId} />;

// ✅ CORRECT
interface IMonitorCardProps {
  onSelect: (id: string) => void;
}
const handleSelect = useCallback((id: string) => setSelectedId(id), []);
<MonitorCard onSelect={handleSelect} />;
```

**네이밍 규칙**:

- Props 핸들러: `on[Action]` (`onClose`, `onSelect`, `onDelete`)
- 컴포넌트 내부 핸들러: `handle[Action]` (`handleClose`, `handleSelect`)

---

### Naming Conventions

- **컴포넌트**: PascalCase (`MonitorCard`, `PriceChart`)
- **파일**: PascalCase (컴포넌트), camelCase (유틸/훅)
- **타입/인터페이스**: `I` prefix (`IMonitorData`, `ISnapshotInsert`)
- **Supabase 자동 생성 타입**: `src/types/database.types.ts` 활용
- **상수**: UPPER_SNAKE_CASE (`MAX_SNAPSHOT_AGE_DAYS`)

---

### React Performance Optimization

- `useCallback`: 자식 컴포넌트 prop 핸들러, `useEffect` 의존성 함수에만 사용
- `useMemo`: `filter`, `reduce`, `sort` 등 반복 비용이 있는 계산에만 사용
- 단순 `onChange` / `onClick`은 JSX 인라인 처리

```typescript
// ✅ useCallback 필요 (자식 prop 전달)
const handleDelete = useCallback(async (id: string) => {
  await deleteMonitor(id);
  router.refresh();
}, [router]);
<MonitorCard onDelete={handleDelete} />

// ✅ 단순 핸들러는 인라인
<input onChange={(e) => setKeyword(e.target.value)} />

// ✅ useMemo — 필터링 계산
const hotDeals = useMemo(
  () => snapshots.filter(s => s.status === '판매중' && s.price <= targetPrice),
  [snapshots, targetPrice]
);
```

---

### Separation of Concerns

3계층 분리: **UI (Component)** → **Logic (Hook)** → **Data (Action/API)**

- Supabase CRUD → `src/actions/` (Server Actions)
- 비즈니스 로직 → `src/hooks/` 커스텀 훅
- 컴포넌트 → 렌더링만 담당

```typescript
// src/hooks/useMonitorDetail.ts — 비즈니스 로직
export function useMonitorDetail(monitorId: string) {
  const [snapshots, setSnapshots] = useState<ISnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndCrawl = useCallback(async () => {
    setIsLoading(true);
    // 1. 크롤링 트리거
    await fetch(`/api/crawl/joonggonara`, {
      method: "POST",
      body: JSON.stringify({ monitorId }),
    });
    // 2. DB에서 최신 데이터 로드
    const data = await getSnapshots(monitorId);
    setSnapshots(data);
    setIsLoading(false);
  }, [monitorId]);

  return { snapshots, isLoading, refetch: fetchAndCrawl };
}
```

---

## Domain Glossary

| 용어               | 설명                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| `monitor`          | 사용자가 등록한 검색어 트래킹 단위 (`user_monitors` 레코드 1건)        |
| `snapshot`         | 크롤링으로 수집된 시세 데이터 1건 (`price_snapshots` 레코드)           |
| `hotDeal`          | `price <= target_price` AND `status === '판매중'` 조건을 충족하는 매물 |
| `excludedKeywords` | 필터링 제외 키워드 배열 (`text[]`), 제목에 포함 시 스냅샷 배제         |
| `platform`         | 중고나라(`joonggonara`) / 번개장터(`bunjang`) / 수동입력(`manual`)     |
| `targetPrice`      | 사용자 설정 적정가 — Recharts `ReferenceLine` 및 hotDeal 판별 기준     |
| `alertPrice`       | 알림 기준 가격 — 향후 카카오 알림 연동 예정                            |
| `category`         | 현재 고정값: `시계`, `슈프림`                                          |

---

## 🔴 Playwriter E2E Testing — MANDATORY

기능 수정 후 반드시 Playwriter로 테스트 후 완료 처리. 생략 불가.

```bash
# 1. 개발 서버 시작
npm run dev

# 2. 대시보드 진입 확인
playwriter -s 1 -e "
await page.goto('http://localhost:3005');
await page.waitForLoadState('domcontentloaded');
console.log('URL:', page.url());
"

# 3. 검색어 등록 모달 플로우 테스트
playwriter -s 1 -e "
await page.click('text=검색어 등록');
await page.waitForTimeout(500);
const dialog = await page.locator('[role=\"dialog\"]').count();
console.log('Dialog opened:', dialog > 0 ? '✅ PASS' : '❌ FAIL');
"

# 4. 상세 페이지 + 그래프 렌더링 확인
playwriter -s 1 -e "
await page.goto('http://localhost:3000/monitor/[monitor-id]');
await page.waitForTimeout(2000);
const chart = await page.locator('.recharts-wrapper').count();
console.log('Chart rendered:', chart > 0 ? '✅ PASS' : '❌ FAIL');
const hasError = await page.locator('text=Server Error').count();
console.log('No errors:', hasError === 0 ? '✅ PASS' : '❌ FAIL');
"

# 5. 스크린샷 저장 (MANDATORY)
playwriter -s 1 -e "
await page.screenshot({ path: 'playwriter-screenshots/dashboard-$(date +%Y%m%d-%H%M%S).png' });
console.log('✅ Screenshot saved!');
"
```

**테스트 체크리스트**:

- [ ] 대시보드 접속 및 모니터 카드 렌더링
- [ ] 검색어 등록 Dialog 정상 작동
- [ ] 상세 페이지 Recharts 그래프 렌더링
- [ ] Supabase 데이터 CRUD (생성/조회)
- [ ] 크롤링 API Route 응답 확인 (`/api/crawl/joonggonara`)
- [ ] hotDeals 섹션 표시 조건 확인
- [ ] 브라우저 콘솔 에러 없음

**Skip 조건** (드묾): 설정/문서 파일만 변경, UI 미영향 의존성 업데이트
