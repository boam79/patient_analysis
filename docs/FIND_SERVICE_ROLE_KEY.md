# Supabase Service Role Key 찾기 가이드

## 현재 화면에서 Service Role Key 찾기

현재 보이는 화면에서 Service Role Key를 찾으려면:

### 1. "Legacy anon, service_role API keys" 탭 클릭

화면 상단에 두 개의 탭이 있습니다:
- ✅ **"Publishable and secret API keys"** (현재 선택됨)
- ⚠️ **"Legacy anon, service_role API keys"** ← **이 탭을 클릭하세요!**

### 2. Service Role Key 확인

"Legacy anon, service_role API keys" 탭을 클릭하면:
- **anon key**: 클라이언트 사이드용 (이미 사용 중)
- **service_role key**: 서버 사이드용 (이것이 필요합니다!)

### 3. Service Role Key 복사

- Service Role Key 옆에 있는 **복사 아이콘** 클릭
- 또는 키를 직접 선택하여 복사

⚠️ **주의**: Service Role Key는 **절대 공개하지 마세요!**
- GitHub에 커밋하지 않음
- 클라이언트 코드에 포함하지 않음
- 공개 채널에 공유하지 않음

## 현재 보이는 키들 설명

### Publishable Keys (현재 탭)
- `web`: `sb_publishable_1raHA7onV` - 웹용 publishable key
- `mobile`: `sb_publishable_VpotEpine` - 모바일용 publishable key

### Secret Keys
- `backend_api`: `sb_secret_8145e••••••••` - 백엔드용 secret key (일부 마스킹됨)

⚠️ **참고**: 이 키들은 새로운 형식의 키입니다. 
- `sb_publishable_*`: Publishable key (브라우저에서 사용 가능, RLS 적용)
- `sb_secret_*`: Secret key (서버 사이드용, RLS 우회 가능)

하지만 현재 코드는 **Legacy 형식의 `service_role` key**를 사용하고 있습니다.

## 두 가지 옵션

### 옵션 1: Legacy Service Role Key 사용 (현재 코드와 호환)

1. "Legacy anon, service_role API keys" 탭 클릭
2. `service_role` key 복사
3. 환경 변수에 설정

### 옵션 2: 새로운 Secret Key 사용 (코드 수정 필요)

1. 현재 탭에서 "+ New secret key" 버튼 클릭
2. 새 secret key 생성
3. 코드에서 `sb_secret_*` 형식의 키 사용하도록 수정

## 권장 방법

**옵션 1 (Legacy Service Role Key)**을 권장합니다:
- 현재 코드와 호환됨
- 추가 코드 수정 불필요
- 즉시 사용 가능

## 다음 단계

Service Role Key를 찾은 후:

1. **Vercel 환경 변수 설정**
   - Vercel 대시보드 → Settings → Environment Variables
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: 복사한 service_role key
   - Save 후 Redeploy

2. **로컬 환경 설정** (선택사항)
   - `.env.local` 파일에 추가:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **확인**
   ```bash
   npx tsx scripts/check-service-role-key.ts
   ```

## 문제 해결

만약 "Legacy anon, service_role API keys" 탭이 보이지 않는다면:
- Supabase 프로젝트가 최신 버전일 수 있습니다
- 새로운 형식의 secret key를 사용하도록 코드를 수정해야 할 수 있습니다
- Supabase 지원팀에 문의하세요

