# 제작자(Admin) 콘솔 고도화 제안서 v5.4

> **작성일**: 2026-07-21  
> **작성자**: Cloud Agent (Planner)  
> **기준 코드**: `main` @ `ae020d2` (hospital-crm v5.4.1)  
> **방법론**: `app/admin/**`, `components/admin/**`, `lib/admin-auth.ts`, middleware 실측. 기존 검증 문서(`ADMIN_DASHBOARD_VERIFICATION.md`)의 “모니터링 하드코딩” 지적과 교차 확인.

---

## 요약

제작자 콘솔(`/admin`)은 **사용자·IP·감사·에러**까지 실데이터로 동작하는 반쯤 성숙한 운영 콘솔이다.  
병목은 기능 부족이 아니라 **신뢰성·보안 일관성·허위 UI·목록 스케일**이다.

| 영역 | 성숙도 | 한 줄 평가 |
|------|--------|------------|
| 사용자 관리 | ★★★★☆ | 승인/역할/삭제/ADMIN 생성·감사 연동 실전급 |
| IP 로그·이상탐지 | ★★★★☆ | 가장 성숙 (RPC 폴백·크론·geo) |
| 감사 / 에러 로그 | ★★★☆☆ | 조회·CSV 가능, 페이지네이션·워크플로 부족 |
| 통계 | ★★★☆☆ | 실데이터이나 로그 분석과 중복 큼 |
| 유지보수 | ★★☆☆☆ | 토글·설정 UI만 있고 **앱 차단 미강제** |
| 모니터링 | ★☆☆☆☆ | **하드코딩** — 허위 “정상” 표시 |

**권고 방향**: P0 보안·신뢰 정리 → 모니터링 실데이터화 또는 제거 → 목록 UX → (선택) 운영 고도화.  
병원 CRM **임상 분석** 기능은 admin 범위 밖 — 건드리지 않음.

---

## 1. 현재 기능 인벤토리

| 경로 | 역할 | 데이터 | 비고 |
|------|------|--------|------|
| `/admin` | 홈 KPI·최근 감사·빠른 액션 | 실데이터 | 승인 대기 강조 카드 있음 |
| `/admin/users` | 승인·역할·삭제·ADMIN 생성 | 실데이터 + Actions | 페이지네이션 없음 |
| `/admin/statistics` | 가입/역할/활성/세션 + IP 차트 | 실데이터 | `/admin/logs`와 IP 섹션 중복 |
| `/admin/logs` | IP 통계·이상탐지·CSV | 실데이터 (≤1000 + RPC) | 콘솔 내 최성숙 |
| `/admin/errors` | 클라이언트 에러 바운더리 로그 | 실데이터 (≤200) | 해결 워크플로 없음 |
| `/admin/monitoring` | CPU/메모리/DB/응답 | **하드코딩 `-` / “정상”** | 메뉴에 노출됨 |
| `/admin/maintenance` | 유지보수 토글·DB count·settings | settings 실데이터 | 토글이 트래픽을 **막지 않음** |
| `/admin/audit` | 감사 목록·통계·CSV | 실데이터 (≤100) | `getAuditLogs` 미연결 |
| `/admin/login-temp` | 임시 로그인 UI | — | layout과 충돌, **삭제 후보** |
| `/login-admin` | **정식** 관리자 로그인 | Supabase Auth | 유지 |

**보호 계층 (양호한 골격)**  
1. Middleware: `/admin*` → ADMIN + 승인 (`/admin/login*` 예외)  
2. Layout: 동일 검사 → `/login-admin`  
3. Server Actions: `requireAdminAuth()`는 **`logs/actions.ts`에만** 통일 적용

---

## 2. Key Challenges (실측)

### P0 — 보안·신뢰

| ID | 이슈 | 근거 |
|----|------|------|
| **A0-1** | Service Role → **ANON 폴백** 잔존 | `users/actions.ts:12`, `audit/actions.ts:8`, `statistics/actions.ts:8`, `maintenance/actions.ts:10` — `logs`만 폴백 금지. 키 없을 때 RLS silent empty 가능 |
| **A0-2** | 유지보수 모드 **미강제** | `toggleMaintenanceMode` → `settings.maintenance.enabled`만 저장. middleware/layout에서 읽기·차단 **없음** |
| **A0-3** | `login-temp` + `/admin/login*` 미들웨어 오픈 | 실사용 불가에 가깝고 문서/시드가 옛 `/admin/login` 경로를 참조 → 공격면·온보딩 혼란 |
| **A0-4** | 모니터링 **허위 상태** | `monitoring/page.tsx` DB `"정상"` 하드코딩 — 운영자가 실제 장애를 놓칠 수 있음 |

### P1 — UX·일관성·스케일

| ID | 이슈 | 근거 |
|----|------|------|
| **A1-1** | 목록 **페이지네이션 부재** | users / logs(1000) / audit(100) / errors(200) 전부 상한 로드 + 클라이언트 필터 |
| **A1-2** | 통계 ↔ 로그 분석 **IP 차트 중복** | `statistics-charts` ≈ `ip-statistics-dashboard` |
| **A1-3** | Header Bell / Settings **데드 버튼** | `admin-header.tsx` — onClick 없음 |
| **A1-4** | IP “전체 로그” 카드 = `length≤1000` | 실제 total count 아님 (`logs/page.tsx`) |
| **A1-5** | `requireAdminAuth` **부분 적용** | logs만; 나머지 인라인 복붙 |
| **A1-6** | `system_alerts` **UI 없음** | 크론·테이블만 존재, 사이드바 메뉴 없음 |
| **A1-7** | `status_code` 항상 null | middleware가 응답 전 삽입 — UI에 “-”로 명시 필요 |

### P2 — 성숙 콘솔 대비 (선택)

| ID | 이슈 |
|----|------|
| **A2-1** | 에러 로그 해결/무시·심각도·CSV·기간 필터 |
| **A2-2** | ADMIN 자기보호(타 ADMIN 강등/삭제 가드), 세션 강제 종료 |
| **A2-3** | 설정 스키마 Zod 검증, 신규 키 UI, feature flag |
| **A2-4** | 모바일 사이드바, 브레드크럼, 빈 상태 CTA |
| **A2-5** | 실측 APM(Vercel/Supabase API) — 비용·키 의존 → **기본은 제거/슬림화 권고** |

---

## 3. 고수준 작업 분해

원칙: **한 번에 한 Phase**, 작업 단위는 작을수록, TDD 가능한 곳(auth 헬퍼·유지보수 가드)부터.

### Phase A — 보안·인증 일관성 (최우선)

| Task | 내용 | 성공 기준 |
|------|------|-----------|
| **A1** | users/audit/statistics/maintenance/`lib/audit.ts`에서 ANON 폴백 제거 → service role 필수 | `rg "ANON_KEY" app/admin lib/audit.ts` = 0 (의도된 클라이언트 제외) |
| **A2** | 모든 admin Server Actions를 `requireAdminAuth()`로 통일 | logs 외 actions도 헬퍼 호출; 인라인 role 체크 복붙 제거 |
| **A3** | `app/admin/login-temp` 삭제; middleware `/admin/login*` 예외 정리; docs/scripts를 `/login-admin`으로 정정 | 비로그인 `/admin/*` → `/login-admin`만 |
| **A4** | 유지보수 모드: middleware에서 `maintenance.enabled` 읽기 → 비ADMIN에 503/안내 페이지 **또는** 토글 UI 제거(택1) | enabled=true 시 `/dashboard` 접근 차단 e2e |

**권고 기본값**: A4는 **미들웨어 강제** (UI를 살려 의미가 생기게).

### Phase B — 모니터링·지표 신뢰

| Task | 내용 | 성공 기준 |
|------|------|-----------|
| **B1** | `/admin/monitoring`을 **(옵션1)** 제거하거나 **(옵션2)** 실데이터만 표시: `checkDatabaseHealth`, 최근 24h anomaly 수, error_logs 수, system_alerts 미해결 수 | 하드코딩 `"정상"` / `"-"` 메트릭 카드 없음 |
| **B2** | IP 총건수 `count: 'exact'`; status_code null을 UI에서 “미수집”으로 표기 | 카드 숫자 ≠ `logs.length` |

**권고 기본값**: B1 = **옵션2 슬림 헬스** (메뉴 유지, Vercel CPU 등 불가 메트릭은 제거).

### Phase C — 목록 UX·IA 정리

| Task | 내용 | 성공 기준 |
|------|------|-----------|
| **C1** | users / audit / errors / logs에 서버 `range` + URL `?page=&q=` | 대량 데이터에서도 첫 paint 안정, 페이지 전환 가능 |
| **C2** | 통계 페이지 IP 섹션 제거 → `/admin/logs` 딥링크 | 동일 차트 이중 유지보수 해소 |
| **C3** | Header 데드 버튼 제거 또는 alerts/maintenance 연결 | 클릭 시 동작 또는 UI 삭제 |
| **C4** | `getAuditLogs`를 audit 페이지에 연결 (서버 필터) | actions 미사용 함수 해소 |

### Phase D — 운영 고도화 (승인 후)

| Task | 내용 | 성공 기준 |
|------|------|-----------|
| **D1** | `/admin/alerts` — `system_alerts` 목록·확인 처리 | 크론 알림을 콘솔에서 추적 가능 |
| **D2** | 에러 로그: 기간 필터, CSV, resolved 플래그(마이그레이션) | 운영 워크플로 1사이클 |
| **D3** | ADMIN 강등/삭제 가드 + 마지막 ADMIN 보호 | 자기 잠금·전원 ADMIN 삭제 불가 |
| **D4** | (선택) settings Zod 스키마·신규 키 UI | 잘못된 JSON으로 앱 깨짐 방지 |

---

## 4. 바꾸지 말 것 (이미 견고)

- Middleware + Layout ADMIN/승인 이중 가드 골격  
- `lib/admin-auth.ts` 설계 및 `logs/actions.ts` service-role 강제 패턴 (타 actions의 롤모델)  
- 사용자 승인/역할/삭제/ADMIN 생성 + `logAction` 감사 연동  
- IP 파이프라인: middleware 기록 → geo 캐시 → RPC/JS 폴백 → `lib/anomaly-detection` → 크론  
- 에러 수집: 바운더리 → rate-limited `/api/log-error` → ADMIN RLS  
- `/login-admin` 본로그인, Harbor Clinical Admin 셸 톤  
- 임상 대시보드/지도/전략 분석 코드 (이번 제안 범위 외)

---

## 5. 비목표 (Out of scope)

- Vercel/Supabase 실시간 CPU·메모리 APM 연동 (외부 API·플랜·키 의존, ROI 낮음)  
- 병원 환자 PHI를 admin DB에 중앙 저장하는 거버넌스 콘솔 (현재 설계는 로컬 PHI)  
- Sentry 등 외부 에러 SaaS (이미 `error_logs` 자체 수집)  
- RBAC 세분화 UI (`permissions` 테이블 전면 활성화) — 현 ADMIN 단일 콘솔로 충분

---

## 6. 권장 실행 순서

```
Phase A (보안) → Phase B (모니터링 신뢰) → Phase C (목록·IA) → Phase D (선택)
```

예상 변경 침습도:
- **A**: actions·middleware·삭제 파일 — 중침습, 회귀는 admin 전용  
- **B**: monitoring 페이지·logs count — 저침습  
- **C**: 뷰어 컴포넌트·URL 상태 — 중침습, 수동 확인 필요  
- **D**: 신규 라우트·마이그레이션 — 중~고, 별도 승인

---

## 7. 의사결정 요청 (사용자)

Executor 착수 전 확인이 필요한 선택지:

1. **A4 유지보수 모드**: 미들웨어 강제(권고) vs UI 제거  
2. **B1 모니터링**: 슬림 헬스 실데이터(권고) vs 메뉴·페이지 완전 삭제  
3. **범위**: Phase A+B만 / A~C / 전부(A~D)

기본값으로 진행해도 되면: **A4=강제, B1=슬림 헬스, 범위=A→B→C 순차 (한 태스크씩 검증)**.

---

## 8. 관련 파일 (빠른 맵)

```
app/admin/page.tsx                 홈
app/admin/users/                   사용자 + actions (ANON 폴백)
app/admin/logs/                    IP (requireAdminAuth 모범)
app/admin/audit/                   감사
app/admin/errors/                  에러
app/admin/statistics/              통계 (로그와 중복)
app/admin/monitoring/page.tsx      하드코딩
app/admin/maintenance/             유지보수 (미강제)
app/admin/login-temp/              삭제 후보
app/login-admin/                   정식 로그인
lib/admin-auth.ts                  공통 헬퍼
lib/supabase/middleware.ts         /admin 가드
components/admin/layout/*          사이드바·헤더
```
