# 관리자 계정 설정 가이드

## 현재 상태
- 기존 계정: `pjm7908@hanmail.net`
- 역할: ADMIN ✅
- 승인 상태: 승인됨 ✅
- Supabase Auth: 등록됨 ✅

## 방법 1: Supabase 대시보드에서 비밀번호 설정 (권장)

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `boam79_patient_data`
3. **Authentication** → **Users** 메뉴 이동
4. `pjm7908@hanmail.net` 사용자 찾기
5. 사용자 클릭 → **Reset Password** 또는 **Update Password** 클릭
6. 새 비밀번호 설정
7. 저장

## 방법 2: 새 관리자 계정 생성

### 환경 변수 설정
`.env.local` 파일에 추가:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://bkmzuabmkbtxtetuzyaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Service Role Key 확인
1. Supabase 대시보드 → Settings → API
2. `service_role` key 복사 (⚠️ 절대 공개하지 마세요!)

### 스크립트 실행
```bash
# 기본 관리자 계정 생성 (admin@example.com / ChangeMe123!)
npm run seed-admin

# 또는 커스텀 계정 생성
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=YourPassword123! npm run seed-admin
```

## 방법 3: 기존 계정 비밀번호 리셋

### 방법 3-1: 스크립트 사용 (권장)

```bash
# 비밀번호 리셋
ADMIN_EMAIL=pjm7908@hanmail.net ADMIN_PASSWORD=새비밀번호123! tsx scripts/reset-admin-password.ts
```

### 방법 3-2: Supabase 대시보드 사용

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `boam79_patient_data`
3. **Authentication** → **Users** 메뉴 이동
4. `pjm7908@hanmail.net` 사용자 찾기
5. 사용자 클릭 → **Update Password** 또는 **Send Password Reset Email** 클릭
6. 새 비밀번호 설정 또는 이메일로 받은 링크로 비밀번호 재설정

## 로그인 테스트

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000/login-admin` 접속
3. 이메일과 비밀번호 입력
4. 로그인 성공 시 제작자 대시보드로 이동

