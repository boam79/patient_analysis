# Supabase Service Role Key 설정 가이드

## 문제 상황

통계 분석 탭에서 "통계 데이터가 없습니다" 오류가 발생하는 원인은 **`SUPABASE_SERVICE_ROLE_KEY` 환경 변수가 설정되지 않았기 때문**입니다.

현재 코드는 Service Role Key가 없으면 `ANON_KEY`를 사용하도록 되어 있지만, `ANON_KEY`는 RLS (Row Level Security) 정책 때문에 `ip_access_logs` 테이블의 데이터를 조회할 수 없습니다.

## 해결 방법

### 1. Supabase 대시보드에서 Service Role Key 확인

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `boam79_patient_data`
3. 좌측 메뉴에서 **Settings** → **API** 클릭
4. **Project API keys** 섹션에서 **`service_role`** 키 확인
   - ⚠️ **주의**: 이 키는 절대 공개하지 마세요! 서버 사이드에서만 사용해야 합니다.

### 2. 로컬 환경 설정 (`.env.local`)

프로젝트 루트의 `.env.local` 파일에 다음을 추가:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**예시:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://bkmzuabmkbtxtetuzyaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← 이 줄 추가
```

### 3. Vercel 환경 변수 설정

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택: `patient-analysis-phi`
3. **Settings** → **Environment Variables** 클릭
4. 다음 환경 변수 추가:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Supabase에서 복사한 service_role 키
   - **Environment**: Production, Preview, Development 모두 선택
5. **Save** 클릭
6. **Redeploy** 실행 (환경 변수 변경 후 재배포 필요)

### 4. 확인 방법

환경 변수 설정 후 다음 스크립트로 확인:

```bash
npx tsx scripts/check-service-role-key.ts
```

**성공 시 출력:**
```
✅ SUPABASE_SERVICE_ROLE_KEY: ✅ 설정됨
✅ IP 로그 개수 조회 성공: 731개  # ← 0개가 아닌 실제 데이터 개수
✅ IP 로그 데이터 조회 성공: 5개
```

## 왜 Service Role Key가 필요한가?

### ANON_KEY vs Service Role Key

| 구분 | ANON_KEY | Service Role Key |
|------|----------|------------------|
| 용도 | 클라이언트 사이드 | 서버 사이드 전용 |
| RLS 정책 | 적용됨 | 우회 가능 |
| 보안 | 공개 가능 | 절대 공개 금지 |
| 사용 위치 | 브라우저 | 서버만 |

### RLS 정책 문제

`ip_access_logs` 테이블에는 RLS 정책이 설정되어 있어서:
- **ANON_KEY 사용 시**: RLS 정책 때문에 데이터 조회 불가 (0개 반환)
- **Service Role Key 사용 시**: RLS 정책 우회하여 모든 데이터 조회 가능

## 현재 코드 동작

```typescript
// app/admin/logs/actions.ts
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[IP Statistics] ⚠️ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
}
```

Service Role Key가 없으면:
1. 경고 메시지 출력
2. ANON_KEY 사용 (RLS 정책 때문에 데이터 조회 실패)
3. 빈 배열 반환 → "통계 데이터가 없습니다" 오류 표시

## 보안 주의사항

⚠️ **절대 하지 말아야 할 것:**

1. ❌ Service Role Key를 GitHub에 커밋
2. ❌ 클라이언트 사이드 코드에서 사용
3. ❌ 공개 저장소에 노출
4. ❌ 브라우저 콘솔에 출력

✅ **올바른 사용:**

1. ✅ `.env.local`에만 저장 (`.gitignore`에 포함됨)
2. ✅ Vercel 환경 변수로만 설정
3. ✅ Server Actions에서만 사용
4. ✅ 절대 클라이언트에 전달하지 않음

## 문제 해결 체크리스트

- [ ] Supabase 대시보드에서 Service Role Key 확인
- [ ] `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- [ ] Vercel 환경 변수에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- [ ] Vercel 재배포 실행
- [ ] `npx tsx scripts/check-service-role-key.ts` 실행하여 확인
- [ ] 브라우저에서 통계 분석 탭 새로고침

## 참고 자료

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase API Keys 문서](https://supabase.com/docs/guides/api/api-keys)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)

