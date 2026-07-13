# 병원 CRM v5.4.0

**병원 CRM** — 방문·질병·수술 데이터 분석 및 경영·마케팅 인사이트

Next.js React TypeScript License

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

병원 CRM은 의료 기관의 방문·질병·수술 데이터를 분석하는 웹 기반 도구입니다. 재방문 패턴과 지역·시기별 트렌드를 시각화하여 운영 및 진료 품질 개선에 활용할 수 있습니다.

### 핵심 가치

- ✅ **로컬 데이터 처리**: 브라우저 내에서 모든 데이터 분석 수행 (보안)
- ✅ **PHI 최소화**: Protected Health Information 보호
- ✅ **고성능**: Web Worker, 가상화, 메모이제이션
- ✅ **확장 가능**: 모듈식 아키텍처

---

## ✨ 주요 기능

### 1. 데이터 관리

- 📁 **CSV/Excel 파일 업로드** - 드래그 앤 드롭 지원
- 🔄 **PapaParse + 클라이언트 집계** - 브라우저 내 데이터 처리
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

- 🔐 **Supabase Auth** - 사용자 인증 (제작자 페이지, RLS 기반)
- 🛡️ **RBAC** - 역할 기반 권한 관리 (`user_profiles.role`, Supabase RLS 정책)
- 🔒 **보안 헤더** - HSTS, X-Frame-Options, X-Content-Type-Options 등 (`next.config.ts`)
- 🧪 **CSP (Report-Only)** - Content-Security-Policy-Report-Only 헤더 도입 (v4.6). 브라우저 콘솔에서 위반 여부 관찰 후 강제 모드 전환 예정
- 🚦 **Rate Limiting (v4.7)** - Supabase 기반 슬라이딩 윈도우로 `/api/log-ip`, `/api/geocode` 등 비인증 API 남용 방지
- 🩹 **에러 트래킹 (v4.7)** - 자체 `error_logs` 테이블로 클라이언트 런타임 에러 수집 (관리자 페이지에서 조회)
- 🔔 **시스템 이상탐지 알림 (v4.7)** - IP 접근 급증 등 이상 패턴을 15분 주기로 점검, Slack 알림 발송 (선택 사항)

### 7. 통계 기반 경영 인사이트 고도화 v2.1 (2025-01-21)

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

### 8. 최근 업데이트 (2025-11-25)

- ♻️ **실시간 필터 반영 개선**: 재방문 윈도우(30/90/180일)와 수술 필터가 KPI·차트·지도·테이블에 즉시 적용되도록 로직 고도화
- 🧠 **재방문 판별 고도화**: 환자별 방문 간격을 윈도우 기준으로 계산해 Boundary/Boxplot/Trend 지표 정밀도 향상
- 🔍 **필터 조합 안정성 확보**: 질병·수술·지역·연령·성별·기간 필터를 동시에 적용해도 일관된 결과 보장

### 9. 추가 업데이트 (2025-12-02)

- 🧾 **제작자(Producer) 페이지 추가**: `/admin` 경로에 사용자 승인, 역할 기반 권한(RBAC), IP 접근 로그, 감사 로그, 시스템 통계/모니터링/유지보수 화면 구현 (Supabase 연동)
- 📈 **경영·마케팅 전략 분석 페이지**: `/dashboard/strategy` 경로에 경영 대시보드, 환자 유입/유지, 지역별 시장, 질병·수술 전략, 고객 세그먼트, 트렌드, 예측 분석 탭 추가
- 🧪 **전략 분석 샘플 데이터 지원**: 실제 데이터를 업로드하지 않아도 대표 패턴을 볼 수 있도록 `SAMPLE_PATIENT_DATA` 기반 샘플 전략 분석 제공
- 📦 **대용량 데이터(50,000행) 업로드 최적화**: `rawData`는 메모리에만 유지하고, 통계/가공 데이터만 localStorage에 저장하여 브라우저 저장소 한도 초과 문제 해결
- ⚙️ **공통 필터 유틸 도입**: `filterPatients` 유틸리티를 도입해 대시보드와 전략 분석 페이지가 동일한 환자 필터 로직을 공유하도록 리팩터링 (중복 연산 감소, 유지보수성 향상)
- 🚀 **업로드 처리 속도 개선**: `setRawData`에서 불필요한 `JSON.stringify` 기반 용량 계산을 제거해 대용량 CSV 업로드 시 초기 처리 시간을 단축
- 🌍 **국가별 IP 접근 통계 추가**: `/admin/statistics` 페이지에 국가별 Top 10 접근 통계 추가 (바 차트, 파이 차트, 상세 목록) - IP 로그의 국가 정보를 활용한 접근 패턴 분석

### 10. 차트 개선 (2025-12-02)

- 📊 **연령 피라미드 차트 전면 개선**: 10가지 관점에서 체계적 분석 및 최적화
  - **데이터 표시 문제 해결**: stackId 제거하여 남성/여성 바가 독립적으로 표시되도록 수정
  - **대칭적 시각화**: 남성 바(왼쪽, 음수)와 여성 바(오른쪽, 양수)가 중앙 기준선을 중심으로 완벽하게 대칭 표시
  - **색상 시스템 통일**: 테마 시스템과 일관성 유지 (남성: Blue #3b82f6, 여성: Pink #ec4899)
  - **향상된 사용자 경험**: 커스텀 툴팁에 상세 정보(명수, 비율, 합계) 표시
  - **접근성 개선**: ARIA 레이블 및 시맨틱 HTML 구조 적용
  - **성능 최적화**: useMemo 및 memo를 활용한 불필요한 재계산 방지
  - **에러 처리 강화**: 빈 데이터 처리 및 null/undefined 방어 로직 추가
  - **Recharts 라이브러리 최적화**: ReferenceLine, Cell 컴포넌트 활용

### 11. 경영 인사이트 시스템 개선 (2025-12-27)

- 💡 **경영 인사이트 컴포넌트 분리**: `ManagementInsights` 컴포넌트를 독립 컴포넌트로 분리하여 필터 섹션 바로 아래에 배치 (모든 탭에서 공통 표시)
- 🎯 **체계적인 인사이트 시스템**: 카테고리(warning/info/success) 및 우선순위(high/medium/low) 기반 인사이트 분류 및 자동 정렬
- 📊 **다양한 인사이트 제공**: 재방문율, 성장률, 환자당 평균 방문, 시장 집중도, 질병 전략, 수술률, 신규 환자 비율 등 7가지 인사이트 유형
- ✅ **구체적인 권장사항**: 각 인사이트에 맞춤형 권장사항 및 실행 가능한 액션 아이템 제공
- 🎨 **2열 그리드 레이아웃**: 경영 인사이트를 2열 그리드로 배치하여 화면 공간 효율성 향상 (모바일: 1열, 데스크톱: 2열)
- 🔧 **전략 분석 페이지 UI 개선**: 전략 분석 페이지에서 필터 섹션 제거하여 경영 인사이트가 더욱 눈에 띄도록 레이아웃 최적화

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

### 14. 경영 인사이트 v3.0 — 척추관절 전문병원 특화 벤치마크 v4.4.1 (2026-04-04)

#### 배경

기존 경영 인사이트가 피부과/성형외과, 의원급, 단일 지역 파일럿 등 **진료과·기관 유형이 다른 출처**를 혼용하는 문제가 발견되어, **보건복지부 인증 척추·관절 전문병원** 기준으로 전면 재작성했습니다.

#### 제거된 부적절한 출처

- ❌ 피부과/성형외과 재진율 66.1% (메디게이트 설문) — 전혀 다른 진료과, 척추관절 기준으로 사용 시 오인 발생
- ❌ 중랑구 파일럿 연구 재진율 81% — 단일 자치구 소규모 연구, 전국 대표성 없음
- ❌ 도시-농촌 -15.2% vs -10.8% — 출처 불명 하드코딩 수치
- ❌ `criticalThreshold -10%` vs 표시 텍스트 `-12.9%` — 코드와 수치 불일치
- ❌ 당뇨 COC 0.76 (추정) — 근거 없는 추정값
- ❌ 화순전남대학교병원 NPS — 단일 공공병원, 민간 전문병원과 성격 상이

#### 새로 적용된 척추관절 전문병원 전용 벤치마크


| 지표           | 기존       | 신규                         | 출처                       |
| ------------ | -------- | -------------------------- | ------------------------ |
| 재방문율 (전체)    | 의원급 66%  | **전문병원 78%**               | HIRA 척추질환 외래 적정성 평가 2023 |
| 재방문율 (수술 환자) | —        | **91%** (1·3·6·12개월 추적 기준) | 보건복지부 전문병원 현황 통계 2023    |
| 재방문율 (보존치료)  | —        | **65%** (6개월 내)            | HIRA 2023                |
| 성장률 정상 범위    | 0.5~3%   | **3~8%** (65세+ 고령화 수요 반영)  | 통계청·고령화연구원 추계 2023       |
| 성장률 경고 기준    | -5%      | **-3%** (전문병원 엄격 기준)       | 국민건강보험공단 통계연보 2023       |
| 수술 적정 비중     | —        | **15~35%** (보존치료 우선 원칙)    | HIRA 척추수술 적정성 평가 2023    |
| 30일 재수술률     | —        | **3% 이하 우수 / 5% 이상 심각**    | HIRA 척추수술 적정성 평가 2023    |
| 합병증 발생률      | —        | **5% 이하 우수**               | 대한척추외과학회 통계 2023         |
| COC (진료지속성)  | 고혈압 0.81 | **척추관절 0.82**              | 국민건강보험공단 COC 분석 2022     |
| HHI 고집중 기준   | 2,500    | **3,000** (광역 진료권 완화)      | 공정거래위원회 + 보건복지부 2023     |


#### 수술 비중 3단계 인사이트 신규 추가

- 🔴 **과다** (35% 초과): HIRA 보존적 치료 선행 프로토콜 점검 권고
- ✅ **적정** (15~35%): 30일 재수술률·합병증률 분기 모니터링 권고
- 🔵 **부족** (15% 미만): 보건복지부 전문병원 인증 연간 수술 건수 충족 여부 확인 권고

#### 적용된 공식 출처

- 건강보험심사평가원(HIRA): 척추질환 외래 적정성 평가 2022~2023, 척추수술 적정성 평가 2023
- 보건복지부: 전문병원 지정·운영 기준 고시 제2023-179호, 전문병원 현황 통계 2023
- 국민건강보험공단: 근골격계 질환(M코드) 진료비 통계 2023, 척추·관절 COC 분석 2022
- 대한척추외과학회: 수술 성공률 및 합병증 통계 2023
- 통계청·고령화연구원: 근골격계 질환 유병률 추계 2023~2030
- 공정거래위원회: HHI 시장집중도 기준
- OECD Health Statistics 2023, BMC Health Services Research 2025 (비교 참고용)

---

### 15. 병원 CRM 브랜딩 및 통계 고도화 v4.5.0 (2026-04-12)

#### 브랜딩·UI

- **앱 표시명**: 헤더·메타데이터·메인 대시보드 타이틀을 **「병원 CRM」**으로 통일 (`components/layout/header.tsx`, `app/layout.tsx`, `app/dashboard/page.tsx`, `package.json`)

#### 통계·분석 (전략 대시보드)

- **코호트**: 셀별 **Wilson 95% 신뢰구간** (호버 툴팁), 범례 문구 보강 (`cohort-analysis.tsx`)
- **이상 탐지(질환×월)**: **Benjamini–Hochberg FDR 15%** 다중검정 보정, **p-value·FDR·Cohen h** 컬럼 추가 (`anomaly-detection.tsx`, `lib/utils/advanced-analysis.ts`)
- **연관 분석**: 질병 내 수술 비율 vs 전체 수술 비율 **Cohen h** 컬럼 (`association-analysis.tsx`)
- **RFM**: 세그먼트 비율에 **Wilson CI** 문구 표시 (`rfm-analysis.tsx`)
- **계절성·예측**: **가법 STL 근사** 분해 차트(추세·계절·잔차) 추가 (`seasonal-forecast.tsx`)
- **신규 탭「고급 통계」** (`components/strategy/advanced-statistics-tab.tsx`): Kaplan–Meier(첫 재방문), 변화점, STL, k-means 산점, 질병 순서 전이, **PSI**(전·후반기 질병 믹스), 결측 요약, **월 고정효과 잔차**, 계층 일관성 비율, 이산 위험표, 분석 파라미터 JSON 스냅샷 다운로드

#### 검증

- `npm run verify:analysis` — `scripts/verify-analysis-golden.ts`에서 Wilson/BH/STL/KM/PSI 등 스모크 검증

#### 전역 명칭 통일 (추가)

- 저장소 전반의 제품 표기를 **「병원 CRM」**으로 정리(로그인·업로드·차트·전략·보내기·관리자 헤더·문서·CI/Docker 주석 등).
- npm 패키지명 `hospital-crm`, Vercel 프로젝트 키 `hospital-crm`, IndexedDB `Hospital_CRM`, Nominatim UA `Hospital-CRM/*`.
- 설계 문서: `docs/병원_CRM_설계문서_v4.1.md`(기존 `PDR_Dashboard_v4.1_Final.md`에서 변경).

---

### 16. 기술 부채 정리 v4.6.0 (2026-07-03)

실측 코드 분석(`docs/01-proposals/TECH_DEBT_AND_ENHANCEMENT_PROPOSAL_v4.6.md`) 기반으로 실사용처가 없는 죽은 코드를 제거하고 테스트/에러 처리/CI를 보강했습니다.

#### 죽은 코드 제거

- **Next-Auth v5 + Prisma + PostgreSQL(자체 호스팅) 인증 스택 완전 제거**: 인증은 이미 Supabase Auth로 전환되어 있었고, `next-auth`/`@auth/prisma-adapter`/`@prisma/client`/`prisma`/`bcryptjs` 패키지와 `auth.config.ts`, `prisma/schema.prisma`, `lib/prisma.ts`, `lib/rbac.ts`(Prisma 의존)가 코드베이스 어디에서도 참조되지 않는 것을 확인 후 삭제
- **DuckDB WASM 파이프라인 제거**: `lib/duckdb.ts`, `lib/duckdb-worker.ts`, `hooks/use-duckdb-worker.ts`가 정의만 되어 있고 실제 호출부가 전혀 없어 제거. 데이터 처리는 이미 PapaParse + 클라이언트 사이드 집계(`stores/data-store.ts`)로 일원화되어 있었음
- `auth.ts.bak`, `middleware.ts.bak` 등 백업 파일 삭제 (v4.6.0 1단계에서 선행 처리)
- Docker/CI 설정에서 위 스택에 종속된 항목 정리: `Dockerfile`(prisma generate 스텝), `docker-compose.yml`(PostgreSQL 컨테이너 및 관련 환경변수), `.env.example`, `.github/workflows/ci.yml`

#### 안정성 강화

- **Next.js 에러 바운더리 신규 도입**: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/dashboard/error.tsx`, `app/admin/error.tsx` — 기존에는 런타임 에러 시 백지 화면이 노출될 수 있었음
- **CSP(Content-Security-Policy-Report-Only) 헤더 도입**: `next.config.ts`에 Report-Only 모드로 우선 적용, 브라우저 콘솔에서 위반 여부 관찰 후 강제 모드 전환 예정
- **CI 파이프라인 복구**: ESLint 설정 파일(`.eslintrc.json`)이 저장소에 없어 `next lint`가 대화형 프롬프트로 멈추며 최근 다수의 CI 실행이 실패해온 것을 확인 후 수정. `Build Application` 잡에 누락되어 있던 Supabase 환경변수도 추가

#### 테스트 자동화 도입

- **Vitest 도입**: 저장소에 자동화 테스트가 전무했던 문제 해결. `lib/utils/patient-identity.ts`(환자 식별자 정책, 재방문 간격 계산), `lib/utils/patient-filters.ts`(다중 필터 조합) 대상 단위 테스트 28건 작성, CI에 통합

#### 참고

- 상세 검증 근거 및 로드맵: `docs/01-proposals/TECH_DEBT_AND_ENHANCEMENT_PROPOSAL_v4.6.md`

---

### 17. 신규 기능 v4.7.0 (2026-07-03)

`TECH_DEBT_AND_ENHANCEMENT_PROPOSAL_v4.6.md`의 3단계(신규 기능) 항목을 구현했습니다. 외부 서비스(Upstash, Sentry 등) 신규 계약 없이 이미 사용 중인 Supabase/Vercel/Slack만으로 구성했습니다.

#### API Rate Limiting

- Supabase 기반 슬라이딩 윈도우 rate limiter 도입(`lib/rate-limit.ts`, `supabase/migrations/20260703_rate_limit.sql`)
- 인증 없이 호출 가능한 `/api/log-ip`(IP당 60회/분), `/api/geocode`(IP당 30회/분, Nominatim 정책 보호 목적 포함)에 적용
- 서버리스 다중 인스턴스 환경에서도 정확히 동작하도록 상태를 Postgres에 저장(인메모리 방식의 한계 회피). RPC 미배포/실패 시 fail-open으로 서비스 가용성 우선

#### 실배치 지오코딩 파이프라인 연결

- `lib/geocoding-batch.ts`를 IndexedDB 캐시 우선 조회 + Nominatim 1req/sec 정책을 준수하는 순차 처리로 재작성 (기존에는 정의만 있고 호출부가 없었음, 이전 병렬 배치 구조는 레이트리밋 정책 위반 소지)
- 업로드 페이지(`app/dashboard/upload/page.tsx`)에 실주소 기반 정밀 지오코딩 선택 옵션 및 진행률 UI 추가. 선택 시 시/군/구 대표 좌표 대신 실좌표 사용

#### 자체 에러 트래킹

- `error_logs` 테이블 신설(ADMIN 전용 RLS)과 `/api/log-error` 수집 엔드포인트 추가
- 기존 4개 에러 바운더리(`app/error.tsx`, `app/global-error.tsx`, `app/dashboard/error.tsx`, `app/admin/error.tsx`)에서 발생 시 `sendBeacon` 우선으로 자동 리포팅 (best-effort, 실패해도 에러 화면에 영향 없음)
- 관리자 페이지에 `/admin/errors` 뷰어 신규 추가

#### 시스템 이상탐지 Slack 알림 (선택)

- `app/admin/logs/actions.ts`의 이상탐지 로직을 `lib/anomaly-detection.ts`로 추출해 관리자 대시보드와 신규 크론이 공유
- `app/api/cron/anomaly-check`가 Vercel Cron으로 실행되어 high severity 이상 접근 탐지 시 Slack Incoming Webhook으로 알림 발송. Vercel Hobby 플랜은 크론이 하루 1회로 제한되어 기본값은 매일 03:00 UTC 실행이며(`vercel.json`), Pro 플랜에서는 분 단위 스케줄로 조정해 근실시간 알림 가능
- `SLACK_WEBHOOK_URL` 미설정 시 감지는 수행하되 알림 발송만 스킵(선택 기능), `system_alerts` 테이블로 동일 IP 중복 알림 방지(30분 윈도우)

#### 참고

- CSP를 Report-Only에서 강제 모드로 전환하는 작업은 운영 데이터 축적 후 진행 예정 (제안서 3단계 마지막 항목)

---

### 18. 전면 UI 개편 Harbor Clinical v5.0.0 (2026-07-11)

- **디자인 토큰**: deep teal primary + cool mist 배경·도트 패턴 (`app/globals.css`)
- **타이포**: Pretendard Variable + SUITE CDN 실로드 (`app/layout.tsx`)
- **랜딩 `/`**: 브랜드 히어로 + CTA (업로드 즉시 리다이렉트 제거)
- **셸**: 이모지 네비 제거, 활성 라우트 인디케이터, 모바일 메뉴, Footer 톤 통일
- **업로드·대시보드·로그인·Admin**: Harbor Clinical 톤 적용, KPI 메트릭 스트립, 유령 컴포넌트 제거
- 제안서: `docs/01-proposals/FRONTEND_DESIGN_OVERHAUL_v5.0.md`

### 19. 분석 차트 고도화·정리 v5.1.0 (2026-07-11)

- 가짜 재방문율 제거, 환자키 `resolvePatientId` 통일, charts 페이지→대시보드 흡수
- 전략 탭 14→7, 지도 히트맵 모드, 월별 공용 집계, 지역↔필터 brushing
- 제안서: `docs/01-proposals/CHART_ANALYSIS_CONSOLIDATION_v5.1.md`

### 20. 지도·전략 UI Analysis Surfaces v5.4.0 (2026-07-12)

- **지도**: 풀블리드 Map Canvas, sticky 통합 툴바, 사이드 통계 레일, 지역 상세 Sheet, 히트맵 범례
- **전략**: Insight Brief(우선 3건+접기), Executive 메트릭 스트립, 가로 스크롤 탭, 섹션 헤더·서브앵커, 지도 딥링크
- Harbor Clinical 토큰 연장 (`.analysis-canvas`, `.metric-strip`, `.insight-row`)
- 제안서: `docs/01-proposals/MAP_STRATEGY_DESIGN_OVERHAUL_v5.4.md`

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

- **Database**: Supabase (PostgreSQL) — 제작자 페이지/인증/로그용
- **Authentication**: Supabase Auth
- **Data Processing**: PapaParse + 클라이언트 사이드 집계 (`stores/data-store.ts`)
- **File Parsing**: PapaParse, XLSX

> ℹ️ **v4.6 변경**: Next-Auth v5 + Prisma + PostgreSQL(자체 호스팅) 인증 스택과 DuckDB WASM 파이프라인은
> 실사용처가 전혀 없는 죽은 코드로 확인되어 완전히 제거되었습니다. 인증/데이터베이스는 Supabase로,
> 데이터 처리는 PapaParse + 클라이언트 사이드 집계로 일원화되었습니다.
> 상세 근거는 `docs/01-proposals/TECH_DEBT_AND_ENHANCEMENT_PROPOSAL_v4.6.md` 참고.

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
- Supabase 프로젝트 (인증/제작자 페이지/로그/rate limiting/에러 로그용)
- npm 또는 yarn
- (선택) Slack Incoming Webhook — 시스템 이상탐지 알림을 받으려면 설정

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/hospital-crm.git
cd hospital-crm

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 Supabase URL/키 등 필요한 값 설정

# 4. 개발 서버 실행
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
docker build -t hospital-crm:latest .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  hospital-crm:latest
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
│   ├── supabase/            # Supabase 클라이언트 (인증/서버/미들웨어)
│   ├── admin-auth.ts        # 관리자 인증 공통 헬퍼
│   ├── alerts.ts            # Slack 알림 헬퍼 (v4.7, 선택 사항)
│   ├── anomaly-detection.ts # IP 접근 이상탐지 공용 로직 (v4.7)
│   ├── error-logging.ts     # 클라이언트 에러 리포팅 헬퍼 (v4.7)
│   ├── export-utils.ts      # 내보내기 유틸
│   ├── geocoding-batch.ts   # 지오코딩 배치 (IndexedDB 캐시 + Nominatim 순차 처리, v4.7)
│   ├── indexeddb.ts         # IndexedDB 관리
│   ├── performance-utils.ts # 성능 유틸
│   ├── preprocessor.ts      # 데이터 전처리
│   ├── rate-limit.ts        # Supabase 기반 API rate limiting (v4.7)
│   ├── utils.ts             # 공통 유틸
│   └── utils/               # 유틸리티 서브모듈
│       ├── date-helpers.ts        # 날짜 유틸
│       ├── patient-identity.ts    # 환자 식별자 정책 (단위 테스트 포함)
│       ├── patient-filters.ts     # 환자 필터 유틸 (단위 테스트 포함)
│       └── statistical-insights.ts # 통계 분석 (v4.2.1 신규)
├── hooks/                   # 커스텀 훅
│   ├── use-debounce.ts
│   ├── use-intersection-observer.ts
│   └── use-toast.ts
├── stores/                  # Zustand 스토어
│   ├── data-store.ts        # 데이터 상태 관리 (with persist)
│   └── filter-store.ts      # 필터 상태 관리 (with persist)
├── types/                   # TypeScript 타입
│   └── react-window.d.ts
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


| Phase   | 작업 내용         | 예상 시간   | 실제 시간     | 효율       |
| ------- | ------------- | ------- | --------- | -------- |
| Phase 1 | 프로젝트 초기 설정    | 3.5h    | 2h        | 175%     |
| Phase 2 | 인증 시스템 구축     | 8h      | 6h        | 133%     |
| Phase 3 | 데이터 업로드 및 전처리 | 6h      | 4h        | 150%     |
| Phase 4 | 지오코딩 및 지도     | 5.5h    | 2h        | 275%     |
| Phase 5 | 데이터 분석 및 시각화  | 8.5h    | 3h        | 283%     |
| Phase 6 | 필터링 및 인터랙션    | 7.5h    | 2h        | 375%     |
| Phase 7 | 보고서 및 내보내기    | 6h      | 1.5h      | 400%     |
| Phase 8 | 성능 최적화 및 테스트  | 10h     | 2.5h      | 400%     |
| Phase 9 | 실전 배포 준비      | 6h      | 1.5h      | 400%     |
| **총합**  |               | **61h** | **24.5h** | **249%** |


---

## 🎨 스크린샷

### 대시보드 메인

Dashboard Main

### 지도 분석

Map Analysis

### 차트 분석

Chart Analysis

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
- **문의사항**: [ckadltmfxhrxhrxhr@gmail.com](mailto:ckadltmfxhrxhrxhr@gmail.com)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet.js](https://leafletjs.com/)
- [Recharts](https://recharts.org/)

---

## 📚 문서

핵심 문서만 빠르게 보고 싶다면 다음 3가지만 참고하면 됩니다:

- [제품 설계 문서 (병원 CRM)](docs/병원_CRM_설계문서_v4.1.md) — 전체 시스템·기능 설계
- [Phase 8 완료 보고서](docs/PHASE8_COMPLETE.md) — 성능 최적화 & 테스트 정리
- [최종 배포 요약](docs/FINAL_DEPLOYMENT_SUMMARY.md) — 실제 배포 결과 요약

그 외 세부 문서(Phase별 완료 보고서, 배포 가이드, UI 부록 등)는  
`docs/` 폴더 내에서 필요할 때만 찾아보는 참고용으로 유지합니다.

---

**Made with ❤️ by Boam79**

⭐ Star us on GitHub — it helps!

[Report Bug](https://github.com/boam79/patient_analysis/issues) · [Request Feature](https://github.com/boam79/patient_analysis/issues) · [View Demo](https://patient-analysis-phi.vercel.app)