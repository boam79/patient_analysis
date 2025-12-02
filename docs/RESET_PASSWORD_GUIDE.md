# 비밀번호 리셋 가이드

## 현재 계정 정보
- **이메일**: `pjm7908@hanmail.net`
- **새 비밀번호**: `111111`

## Supabase 대시보드에서 비밀번호 업데이트

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트: `boam79_patient_data` 선택

2. **Authentication 메뉴로 이동**
   - 왼쪽 사이드바에서 **Authentication** 클릭
   - **Users** 탭 선택

3. **사용자 찾기**
   - 검색창에 `pjm7908@hanmail.net` 입력
   - 또는 목록에서 해당 사용자 찾기

4. **비밀번호 업데이트**
   - 사용자 행을 클릭하여 상세 페이지 열기
   - **Update Password** 버튼 클릭
   - 새 비밀번호 입력: `111111`
   - **Save** 클릭

5. **로그인 테스트**
   - http://localhost:3000/login-admin 접속
   - 이메일: `pjm7908@hanmail.net`
   - 비밀번호: `111111`
   - 로그인 버튼 클릭

## 또는 Service Role Key로 스크립트 실행

1. **Service Role Key 확인**
   - Supabase 대시보드 → Settings → API
   - `service_role` key 복사

2. **환경 변수 설정**
   - `.env.local` 파일에 추가:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **스크립트 실행**
   ```bash
   ADMIN_EMAIL=pjm7908@hanmail.net ADMIN_PASSWORD=111111 npm run reset-admin-password
   ```

