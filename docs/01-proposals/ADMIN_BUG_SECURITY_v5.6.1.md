# Admin 버그·보안 감사 제안서 v5.6.1

> **작성일**: 2026-07-21  
> **작성자**: Cloud Agent (Planner)  
> **기준 코드**: `main` @ `284c9ff` (Admin v5.5 + UI v5.6)  
> **범위**: `/admin` 콘솔, Server Actions, middleware, `/api/log-*`·cron. 임상 분석 비목표.  
> **방법**: 실파일 실측. v5.4에서 이미 고친 항목(ANON 폴백·유지보수 미강제)은 **재신고하지 않음**.

---

## 요약

기능·인증 골격은 성숙하다. 남은 핵심은 **권한 경계의 틈**과 **공개 API·운영 UX 버그**다.

| 우선순위 | 한 줄 |
|----------|--------|
| **P0** | `rejectUser`에 last-admin/self 가드 없음 → 콘솔 **영구 잠금** 가능. `requireAdminAuth`가 `is_approved` 미검사 → 미승인 ADMIN이 Server Action 계속 호출 |
| **P1** | Cron 시크릿 없으면 개방, DEFINER `REVOKE` 누락, log-error 레이트리밋 우회, log-ip 위조, 유지보수 fail-open |
| **P2** | 검색 `.or()` 미이스케이프, 페이지네이션↔클라이언트 필터 불일치, URL 필터 유실, CSV/감사 이중기록 등 |

**권고 실행 순서**: Phase S1(잠금·권한) → S2(공개 API·Cron) → S3(운영 정확도).

---

## 1. P0 — 즉시

### ADM-P0-01 | security | `rejectUser` last-admin / self 공백
- **증거**: `app/admin/users/actions.ts:40-65` — 가드 없이 `is_approved: false`.  
  비교: `updateUserRole`·`deleteUser`에는 `countActiveAdmins`·자기자신 금지 있음.
- **영향**: 마지막 승인 ADMIN 「거부」 시 middleware/layout이 `/login-admin`으로만 보내고 **복구 불가**(시드 스크립트 제외). 자기 거부도 동일.
- **수정**: (1) `userId === adminId` 금지 (2) 대상이 승인 ADMIN이고 `countActiveAdmins <= 1`이면 throw (3) UI에서도 마지막 ADMIN 거부 비활성.

### ADM-P0-02 | security | `requireAdminAuth`가 `is_approved` 미검증
- **증거**: `lib/admin-auth.ts:31-43` — `role === 'ADMIN'`만.  
  layout/middleware는 `is_approved` 필수 (`app/admin/layout.tsx:26-28`, `lib/supabase/middleware.ts:110-114`).
- **영향**: 승인 취소된 ADMIN이 **이미 연 세션의 Server Action**으로 사용자 삭제·유지보수 토글·설정 변경 가능. P0-01과 결합 시 잠금 직전 창에서 악용·복구 경쟁.
- **수정**: `select('role, is_approved')` + `is_approved === true` 필수. RLS ADMIN SELECT에도 동일 조건 권장.

---

## 2. P1 — 보안·신뢰

| ID | 유형 | 요약 | 근거 | 수정 |
|----|------|------|------|------|
| **ADM-P1-01** | security | last-admin 강등/삭제 **TOCTOU** | count 후 별도 update/delete | 조건부 UPDATE 또는 DEFINER RPC 원자화 |
| **ADM-P1-02** | security | Cron `CRON_SECRET` 미설정 시 **완전 개방** | `app/api/cron/anomaly-check/route.ts:23-28` | 시크릿 없으면 **401 fail-closed** |
| **ADM-P1-03** | security | cleanup/rate-limit DEFINER에 **REVOKE 누락** | `20260703_*.sql` vs IP RPC의 REVOKE | PUBLIC/anon/authenticated REVOKE |
| **ADM-P1-04** | security | `/api/log-error` 비정상 IP면 **레이트리밋 스킵** | `log-error/route.ts` + `isValidIp` | IP 무관 항상 제한(키 `unknown`) |
| **ADM-P1-05** | security | `/api/log-ip` 무인증·body 필드 수용 | `log-ip/route.ts` (미들웨어가 주 경로) | 제거/내부화 또는 path allowlist |
| **ADM-P1-06** | security | 유지보수 **fail-open** + `/api` 전면 예외 | middleware `getServiceClient()===null` 스킵 | 키 없으면 fail-closed; API 예외 최소화 |
| **ADM-P1-07** | bug | `resolved` soft-fail이 필터 **조용히 무력화** | `errors/actions.ts` | degraded 플래그 또는 soft-fail 제거 + 마이그레이션 필수 |

---

## 3. P2 — 버그·운영 정확도

| ID | 유형 | 요약 |
|----|------|------|
| **ADM-P2-01** | bug | `.or(\`…${q}…\`)` 검색 특수문자 → 필터 파싱 깨짐 (`users`/`errors`) |
| **ADM-P2-02** | bug | 서버 페이지 + 테이블 **클라이언트 필터** → 현재 페이지만 검색 |
| **ADM-P2-03** | bug | 이전/다음 링크가 `q`/`role`/`action` 등 **쿼리 유실** |
| **ADM-P2-04** | bug | IP CSV보내기 시 검색어를 `ipAddress`로 오용 |
| **ADM-P2-05** | bug | 유지보수 토글 감사 로그 **이중 기록** |
| **ADM-P2-06** | security | `exec_sql` RPC 호출 패턴(하드코딩 SQL이라도 표면) → 제거 |
| **ADM-P2-07** | security | `/api/health` heap·uptime·version 노출 → `{status:'ok'}`만 |
| **ADM-P2-08** | security | `/api/geocode` 무인증 + 유지보수 예외 → 세션/제한 강화 |
| **ADM-P2-09** | bug | 통계 `days`/`limit` 상한 부족 → clamp |
| **ADM-P2-10** | security | ADMIN 비밀번호 `length < 8`만 → 복잡성 강화 |

---

## 4. 이미 견고함 (재발명·재신고 금지)

- ANON 폴백 제거 (`getSupabaseAdmin`, middleware IP 클라이언트)
- Admin Server Action `requireAdminAuth` + service role 일관 적용
- middleware + layout 이중 가드, 유지보수 모드 **강제**(잔여: fail-open·`/api` 예외만)
- IP RPC `REVOKE` + service_role only
- React XSS/`dangerouslySetInnerHTML` 없음, open redirect 없음
- `deleteUser`/`updateUserRole` last-admin 가드(단 reject·레이스 미완)
- 에러 로그 boundary allowlist·truncate

---

## 5. 고수준 작업 분해

### Phase S1 — 잠금·권한 (최우선)

| Task | 성공 기준 |
|------|-----------|
| **S1.1** `requireAdminAuth`에 `is_approved === true` | 미승인 ADMIN Server Action 전부 거부 |
| **S1.2** `rejectUser` self + last-admin 가드 + UI 비활성 | 마지막 ADMIN 거부 시 에러, 자기거부 불가 |
| **S1.3** (권장) demote/delete/reject 원자 RPC | 동시 강등해도 ADMIN ≥ 1 |
| **S1.4** RLS ADMIN 정책에 `is_approved` 정렬 마이그레이션 | 브라우저 PostgREST도 동일 |

### Phase S2 — 공개 API·Cron·DEFINER

| Task | 성공 기준 |
|------|-----------|
| **S2.1** Cron fail-closed | `CRON_SECRET` 없으면 401 |
| **S2.2** DEFINER REVOKE 마이그레이션 | anon이 cleanup/rate_limit 실행 불가 |
| **S2.3** log-error 항상 rate limit | 위조 IP로 폭주 불가 |
| **S2.4** log-ip 제거 또는 잠금 | 공개 위조 insert 불가 |
| **S2.5** 유지보수 fail-closed + API 예외 축소 | 키 없어도/과도도 유지보수 의미 유지 |

### Phase S3 — 운영 정확도

| Task | 성공 기준 |
|------|-----------|
| **S3.1** resolved soft-fail 제거/배지 | 미해결 필터 신뢰 |
| **S3.2** 검색 sanitize + URL 필터 보존 + 서버 필터 통일 | 페이지 넘겨도 검색 유지 |
| **S3.3** export IP·이중 audit·exec_sql 정리 | CSV/감사 일치 |
| **S3.4** health/geocode/비밀번호 정책 | 외부 표면 축소 |

---

## 6. 의사결정 요청

1. **범위**: S1만 / S1+S2 / 전부(S1–S3)  
2. **S1.3 원자 RPC**: 포함(권고) vs count 가드만  
3. **log-ip**: 엔드포인트 삭제(권고) vs 시크릿 보호  

**기본 권고**: 범위 **S1+S2**, S1.3 포함, log-ip **삭제**.

---

## 7. False positive (다시 올리지 말 것)

1. 「ANON 폴백 잔존」— 해소됨  
2. 「유지보수 모드가 전혀 안 막힘」— middleware 강제됨  
3. 에러 뷰어 XSS — React 이스케이프 충분  
4. 관리자 간 resolveErrorLog — 공유 ADMIN 모델상 정상  
5. IP `status_code: null` — 미들웨어 의도  
6. rate-limit fail-open — 가용성 트레이드오프(잔여 리스크로만)

---

## 8. 관련 파일

```
lib/admin-auth.ts
app/admin/users/actions.ts
components/admin/users/user-management-table.tsx
lib/supabase/middleware.ts
app/api/cron/anomaly-check/route.ts
app/api/log-error/route.ts
app/api/log-ip/route.ts
app/admin/errors/actions.ts
supabase/migrations/20260703_*.sql
```
