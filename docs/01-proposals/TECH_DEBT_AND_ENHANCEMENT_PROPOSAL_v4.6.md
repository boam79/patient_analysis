# 병원 CRM v4.6 고도화 제안서 — 기술 부채 정리 및 신규 기능

> **작성일**: 2026-07-02
> **작성자**: Cloud Agent (Planner)
> **범위**: v4.5.0 코드베이스 실측 분석 기반. 기존 제안서(`COMPREHENSIVE_ENHANCEMENT_PROPOSAL.md`, `ANALYSIS_ENHANCEMENT_PROPOSAL.md`)에서 다룬 코호트/RFM/연관분석 등은 이미 v4.4~v4.5에서 구현 완료되었으므로 **중복 제안하지 않음**.
> **방법론**: 코드 검색(`rg`)과 실제 파일 존재 여부로 각 항목을 검증 후 작성. "README에는 있지만 실제로는 없는" 기능 위주로 우선 정리.

---

## 요약

기존 제안서들은 주로 **분석 기능 확장**(코호트, RFM, 예측 등)에 집중되어 있었고 대부분 반영되었습니다. 반면 실측 결과, 다음 영역은 여전히 공백 상태입니다.

| 영역 | 현재 상태 | 심각도 |
|---|---|---|
| 자동화 테스트 | 테스트 파일 0개 (`*.test.ts` 전무) | 🔴 높음 |
| 죽은 코드 / 미사용 의존성 | NextAuth+Prisma 인증 스택, DuckDB WASM 파이프라인, `.bak` 파일 | 🟡 중간 |
| 에러 바운더리 | `error.tsx`, `global-error.tsx`, `not-found.tsx` 전무 | 🟡 중간 |
| README 기재 vs 실제 구현 불일치 | Rate Limiting, CSP 헤더, DuckDB 처리 | 🟡 중간 |
| 실좌표 지오코딩 | 실제 배치 지오코딩 파이프라인 미연결 | 🟢 낮음~중간 |
| 관측성(Observability) | 콘솔 로그 외 구조화된 로깅/에러 트래킹 없음 | 🟢 낮음 |

---

## 1. 🔴 자동화 테스트 도입 (최우선 권고)

### 현황
```bash
$ find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts"
# (결과 없음)
```
`scripts/verify-analysis-golden.ts` 하나가 `npm run verify:analysis`로 통계 함수(Wilson CI, BH-FDR, STL, KM, PSI)의 스모크 테스트 역할을 하고 있으나, 이는 **golden-value 스크립트**이지 CI에 통합된 단위 테스트가 아닙니다(`ci.yml`의 `lint-and-typecheck` 잡에 포함되어 있지 않음).

핵심 통계·필터링 로직이 임상 의사결정에 영향을 주는 인사이트를 생성하는 만큼, 회귀 버그가 발생해도 감지할 방법이 없습니다. 실제로 스크래치패드 기록에도 "필터 변경 시 결과 미반영" 버그가 여러 차례 재발한 이력이 있습니다.

### 제안
1. **Vitest 도입** (Next.js 15 + React 19와 호환성 우수, jsdom 불필요한 순수 함수 테스트에 적합)
   ```bash
   npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
   ```
2. **우선 테스트 대상** (순수 함수 위주로 ROI가 높은 곳부터):
   - `lib/utils/statistical-insights.ts` — Wilson CI, Z-Score, IQR, 선형회귀
   - `lib/utils/advanced-analysis.ts` — BH-FDR, STL, Cohen h, k-means
   - `lib/utils/patient-identity.ts` — 환자 식별자 우선순위 로직 (동일인 오판정 시 전체 통계 왜곡)
   - `lib/utils/patient-filters.ts` — `filterPatients` (대시보드/전략 페이지 공유 로직이라 버그 파급력 최대)
   - `stores/data-store.ts`의 `processData()` — regionStats/boxplotStats/monthlyTrend 계산
3. **CI 통합**: `.github/workflows/ci.yml`의 `lint-and-typecheck` 잡에 `- run: npm run test` 스텝 추가, PR 필수 체크로 승격
4. **성공 기준**: 핵심 통계 유틸 함수 커버리지 70%+ / 엣지 케이스(빈 배열, 단일 값, 동률) 테스트 포함

---

## 2. 🟡 죽은 코드 및 이중 시스템 정리

### 2.1 NextAuth + Prisma 인증 스택 — 완전 미사용
검증:
```bash
$ grep -rl "next-auth" app/ components/ lib/
# (결과 없음 — auth.config.ts 자기 자신과 .bak, 문서 외 참조 없음)
```
- `auth.config.ts`: `authorized` 콜백이 항상 `true` 반환하도록 이미 무력화됨(v4.3.0에서 정리)
- `auth.ts.bak`, `middleware.ts.bak`: 저장소 루트에 방치된 백업 파일
- `prisma/schema.prisma`의 User/Account/Session/Permission/UserRole 모델 8개 — 실제 인증은 전부 Supabase Auth(`lib/supabase/*`)로 대체되었으나 Prisma 스키마와 `@auth/prisma-adapter`, `@prisma/client`, `prisma` 의존성이 여전히 `package.json`에 남아있음

**제안**:
- `auth.ts.bak`, `middleware.ts.bak` 삭제
- `auth.config.ts` 및 관련 NextAuth 의존성(`next-auth`, `@auth/prisma-adapter`) 제거, 또는 정말 로컬 PostgreSQL 배포 시나리오를 지원할 계획이 있다면 문서에 "듀얼 인증 전략"으로 명시하고 라우트별 사용 여부를 README에 표로 정리
- Prisma가 인증 외 다른 용도(예: 감사 로그 장기 보관, 정형 데이터 백엔드)로 쓰일 계획이 없다면 스키마도 축소 검토 → **번들 크기 및 신규 개발자 온보딩 혼란 감소**

### 2.2 DuckDB WASM — 정의만 있고 호출부 없음
검증:
```bash
$ grep -rl "useDuckDBWorker\|from '@/lib/duckdb" .
./hooks/use-duckdb-worker.ts   # 정의부 자기 자신만
```
`lib/duckdb.ts`, `lib/duckdb-worker.ts`, `hooks/use-duckdb-worker.ts`가 존재하고 README에는 "DuckDB WASM - 브라우저 내 SQL 처리"가 핵심 기능으로 소개되어 있으나, 실제 업로드 파이프라인(`components/upload/*`, `lib/preprocessor.ts`)은 PapaParse로 직접 파싱 후 Zustand 스토어에서 JS로 집계합니다. DuckDB는 어디에서도 인스턴스화되지 않습니다.

**영향**: `@duckdb/duckdb-wasm`은 WASM 바이너리를 포함한 무거운 의존성(수 MB)으로, `next.config.ts`의 `optimizePackageImports`에도 명시되어 있지만 실사용 없이 잠재적으로 번들에 포함될 여지가 있습니다.

**제안 (택1)**:
- **(A) 실제로 연결**: 5만 행 이상 대용량 CSV 업로드 시 JS 기반 `groupBy`/`filter` 연산이 O(n×m)으로 느려지는 지점(예: `regionStats`, `boxplotStats` 계산)을 DuckDB-WASM SQL 쿼리로 대체 → 대용량 데이터 처리 성능 개선이라는 원래 도입 목적 실현
- **(B) 제거**: 당장 계획이 없다면 의존성 제거로 설치 크기 및 유지보수 부담 감소, README에서 관련 문구 삭제
- 어느 쪽이든 "설치되어 있지만 안 쓰는 상태"는 기술 부채이므로 결정을 내리고 실행 권고

### 2.3 좌표 데이터 — 실지오코딩 미연결
`docs/04-archive/geocodingmap.md`, README의 "좌표 샘플 데이터 제공" 문구, `lib/geocoding-batch.ts` 존재로 미루어 실주소 기반 정밀 좌표가 아닌 시/군/구 단위 대표 좌표(또는 샘플)를 사용 중으로 추정됩니다. v4.4.0에서 "미매칭 지역 랜덤 좌표 제거 → null 처리"는 개선되었지만, 여전히 지도 정밀도는 시/군/구 레벨에 머물러 있습니다.

**제안**: Nominatim(이미 `NOMINATIM_API_URL` 환경변수 존재) 기반 배치 지오코딩을 업로드 후 백그라운드 잡으로 실행하고 결과를 IndexedDB에 캐싱하는 파이프라인을 `lib/geocoding-batch.ts`와 연결. Rate limit(Nominatim 1req/sec) 고려한 큐잉 필요.

---

## 3. 🟡 에러 처리 및 복원력

### 현황
```bash
$ find app -name "error.tsx" -o -name "global-error.tsx" -o -name "not-found.tsx"
# (결과 없음)
```
Next.js App Router의 에러 바운더리 규칙(`error.tsx`)이 전혀 없습니다. 현재 런타임 에러 발생 시 Next.js 기본 에러 화면(개발 모드: 스택 트레이스 노출, 프로덕션: 백지 화면)에 의존하게 됩니다. 스크래치패드에도 "일부 페이지에서 에러 발생 시 빈 화면 표시 가능"이라는 기지 이슈가 기록되어 있습니다.

### 제안
- `app/error.tsx`, `app/global-error.tsx`, `app/dashboard/error.tsx`, `app/admin/error.tsx` 추가 — 사용자 친화적 폴백 UI + "다시 시도" 버튼
- `app/not-found.tsx` 추가
- 클라이언트 사이드 최상위에 React Error Boundary 컴포넌트 도입 검토 (특히 Leaflet 지도, Recharts 차트처럼 외부 라이브러리 의존 컴포넌트)
- 프로덕션 에러를 Sentry 등 외부 서비스로 전송할지, 혹은 자체 `audit_logs`/`ip_access_logs` 테이블처럼 Supabase에 `error_logs` 테이블을 신설해 클라이언트 사이드 에러도 수집할지 결정 필요 (PHI 미노출 조건 하에)

---

## 4. 🟡 README 기재 vs 실제 구현 정합성

실측 결과 README가 약속하는 기능 중 코드에서 확인되지 않는 항목:

| README 문구 | 검증 결과 |
|---|---|
| "🚦 Rate Limiting - API 요청 제한" | `grep -rn "rate.limit\|RateLimit"` 결과 없음. 미구현 |
| "🛡️ 보안 헤더 - HSTS, CSP, XSS Protection" | `next.config.ts`에 HSTS/X-XSS-Protection/X-Frame-Options는 있으나 **CSP(Content-Security-Policy) 헤더는 없음** |
| "🔐 Next-Auth v5 - 사용자 인증" | 위 2.1항 참조. 실제로는 Supabase Auth 사용 중, NextAuth는 죽은 코드 |

**제안**:
- API Route(`app/api/*`)에 대해 간단한 IP 기반 rate limiter 추가 (Upstash Redis 또는 Supabase 테이블 기반 sliding window). 특히 `app/api/log-ip`처럼 인증 없이 호출 가능한 엔드포인트 우선
- `next.config.ts` headers()에 CSP 추가 (Leaflet, Recharts, Supabase 도메인 허용리스트 구성 필요 — `img-src`, `connect-src` 등 세밀 조정 필요하므로 리포트 전용(`Content-Security-Policy-Report-Only`)으로 먼저 도입 후 점진 강화 권장)
- README를 실제 구현 상태에 맞게 정정 (문서 신뢰도 유지 차원에서 중요)

---

## 5. 🟢 관측성(Observability) 개선

- 현재 에러 처리는 `console.error`에 의존 (예: `middleware.ts`, `ip-geolocation.ts`). 프로덕션에서는 Vercel 로그에만 남고 알림 체계 없음
- **제안**: 척추관절 전문병원 벤치마크 기반 이상 탐지(`components/strategy/anomaly-detection.tsx`)처럼 비즈니스 이상 징후는 이미 탐지하고 있으나, **시스템 이상 징후**(IP 로그 급증, 관리자 액션 급증 등 `detectAnomalies`)에 대한 알림 채널이 없음 → Slack Webhook 또는 이메일(Resend/SendGrid) 연동으로 severity=high 탐지 시 실시간 알림

---

## 6. 🟢 접근성(A11y) 자동 점검

README는 "접근성 개선: ARIA 레이블 및 시맨틱 HTML 구조 적용"을 연령 피라미드 차트에 대해서만 명시. 전체 애플리케이션에 대한 체계적 a11y 점검(색상 대비, 키보드 내비게이션, 스크린리더)은 없음.

**제안**: `@axe-core/react`를 개발 모드에 통합하거나, CI에 `pa11y-ci` 추가하여 최소한의 회귀 방지선 구축.

---

## 7. 우선순위 로드맵 (기술 관점)

작업 규모는 캘린더 기간이 아닌 **변경 범위·의존성 난이도** 기준으로 표기합니다.

### 1단계 — 즉시 착수 가능 (독립적, 낮은 리스크)
- [ ] `auth.ts.bak`, `middleware.ts.bak` 삭제
- [ ] `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` 추가
- [ ] README 정정 (Rate Limiting/CSP/NextAuth 문구)
- [ ] Vitest 초기 설정 + `lib/utils/patient-identity.ts`, `patient-filters.ts` 단위 테스트 작성 (파급력 최대 로직 우선)

### 2단계 — 중간 난이도 (설계 결정 필요)
- [ ] DuckDB WASM 존치/제거 결정 및 실행
- [ ] NextAuth+Prisma 스택 제거 여부 결정 (Prisma를 다른 용도로 쓸지 먼저 확인)
- [ ] CI에 테스트 잡 통합, 커버리지 70% 목표
- [ ] CSP 헤더 Report-Only 모드 도입

### 3단계 — 신규 기능 (의존성 많음)
- [ ] API rate limiting (Upstash Redis 또는 자체 구현)
- [ ] 실배치 지오코딩 파이프라인 연결
- [ ] 시스템 이상탐지 알림 채널(Slack/Email)
- [ ] 에러 트래킹 서비스 연동 또는 자체 `error_logs` 테이블

---

## 8. 다음 단계

이 문서는 **제안서**이며 코드 변경은 포함하지 않습니다. Planner로서 위 항목 중 우선순위와 승인 범위를 확정해 주시면 Executor 모드로 전환하여 `.cursor/scratchpad.md`의 High-level Task Breakdown에 세부 작업을 등록하고 순차 구현하겠습니다.
