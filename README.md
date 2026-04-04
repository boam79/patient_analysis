# PDR Dashboard v4.4.0

**Patient Data Review Dashboard** - 환자 데이터 분석 및 재방문 패턴 시각화 대시보드

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 목차
- [프로젝트 개요](#-프로젝트-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [배포](#-배포)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 일정](#-개발-일정)
- [기여](#-기여)
- [라이선스](#-라이선스)

---

## 🎯 프로젝트 개요

PDR Dashboard는 의료 데이터 분석을 위한 최신 웹 기반 대시보드입니다. 환자의 재방문 패턴을 분석하고, 질병 및 수술 데이터를 시각화하여 의료 의사결정을 지원합니다.

### 핵심 가치
- ✅ **로컬 데이터 처리**: 브라우저 내에서 모든 데이터 분석 수행 (보안)
- ✅ **PHI 최소화**: Protected Health Information 보호
- ✅ **고성능**: Web Worker, 가상화, 메모이제이션
- ✅ **확장 가능**: 모듈식 아키텍처

---

## ✨ 주요 기능

### 1. 데이터 관리
- 📁 **CSV/Excel 파일 업로드** - 드래그 앤 드롭 지원
- 🔄 **DuckDB WASM** - 브라우저 내 SQL 처리
- 💾 **IndexedDB** - 로컬 캐싱 및 매핑 테이블

### 2. 데이터 시각화
- 📊 **Recharts** - 인터랙티브 차트 (Bar, Line, Area, Scatter)
- 🗺️ **OpenStreetMap + Leaflet.js** - 지도 시각화
- 🔥 **Heatmap** - 환자 분포 히트맵
- 🏥 **H3 Geospatial** - 위치 익명화 (0.1km² 해상도)

### 3. 분석 기능
- 🔍 **4가지 분석 축**
  - 재방문 분석 (Recurrence Analysis)
  - 공간 분석 (Spatial Analysis)
  - 질병 분석 (Disease Analysis)
  - 수술 분석 (Surgery Analysis)
- 🎛️ **9가지 필터** - 기간, 윈도우, 질병, 수술, 연령, 성별, 지역 등
- 🔗 **차트-지도 인터랙션** - 양방향 데이터 연동
- 💾 **데이터 영속성** - localStorage 기반 자동 저장 (새로고침 후에도 유지)
- 📊 **실시간 데이터 연동** - 업로드 데이터 즉시 모든 차트/지도 반영

### 4. 보고서
- 📄 **CSV 내보내기** - 필터링된 데이터 다운로드
- 🖼️ **PNG 캡처** - 차트 이미지 저장
- 📑 **PDF 보고서** - 종합 분석 보고서 생성

### 5. 성능 최적화
- ⚡ **React.memo** - 불필요한 리렌더링 방지 (85% 향상)
- 🧵 **Web Worker** - 백그라운드 데이터 처리
- 🎬 **react-window** - 대용량 테이블 가상화 (98% 향상)
- 📦 **번들 최적화** - 코드 스플리팅, 트리 쉐이킹 (28% 감소)

### 6. 보안
- 🔐 **Next-Auth v5** - 사용자 인증
- 🛡️ **RBAC** - 역할 기반 권한 관리
- 🔒 **보안 헤더** - HSTS, CSP, XSS Protection
- 🚦 **Rate Limiting** - API 요청 제한

### 7. 최근 업데이트 (2024-11-25)
- ♻️ **실시간 필터 반영 개선**: 재방문 윈도우(30/90/180일)와 수술 필터가 KPI·차트·지도·테이블에 즉시 적용되도록 로직 고도화
- 🧠 **재방문 판별 고도화**: 환자별 방문 간격을 윈도우 기준으로 계산해 Boundary/Boxplot/Trend 지표 정밀도 향상
- 🔍 **필터 조합 안정성 확보**: 질병·수술·지역·연령·성별·기간 필터를 동시에 적용해도 일관된 결과 보장

### 8. 추가 업데이트 (2024-12-02)
- 🧾 **제작자(Producer) 페이지 추가**: `/admin` 경로에 사용자 승인, 역할 기반 권한(RBAC), IP 접근 로그, 감사 로그, 시스템 통계/모니터링/유지보수 화면 구현 (Supabase 연동)
- 📈 **경영·마케팅 전략 분석 페이지**: `/dashboard/strategy` 경로에 경영 대시보드, 환자 유입/유지, 지역별 시장, 질병·수술 전략, 고객 세그먼트, 트렌드, 예측 분석 탭 추가
- 🧪 **전략 분석 샘플 데이터 지원**: 실제 데이터를 업로드하지 않아도 대표 패턴을 볼 수 있도록 `SAMPLE_PATIENT_DATA` 기반 샘플 전략 분석 제공
- 📦 **대용량 데이터(50,000행) 업로드 최적화**: `rawData`는 메모리에만 유지하고, 통계/가공 데이터만 localStorage에 저장하여 브라우저 저장소 한도 초과 문제 해결
- ⚙️ **공통 필터 유틸 도입**: `filterPatients` 유틸리티를 도입해 대시보드와 전략 분석 페이지가 동일한 환자 필터 로직을 공유하도록 리팩터링 (중복 연산 감소, 유지보수성 향상)
- 🚀 **업로드 처리 속도 개선**: `setRawData`에서 불필요한 `JSON.stringify` 기반 용량 계산을 제거해 대용량 CSV 업로드 시 초기 처리 시간을 단축
- 🌍 **국가별 IP 접근 통계 추가**: `/admin/statistics` 페이지에 국가별 Top 10 접근 통계 추가 (바 차트, 파이 차트, 상세 목록) - IP 로그의 국가 정보를 활용한 접근 패턴 분석

### 9. 차트 개선 (2024-12-02)
- 📊 **연령 피라미드 차트 전면 개선**: 10가지 관점에서 체계적 분석 및 최적화
  - **데이터 표시 문제 해결**: stackId 제거하여 남성/여성 바가 독립적으로 표시되도록 수정
  - **대칭적 시각화**: 남성 바(왼쪽, 음수)와 여성 바(오른쪽, 양수)가 중앙 기준선을 중심으로 완벽하게 대칭 표시
  - **색상 시스템 통일**: 테마 시스템과 일관성 유지 (남성: Blue #3b82f6, 여성: Pink #ec4899)
  - **향상된 사용자 경험**: 커스텀 툴팁에 상세 정보(명수, 비율, 합계) 표시
  - **접근성 개선**: ARIA 레이블 및 시맨틱 HTML 구조 적용
  - **성능 최적화**: useMemo 및 memo를 활용한 불필요한 재계산 방지
  - **에러 처리 강화**: 빈 데이터 처리 및 null/undefined 방어 로직 추가
  - **Recharts 라이브러리 최적화**: ReferenceLine, Cell 컴포넌트 활용

### 10. 경영 인사이트 시스템 개선 (2024-12-27)
- 💡 **경영 인사이트 컴포넌트 분리**: `ManagementInsights` 컴포넌트를 독립 컴포넌트로 분리하여 필터 섹션 바로 아래에 배치 (모든 탭에서 공통 표시)
- 🎯 **체계적인 인사이트 시스템**: 카테고리(warning/info/success) 및 우선순위(high/medium/low) 기반 인사이트 분류 및 자동 정렬
- 📊 **다양한 인사이트 제공**: 재방문율, 성장률, 환자당 평균 방문, 시장 집중도, 질병 전략, 수술률, 신규 환자 비율 등 7가지 인사이트 유형
- ✅ **구체적인 권장사항**: 각 인사이트에 맞춤형 권장사항 및 실행 가능한 액션 아이템 제공
- 🎨 **2열 그리드 레이아웃**: 경영 인사이트를 2열 그리드로 배치하여 화면 공간 효율성 향상 (모바일: 1열, 데스크톱: 2열)
- 🔧 **전략 분석 페이지 UI 개선**: 전략 분석 페이지에서 필터 섹션 제거하여 경영 인사이트가 더욱 눈에 띄도록 레이아웃 최적화

---

### 11. 통계 기반 경영 인사이트 고도화 v2.1 (2025-01-21)
- 🇰🇷 **대한민국 의료 통계 기반 벤치마크 적용**: 가상 데이터 대신 실제 한국 의료 통계 활용
  - 재방문율: 의원급 81%, 피부과/성형외과 66.1% (메디게이트 설문, 중랑구 파일럿 연구)
  - 외래방문: 한국인 1인당 연간 18.0회, 월 1.5회 (보건복지부/OECD 2023)
  - 성장률: 정상기 0.5~3%, 팬데믹 -12.9% (보건복지부 2016-2022)
  - 만성질환: 고혈압 COC 0.81, 복약순응률 73.3% (국민건강보험공단)
  - NPS: 재이용의향 32~35점 (화순전남대학교병원)
- 📈 **통계 기반 동적 임계값**: Z-Score, 표준편차 기반 동적 임계값 적용
  - Z-Score 기반 이상 탐지: |Z| > 3 (상위/하위 0.135%), |Z| > 2 (상위/하위 2.275%)
  - 한국 의료 벤치마크 대비 상대적 위치 표시
- 📊 **선형 회귀 기반 트렌드 분석**: 최근 6개월 데이터를 기반으로 상승/하락 추세 및 강도 자동 감지
  - 트렌드 방향: increasing / decreasing / stable
  - 트렌드 강도: strong (>15%) / moderate (10-15%) / weak (<10%)
- 🎯 **허핀달-허쉬만 지수(HHI)**: 공정거래위원회 기준 적용
  - HHI < 1000: 경쟁적 시장
  - HHI 1000~1800: 중간 집중
  - HHI > 2500: 고집중 시장
- 💡 **통계적 근거 명시**: 각 인사이트에 한국 통계 출처 및 Z-Score 표시
- 🔢 **신뢰도 지표**: 데이터 포인트 수와 분산 기반 신뢰도(0-100%) 제공
- 🚨 **새로운 카테고리**: 기존 warning/info/success에 critical 카테고리 추가
- 📐 **통계 유틸리티 라이브러리**: `lib/utils/statistical-insights.ts` 신규 생성
  - 기본 통계: `calculateMean`, `calculateStdDev`, `calculateZScore`, `calculateMedian`, `calculatePercentile`
  - IQR 기반 이상치 탐지: `calculateIQR`, `detectOutliersByIQR`
  - 트렌드 분석: `analyzeTrend` (선형 회귀)
  - 동적 임계값: `calculateDynamicThresholds`
  - 이동평균: `calculateMovingAverage`
  - 비교 분석: `compareWithBaseline`
- 🔒 **프라이버시 보호**: AI API 연동 없이 클라이언트 사이드 순수 통계 분석으로 데이터 프라이버시 보장
- 📋 **한국 의료 벤치마크 출처**:
  - 보건복지부/OECD Health Statistics 2023
  - 건강보험심사평가원(HIRA) 우울증 외래 적정성 평가
  - 국민건강보험공단 만성질환 연구
  - 공정거래위원회 HHI 시장집중도 기준
  - 화순전남대학교병원 NPS 조사
  - 메디게이트 피부과/성형외과 설문조사
  - BMC Health Services Research 진료시간 연구

---

### 12. 보안·성능·코드 품질 고도화 v4.3.0 (2026-04-04)

#### 보안 강화
- 🔐 **Service Role Key 보안 수정**: `SUPABASE_SERVICE_ROLE_KEY` 미설정 시 ANON_KEY 폴백 없이 즉시 오류 발생 (기존 폴백 시 RLS에 의해 silent fail 발생)
- 🛡️ **공통 관리자 인증 헬퍼 도입**: `lib/admin-auth.ts` — 모든 Server Action에 반복되던 ADMIN 인증 체크를 `requireAdminAuth()` 함수로 통합

#### 성능 최적화
- ⚡ **DB 레벨 집계 RPC 함수 추가**: `supabase/migrations/20260404_ip_stats_rpc.sql` — `get_top_ips`, `get_hourly_stats`, `get_path_stats`, `get_country_stats`, `cleanup_old_ip_logs` 5개 RPC 함수 정의. 기존 10,000건 풀스캔 후 JS 집계 대신 DB GROUP BY로 처리 (RPC 미설치 시 JS 집계로 자동 폴백)
- 🗺️ **IP Geolocation 캐싱 도입**: 동일 IP 결과 1시간 인메모리 캐싱, 오류 시 5분 단기 캐싱 → ip-api.com 분당 45회 제한 대응. 3초 타임아웃 적용
- 🔢 **IP 범위 체크 간소화**: `172.16.x` ~ `172.31.x` 각각 16개 `startsWith` → CIDR `172.16/12` 수식으로 통합

#### 기능 완성
- 🌍 **국가별 통계 UI 완성**: 기존에 데이터 로딩만 되고 UI가 없던 `countryStats`에 수평 바 차트(접근수 + 고유IP 병렬) + 상세 목록 카드 추가
- 🚨 **이상 탐지 로직 고도화**: 기존 "초당 10회 (1시간 36,000회 이상)" 기준에서 **"분당 1회 초과(1시간 60회) + 5분 내 30회 급증"** 이중 탐지로 개선. severity(고위험/중위험) 구분 배지 추가
- 📤 **IP 로그 내보내기 개선**: 날짜 범위 필수화 및 상한 10,000건 → 50,000건으로 확장

#### 코드 품질
- 🧹 **프로덕션 console.log 전량 제거**: `actions.ts`, `ip-statistics-dashboard.tsx` 디버그 로그 정리
- 🔄 **데이터 로딩 안정화**: `Promise.allSettled` 적용으로 일부 통계 API 실패 시에도 나머지 데이터 정상 표시
- 📝 **auth.config.ts 정리**: 실질적으로 동작하지 않던 NextAuth 콜백 명확화, Supabase Auth 전환 완료 명시
- 🔧 **middleware.ts 수정**: `status_code: 200` 하드코딩 → `null` (미들웨어는 응답 전에 실행되므로 실제 코드 알 수 없음)

#### IP 로그 TTL 정책 (권고)
- Supabase Scheduled Functions에서 `cleanup_old_ip_logs(90)` 주기 실행 권고 (90일 이상 로그 자동 삭제)

---

### 13. 데이터 분석 전면 고도화 v4.4.0 (2026-04-04)

#### 버그 수정 (데이터 정합성)
- 🐛 **환자 식별자 단일화**: `lib/utils/patient-identity.ts` 신규 생성 — `patient_id` → 이름+생년월일 → 이름+주소 우선순위 기반 단일 식별자 정책 적용. 기존 파일마다 `name|address` / `patient_id` 혼용으로 탭별 지표가 달랐던 문제 해결
- 🐛 **수술 산점도 난수 재방문율 제거**: `Math.random()` 기반 임시값 → 수술 환자 방문 기록 기반 실제 재방문율 계산으로 교체
- 🐛 **월별 트렌드 연도 분리**: `1월` 형식(연도 미구분) → `2024년 1월` 형식(YYYY-MM 기반)으로 변경. 복수 연도 데이터에서 월별 합산 왜곡 해결
- 🐛 **지도 랜덤 좌표 제거**: 미매칭 지역에 랜덤 좌표 대신 null 반환 → 지도에서 제외 처리로 변경
- 🐛 **박스플롯 사분위 정확도 개선**: 인덱스 기반 단순 슬라이싱 → 선형 보간(Linear Interpolation) 방식으로 변경

#### 신규 분석 탭 6개 추가 (`/dashboard/strategy`)
- 🔄 **코호트 보유율 분석** (`components/strategy/cohort-analysis.tsx`): 첫 방문 월 기준 이후 N개월 재방문율 히트맵. 1/3/6개월 평균 보유율 요약 카드 포함
- ⚠️ **RFM 이탈 위험도 분석** (`components/strategy/rfm-analysis.tsx`): Recency×Frequency 5분위 점수화 → 이탈 위험/관심 필요/충성/신규 4단계 분류. 환자명 마스킹 처리, 세그먼트별 권고 액션 제공
- 🔗 **질병-수술 연관 분석** (`components/strategy/association-analysis.tsx`): Support / Confidence / Lift 지표 계산. Lift ≥ 1.5 강한 연관성 강조, Top 10 바 차트 + 상세 테이블
- ☀️ **계절성 지수 및 예측** (`components/strategy/seasonal-forecast.tsx`): 월별 계절성 지수(100 기준) + 지수 평활법(α=0.3) 기반 3개월 예측 + 95% 신뢰구간 차트. 계절 집중 질환 Top 8
- 🚨 **시계열 이상 탐지** (`components/strategy/anomaly-detection.tsx`): Z-Score 기반 월별 방문 급증/급감 탐지(|Z| ≥ 2σ). 3개월 이동평균 + Z-Score 오버레이 차트. 질환별 이상 탐지 테이블
- 🗺️ **환자 여정 분석** (`components/strategy/patient-journey.tsx`): 질환 → 수술 여부 → 보유 상태(충성/이탈위험/신규) 흐름도. 자동 인사이트(수술 후 충성 비율, 비수술 이탈 위험 비율) 제공

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (with persist middleware)
- **Charts**: Recharts
- **Maps**: Leaflet.js + OpenStreetMap + Leaflet.heat
- **Icons**: Lucide React
- **File Upload**: Drag & Drop with validation

### Backend
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: Next-Auth v5
- **Data Processing**: DuckDB WASM
- **File Parsing**: PapaParse, XLSX

### DevOps
- **Containerization**: Docker + docker-compose
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel / Docker
- **Reverse Proxy**: Nginx
- **Monitoring**: Health Check API

### Performance & Storage
- **Caching**: LRU Cache, IndexedDB
- **Optimization**: React.memo, useMemo, useCallback
- **Virtualization**: react-window
- **Background Processing**: Web Worker
- **Bundle Analysis**: @next/bundle-analyzer

### Statistical Analysis (v4.2.1 신규)
- **통계 라이브러리**: `lib/utils/statistical-insights.ts` (자체 개발)
- **분석 기법**: Z-Score, 표준편차, IQR, 선형 회귀, 이동평균, HHI
- **벤치마크**: 대한민국 의료 통계 (HIRA, 보건복지부, OECD, 공정거래위원회)
- **프라이버시**: AI API 미사용, 클라이언트 사이드 순수 통계 분석
- **Client Storage**: localStorage (Zustand persist)
- **File Processing**: PapaParse (CSV), XLSX (Excel)

---

## 🚀 시작하기

### 필수 조건
- Node.js 20+
- PostgreSQL 16+ (또는 Docker)
- npm 또는 yarn

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/pdr-dashboard.git
cd pdr-dashboard

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 값 설정

# 4. 데이터베이스 마이그레이션
npx prisma migrate dev

# 5. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

---

## 📦 배포

### Docker Compose (권장)

```bash
# 1. 환경 변수 설정
cp .env.example .env

# 2. 빌드 및 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f

# 4. 중지
docker-compose down
```

### Vercel (클라우드)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 배포
vercel

# 3. 프로덕션 배포
vercel --prod
```

### 수동 Docker 빌드

```bash
# 이미지 빌드
docker build -t pdr-dashboard:latest .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  pdr-dashboard:latest
```

---

## 📁 프로젝트 구조

```
Patient_Analysis/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 페이지
│   ├── api/                 # API 라우트
│   ├── dashboard/           # 대시보드 페이지
│   └── layout.tsx           # 루트 레이아웃
├── components/              # React 컴포넌트
│   ├── charts/              # 차트 컴포넌트
│   ├── export/              # 내보내기 컴포넌트
│   ├── filter/              # 필터 컴포넌트
│   ├── layout/              # 레이아웃 컴포넌트
│   ├── map/                 # 지도 컴포넌트
│   ├── strategy/            # 전략 분석 컴포넌트 (v4.2.1)
│   │   ├── management-insights.tsx  # 경영 인사이트 (한국 벤치마크)
│   │   └── executive-dashboard.tsx  # 경영 대시보드
│   ├── tables/              # 테이블 컴포넌트
│   ├── ui/                  # UI 기본 컴포넌트 (shadcn/ui)
│   └── upload/              # 파일 업로드 컴포넌트
├── lib/                     # 유틸리티 함수
│   ├── auth.ts              # NextAuth 설정
│   ├── duckdb.ts            # DuckDB 초기화
│   ├── duckdb-worker.ts     # DuckDB Web Worker
│   ├── export-utils.ts      # 내보내기 유틸
│   ├── geocoding-batch.ts   # 지오코딩 배치
│   ├── indexeddb.ts         # IndexedDB 관리
│   ├── performance-utils.ts # 성능 유틸
│   ├── preprocessor.ts      # 데이터 전처리
│   ├── rbac.ts              # RBAC 유틸
│   ├── utils.ts             # 공통 유틸
│   └── utils/               # 유틸리티 서브모듈
│       ├── date-helpers.ts      # 날짜 유틸
│       ├── patient-filters.ts   # 환자 필터 유틸
│       └── statistical-insights.ts # 통계 분석 (v4.2.1 신규)
├── hooks/                   # 커스텀 훅
│   ├── use-debounce.ts
│   ├── use-duckdb-worker.ts
│   ├── use-intersection-observer.ts
│   └── use-toast.ts
├── stores/                  # Zustand 스토어
│   ├── data-store.ts        # 데이터 상태 관리 (with persist)
│   └── filter-store.ts      # 필터 상태 관리 (with persist)
├── types/                   # TypeScript 타입
│   └── react-window.d.ts
├── prisma/                  # Prisma 스키마
│   └── schema.prisma
├── .github/                 # GitHub Actions
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── nginx/                   # Nginx 설정
│   └── nginx.conf
├── Dockerfile               # Docker 이미지
├── docker-compose.yml       # Docker Compose 설정
├── vercel.json              # Vercel 배포 설정
├── next.config.ts           # Next.js 설정
├── tailwind.config.ts       # Tailwind 설정
├── tsconfig.json            # TypeScript 설정
└── package.json             # 프로젝트 의존성
```

---

## 📅 개발 일정

### 완료된 Phase (총 9개)

| Phase | 작업 내용 | 예상 시간 | 실제 시간 | 효율 |
|-------|----------|----------|----------|------|
| Phase 1 | 프로젝트 초기 설정 | 3.5h | 2h | 175% |
| Phase 2 | 인증 시스템 구축 | 8h | 6h | 133% |
| Phase 3 | 데이터 업로드 및 전처리 | 6h | 4h | 150% |
| Phase 4 | 지오코딩 및 지도 | 5.5h | 2h | 275% |
| Phase 5 | 데이터 분석 및 시각화 | 8.5h | 3h | 283% |
| Phase 6 | 필터링 및 인터랙션 | 7.5h | 2h | 375% |
| Phase 7 | 보고서 및 내보내기 | 6h | 1.5h | 400% |
| Phase 8 | 성능 최적화 및 테스트 | 10h | 2.5h | 400% |
| Phase 9 | 실전 배포 준비 | 6h | 1.5h | 400% |
| **총합** | | **61h** | **24.5h** | **249%** |

---

## 🎨 스크린샷

### 대시보드 메인
![Dashboard Main](docs/screenshots/dashboard-main.png)

### 지도 분석
![Map Analysis](docs/screenshots/map-analysis.png)

### 차트 분석
![Chart Analysis](docs/screenshots/chart-analysis.png)

---

## 📊 성능 지표

### 렌더링 성능
- 차트 클릭 응답: **15ms** (85% 향상)
- 대용량 테이블 렌더링: **< 0.1초** (98% 향상)
- 필터 적용 응답: **즉시** (useMemo 최적화)

### 데이터 처리
- 10,000개 레코드 업로드: **< 2초**
- 10,000개 레코드 분석: **< 1초**
- localStorage 저장/복원: **< 0.5초**
- UI 블로킹: **0ms** (Web Worker)

### 번들 크기
- First Load JS: **102KB** (공유 청크)
- Dashboard: **468KB** (총 로드)
- Map 페이지: **128KB** (총 로드)
- Charts 페이지: **235KB** (총 로드)

### 데이터 영속성
- localStorage 용량: **최대 10MB** (브라우저 제한)
- 데이터 손실 방지: **새로고침 후에도 유지**
- 자동 저장: **업로드/필터 변경 시**

### Lighthouse 점수
- Performance: **95+**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**

---

## 🧪 테스트

```bash
# 타입 체크
npm run type-check

# Linting
npm run lint

# 빌드 테스트
npm run build

# 번들 분석
npm run analyze

# 더미 데이터 생성 (테스트용)
npm run generate-data
# → public/dummy-data.csv (10,000 레코드)
```

### 데이터 형식
업로드할 CSV 파일은 다음 컬럼을 포함해야 합니다:

```csv
환자ID,방문ID,이름,생년월일,성별,주소,방문일자,질병코드,질병명,수술코드,수술명,진료비,입원일수
```

**지원 형식**:
- 생년월일: `YYYYMMDD` (예: 19850315)
- 성별: `M/F`, `남/여`, `남성/여성`, `1/2`
- 주소: 시/도 시/군/구 포함 (예: "서울특별시 강남구 테헤란로")

**자동 처리**:
- ✅ 나이 자동 계산
- ✅ 성별 정규화
- ✅ 지역 자동 추출 (시/도 + 시/군/구)
- ✅ 좌표 샘플 데이터 제공

---

## 🎯 주요 구현 내용

### 데이터 업로드 & 처리
- ✅ CSV/Excel 파일 드래그 앤 드롭 업로드
- ✅ 10,000개 레코드 실시간 처리
- ✅ 생년월일 → 나이 자동 계산 (YYYYMMDD 형식 지원)
- ✅ 주소 → 지역 자동 추출 (시/도 + 시/군/구)
- ✅ 성별 정규화 (M/F/남/여/1/2 → 남성/여성)
- ✅ localStorage 자동 저장 (새로고침 후에도 유지)

### 대시보드 메인
- ✅ KPI 카드 4개 (총 환자수, 재방문율, 평균 간격, 총 수술 건수)
- ✅ 필터 패널 (질병 추가/지역 추가 버튼)
- ✅ Top 10 질병 차트 (실시간 데이터)
- ✅ 연령 피라미드 (남성/여성 분포) - 대칭적 시각화, 접근성 개선, 성능 최적화
- ✅ 공간 분석 지도 (마커 모드)
- ✅ 하단 4개 탭 (Trend/Boundary/Table/Surgery)
- ✅ 데이터 테이블 (정렬/검색)
- ✅ 실시간 필터 적용

### 지도 분석 페이지
- ✅ 4개 탭 (신환/재환/환자수/재방문율)
- ✅ OpenStreetMap + Leaflet.js 통합
- ✅ 마커 기반 지도 표시
- ✅ 지역별 통계 사이드바
- ✅ 실시간 데이터 계산
- ✅ 환자 방문 횟수 기반 신환/재환 분류

### 차트 분석 페이지
- ✅ Top 10 질병 차트 (실시간 데이터)
- ✅ Top 10 수술 차트 (실시간 데이터)
- ✅ 연령 및 성별 분포 피라미드 - 남성/여성 독립 표시, 대칭적 레이아웃, 커스텀 툴팁
- ✅ 월별 재방문율 추세
- ✅ 신규 vs 재방문 환자 차트

### Surgery 섹션 (신규 구현)
- ✅ 수술별 산점도 (평균 연령 vs 재방문율)
- ✅ 수술-질병 연관 매트릭스 (Top 5 x Top 5)
- ✅ 버블 크기로 환자 수 표시
- ✅ 색상 강도로 연관도 표시
- ✅ 실시간 데이터 계산

### 필터 시스템
- ✅ 기간 필터 (시작일 ~ 종료일)
- ✅ 재방문 윈도우 (30/90/180일)
- ✅ 연령대 필터 (Badge 클릭)
- ✅ 성별 필터 (남성/여성)
- ✅ 질병 선택 (Top 20, Badge 토글)
- ✅ 지역 선택 (Top 30, Badge 토글)
- ✅ 실시간 필터 적용 (KPI/차트/지도 모두 반영)
- ✅ 필터 초기화 버튼

### UI/UX 개선
- ✅ 헤더 데이터 업로드 버튼 (우측 상단)
- ✅ 메인 타이틀 클릭 → 초기화 & 업로드 페이지 이동
- ✅ 데이터 로드 상태 Badge (X명 로드됨)
- ✅ 푸터 (제작자: Boam79, 문의사항 이메일)
- ✅ 초기 화면 = 업로드 페이지
- ✅ 레이아웃 여백 최적화
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)

### 데이터 연동
- ✅ 대시보드: 실제 데이터 반영 ✓
- ✅ 지도 분석: 실제 데이터 반영 ✓
- ✅ 차트 분석: 실제 데이터 반영 ✓
- ✅ Surgery 섹션: 실제 데이터 반영 ✓
- ✅ 필터 패널: 동적 옵션 생성 ✓
- ✅ localStorage 영속성 ✓

### 배포
- ✅ Vercel 배포 완료
- ✅ GitHub Actions CI/CD
- ✅ 보안 헤더 설정
- ✅ Health Check API
- ✅ 한국 리전 (icn1) 최적화

---

## 🤝 기여

프로젝트에 기여하고 싶으시다면:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 📞 연락처

- **프로젝트 링크**: [https://github.com/boam79/patient_analysis](https://github.com/boam79/patient_analysis)
- **배포 사이트**: [https://patient-analysis-phi.vercel.app](https://patient-analysis-phi.vercel.app)
- **이슈 리포트**: [https://github.com/boam79/patient_analysis/issues](https://github.com/boam79/patient_analysis/issues)
- **제작자**: Boam79
- **문의사항**: ckadltmfxhrxhrxhr@gmail.com

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [DuckDB WASM](https://duckdb.org/docs/api/wasm)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet.js](https://leafletjs.com/)
- [Recharts](https://recharts.org/)

---

## 📚 문서

핵심 문서만 빠르게 보고 싶다면 다음 3가지만 참고하면 됩니다:

- [제품 설계 문서 (PDR v4.1)](docs/PDR_Dashboard_v4.1_Final.md) — 전체 시스템·기능 설계
- [Phase 8 완료 보고서](docs/PHASE8_COMPLETE.md) — 성능 최적화 & 테스트 정리
- [최종 배포 요약](docs/FINAL_DEPLOYMENT_SUMMARY.md) — 실제 배포 결과 요약

그 외 세부 문서(Phase별 완료 보고서, 배포 가이드, UI 부록 등)는  
`docs/` 폴더 내에서 필요할 때만 찾아보는 참고용으로 유지합니다.

---

<div align="center">

**Made with ❤️ by Boam79**

⭐ Star us on GitHub — it helps!

[Report Bug](https://github.com/boam79/patient_analysis/issues) · [Request Feature](https://github.com/boam79/patient_analysis/issues) · [View Demo](https://patient-analysis-phi.vercel.app)

</div>
