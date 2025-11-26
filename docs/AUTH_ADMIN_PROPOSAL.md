# 인증/인가 시스템 및 관리자 페이지 구현 제안서 (Supabase 기반)

**작성일**: 2024-12-XX  
**작성자**: Planner  
**상태**: 제안 단계  
**인증 시스템**: Supabase Auth  
**데이터베이스**: Supabase (PostgreSQL)

---

## 📋 배경 및 동기

### 요구사항
1. **회원 가입 또는 승인된 사용자만 접근 가능**
   - Supabase Auth를 통한 회원 가입
   - 관리자 승인 후에만 대시보드 사용 가능
   - 또는 관리자가 직접 사용자를 생성하고 초대

2. **제작자 전용 관리자 페이지**
   - 사용자 관리 (생성, 수정, 삭제, 승인)
   - 권한 관리 (역할 부여, 권한 할당)
   - 시스템 설정
   - 감사 로그 조회
   - 데이터 업로드 이력 관리

### 현재 상태
- ✅ Supabase 사용 결정
- ✅ Prisma 스키마에 User, Permission, UserRole 정의됨 (Supabase와 호환)
- ✅ RBAC 시스템 설계 완료 (ADMIN, ANALYST, VIEWER, USER)
- ✅ `lib/rbac.ts` 권한 체크 함수 구현됨
- ⚠️ Supabase 클라이언트 미설치
- ⚠️ 실제 인증 로직 미구현

### 프로젝트 개요 (PDR Dashboard v4.1)
**PDR Dashboard**는 의료 데이터 분석을 위한 웹 기반 대시보드입니다. 환자의 재방문 패턴을 분석하고, 질병 및 수술 데이터를 시각화하여 의료 의사결정을 지원합니다.

**핵심 가치**:
- ✅ **로컬 데이터 처리**: 브라우저 내에서 모든 데이터 분석 수행 (보안)
- ✅ **PHI 최소화**: Protected Health Information 보호
- ✅ **고성능**: Web Worker, 가상화, 메모이제이션
- ✅ **확장 가능**: 모듈식 아키텍처

**주요 기능**:
- 📁 CSV/Excel 파일 업로드 (드래그 앤 드롭)
- 📊 인터랙티브 차트 (Recharts)
- 🗺️ 지도 시각화 (OpenStreetMap + Leaflet.js)
- 🔍 4가지 분석 축 (재방문, 공간, 질병, 수술)
- 🎛️ 9가지 필터 (기간, 윈도우, 질병, 수술, 연령, 성별, 지역 등)
- 📄 보고서 내보내기 (CSV, PNG, PDF)

**현재 기술 스택**:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.6, Tailwind CSS + shadcn/ui
- **State Management**: Zustand (with persist middleware)
- **Data Processing**: DuckDB WASM, PapaParse, XLSX
- **Visualization**: Recharts, Leaflet.js
- **Backend**: PostgreSQL 16, Prisma (→ Supabase로 전환 예정)
- **Authentication**: Next-Auth v5 (→ Supabase Auth로 전환 예정)
- **Deployment**: Vercel, Docker

**프로젝트 구조**:
```
Patient_Analysis/
├── app/                      # Next.js App Router
│   ├── dashboard/           # 대시보드 페이지
│   ├── api/                 # API 라우트
│   └── layout.tsx           # 루트 레이아웃
├── components/              # React 컴포넌트
│   ├── charts/              # 차트 컴포넌트
│   ├── map/                 # 지도 컴포넌트
│   └── ui/                  # UI 기본 컴포넌트 (shadcn/ui)
├── lib/                     # 유틸리티 함수
│   ├── rbac.ts              # RBAC 유틸 (기존 구현됨)
│   └── ...                  # 기타 유틸
├── stores/                  # Zustand 스토어
│   ├── data-store.ts        # 데이터 상태 관리
│   └── filter-store.ts      # 필터 상태 관리
└── prisma/                  # Prisma 스키마
    └── schema.prisma        # DB 스키마 (Supabase와 호환)
```

**현재 인증 상태**:
- ⚠️ Next-Auth v5가 임시 비활성화 상태
- ⚠️ 인증 없이 대시보드 접근 가능 (개발 단계)
- ✅ RBAC 시스템 설계 완료 (ADMIN, ANALYST, VIEWER, USER)
- ✅ `lib/rbac.ts`에 권한 체크 함수 구현됨

**변경 예정 사항**:
- 🔄 Next-Auth v5 → Supabase Auth
- 🔄 PostgreSQL (Prisma) → Supabase (PostgreSQL 호환)
- ➕ Supabase 클라이언트 설치 및 설정
- ➕ 회원 가입/로그인 페이지 구현
- ➕ 관리자 페이지 구현

---

## 🎯 주요 도전 과제 및 분석

### 1. 인증 시스템 구현
- **Supabase Auth** 사용
- **이메일/비밀번호 로그인**: Supabase Auth 기본 제공
- **Session 관리**: Supabase Auth의 JWT 기반 세션
- **비밀번호 암호화**: Supabase가 자동 처리 (bcrypt 내장)

### 2. 사용자 승인 시스템
- **옵션 A**: 회원 가입 → Supabase `auth.users`에 저장 → `user_profiles` 테이블에 `is_approved` 플래그
- **옵션 B**: 관리자가 직접 사용자 생성 (Supabase Admin API 사용)
- **권장**: 옵션 A (회원 가입 + 승인 시스템)

### 3. 관리자 페이지 보안
- **Route Protection**: Middleware에서 Supabase 세션 체크 + ADMIN 역할 확인
- **API Protection**: Server Actions에서 Supabase 클라이언트로 권한 체크
- **RLS (Row Level Security)**: Supabase Database에서 테이블 레벨 보안 정책
- **UI 보호**: 클라이언트 컴포넌트에서 조건부 렌더링

### 4. 데이터베이스 스키마 설계
- **Supabase Database**에 사용자 프로필, 권한, 감사 로그 테이블 생성
- **Prisma 사용 가능**: Supabase는 PostgreSQL이므로 Prisma와 호환
- **또는 Supabase Client 직접 사용**: 더 간단하고 Supabase 기능 활용

---

## 📊 고수준 작업 분해

### Phase 0: Supabase 프로젝트 설정 (필수)

#### Task 0.1: Supabase 프로젝트 생성 및 설정
**목표**: Supabase 프로젝트 생성 및 환경 변수 설정

**작업 내용**:
1. Supabase 대시보드에서 새 프로젝트 생성
2. 프로젝트 URL, anon key, service_role key 확인
3. `.env.local`에 환경 변수 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

**성공 기준**:
- ✅ Supabase 프로젝트 생성 완료
- ✅ 환경 변수 설정 완료
- ✅ Supabase 대시보드 접근 가능

#### Task 0.2: Supabase 클라이언트 설치 및 설정
**목표**: Supabase JavaScript 클라이언트 설치 및 초기화

**패키지 설치**:
```bash
npm install @supabase/supabase-js
npm install @supabase/ssr  # Next.js SSR 지원
```

**파일 생성**:
- `lib/supabase/client.ts`: 클라이언트 사이드 Supabase 클라이언트
- `lib/supabase/server.ts`: 서버 사이드 Supabase 클라이언트
- `lib/supabase/middleware.ts`: Middleware용 Supabase 클라이언트

**성공 기준**:
- ✅ 패키지 설치 완료
- ✅ 클라이언트/서버 클라이언트 초기화
- ✅ TypeScript 타입 에러 없음

---

### Phase 1: 데이터베이스 스키마 설계 및 생성 (필수)

#### Task 1.1: Supabase Database 스키마 설계
**목표**: 사용자 프로필, 권한, 감사 로그 테이블 설계

**테이블 구조**:

1. **`user_profiles`** (사용자 프로필 확장)
   ```sql
   CREATE TABLE user_profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     role TEXT DEFAULT 'USER' CHECK (role IN ('ADMIN', 'ANALYST', 'VIEWER', 'USER')),
     is_approved BOOLEAN DEFAULT false,
     approved_at TIMESTAMPTZ,
     approved_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **`permissions`** (권한 정의)
   ```sql
   CREATE TABLE permissions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT UNIQUE NOT NULL,
     description TEXT,
     category TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **`user_permissions`** (사용자별 권한)
   ```sql
   CREATE TABLE user_permissions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
     permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
     granted_at TIMESTAMPTZ DEFAULT NOW(),
     granted_by UUID REFERENCES auth.users(id),
     UNIQUE(user_id, permission_id)
   );
   ```

4. **`audit_logs`** (감사 로그)
   ```sql
   CREATE TABLE audit_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
     action TEXT NOT NULL,
     resource TEXT,
     details JSONB,
     ip_address TEXT,
     user_agent TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

5. **`settings`** (시스템 설정)
   ```sql
   CREATE TABLE settings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     key TEXT UNIQUE NOT NULL,
     value TEXT NOT NULL,
     description TEXT,
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     updated_by UUID REFERENCES auth.users(id)
   );
   ```

**RLS (Row Level Security) 정책**:
- `user_profiles`: 자신의 프로필만 조회 가능, ADMIN은 모든 프로필 조회 가능
- `permissions`: 모든 인증된 사용자 조회 가능
- `user_permissions`: 자신의 권한만 조회 가능, ADMIN은 모든 권한 조회 가능
- `audit_logs`: ADMIN만 조회 가능
- `settings`: 모든 인증된 사용자 조회 가능, ADMIN만 수정 가능

**성공 기준**:
- ✅ SQL 스키마 작성 완료
- ✅ RLS 정책 설계 완료

#### Task 1.2: Supabase Database에 테이블 생성
**목표**: SQL 마이그레이션 실행

**방법**:
- 옵션 A: Supabase 대시보드 SQL Editor에서 직접 실행
- 옵션 B: Prisma Migrate 사용 (Supabase는 PostgreSQL이므로 호환)
- 옵션 C: Supabase CLI 사용

**성공 기준**:
- ✅ 모든 테이블 생성 완료
- ✅ RLS 정책 적용 완료
- ✅ 인덱스 생성 완료 (성능 최적화)

#### Task 1.3: 초기 데이터 시드
**목표**: 기본 권한 및 초기 관리자 계정 생성

**시드 스크립트**:
- 기본 권한 목록 삽입 (`permissions` 테이블)
- 초기 관리자 계정 생성 (Supabase Auth + `user_profiles`)
- 기본 시스템 설정 삽입 (`settings` 테이블)

**성공 기준**:
- ✅ 기본 권한 데이터 삽입
- ✅ 초기 관리자 계정 생성
- ✅ 기본 설정 값 설정

---

### Phase 2: 인증 시스템 구현 (필수)

#### Task 2.1: 회원 가입 페이지 구현
**목표**: Supabase Auth를 사용한 회원 가입

**파일**: `app/register/page.tsx` (신규 생성)

**기능**:
- 이메일, 비밀번호, 이름 입력 폼
- 비밀번호 확인
- 유효성 검사 (Zod 스키마)
- Supabase `signUp()` 호출
- 회원 가입 성공 시 `user_profiles` 테이블에 프로필 생성 (is_approved=false)
- 회원 가입 후 "승인 대기" 메시지 표시

**Server Action**:
```typescript
// app/register/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function registerUser(email: string, password: string, name: string) {
  const supabase = createClient()
  
  // 1. Supabase Auth에 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (authError) throw authError
  
  // 2. user_profiles 테이블에 프로필 생성
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user!.id,
      email,
      name,
      role: 'USER',
      is_approved: false,
    })
  
  if (profileError) throw profileError
  
  return { success: true }
}
```

**성공 기준**:
- ✅ 회원 가입 성공 시 Supabase Auth에 저장
- ✅ `user_profiles` 테이블에 프로필 생성
- ✅ 중복 이메일 체크
- ✅ 유효성 검사 동작

#### Task 2.2: 로그인 페이지 구현
**목표**: Supabase Auth를 사용한 로그인

**파일**: `app/login/page.tsx` (신규 생성)

**기능**:
- 이메일/비밀번호 입력
- Supabase `signInWithPassword()` 호출
- 에러 메시지 표시 (승인 대기, 잘못된 자격증명 등)
- 로그인 성공 시 세션 확인 및 `is_approved` 체크
- 승인된 사용자는 대시보드로 리다이렉트
- 미승인 사용자는 `/pending-approval`로 리다이렉트

**Server Action**:
```typescript
// app/login/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function loginUser(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // 사용자 프로필 조회하여 is_approved 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved, role')
    .eq('id', data.user.id)
    .single()
  
  return {
    user: data.user,
    isApproved: profile?.is_approved ?? false,
    role: profile?.role ?? 'USER',
  }
}
```

**성공 기준**:
- ✅ 로그인 성공 시 세션 생성
- ✅ 승인된 사용자만 대시보드 접근
- ✅ 승인 대기 사용자는 적절한 메시지 표시

#### Task 2.3: Middleware 보호 강화
**목표**: 대시보드 접근을 로그인 + 승인된 사용자만 허용

**파일**: `middleware.ts` (신규 생성 또는 수정)

**로직**:
- `/dashboard/*` 경로는 로그인 필수
- Supabase 세션 확인
- `user_profiles`에서 `is_approved === true` 확인
- 미승인 사용자는 `/pending-approval`로 리다이렉트
- `/admin/*` 경로는 ADMIN 역할만 접근 허용

**구현**:
```typescript
import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createClient(request)
  const { data: { session } } = await supabase.auth.getSession()
  
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')
  
  if (isDashboard || isAdmin) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_approved, role')
      .eq('id', session.user.id)
      .single()
    
    if (!profile?.is_approved) {
      return NextResponse.redirect(new URL('/pending-approval', request.url))
    }
    
    if (isAdmin && profile.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return NextResponse.next()
}
```

**성공 기준**:
- ✅ 미로그인 사용자 → `/login` 리다이렉트
- ✅ 미승인 사용자 → `/pending-approval` 리다이렉트
- ✅ ADMIN이 아닌 사용자는 `/admin/*` 접근 불가
- ✅ 승인된 사용자만 대시보드 접근

#### Task 2.4: 로그아웃 기능 구현
**목표**: Supabase 세션 종료

**구현**:
- `app/logout/actions.ts`: `supabase.auth.signOut()` 호출
- 로그아웃 후 `/login`으로 리다이렉트

**성공 기준**:
- ✅ 세션 종료 확인
- ✅ 리다이렉트 동작

---

### Phase 3: 관리자 페이지 구현 (핵심)

#### Task 3.1: 관리자 레이아웃 생성
**목표**: 관리자 전용 레이아웃 및 네비게이션

**파일**: `app/admin/layout.tsx` (신규 생성)

**기능**:
- 사이드바 네비게이션 (사용자 관리, 권한 관리, 시스템 설정, 감사 로그)
- ADMIN 역할만 접근 가능 (Middleware + Layout에서 체크)
- 로그아웃 버튼
- 현재 사용자 정보 표시

**성공 기준**:
- ✅ ADMIN이 아닌 사용자는 접근 불가
- ✅ 네비게이션 메뉴 표시
- ✅ 반응형 디자인

#### Task 3.2: 사용자 관리 페이지
**목표**: 사용자 목록 조회, 승인, 수정, 삭제

**파일**: `app/admin/users/page.tsx` (신규 생성)

**기능**:
- **사용자 목록 테이블**:
  - 이메일, 이름, 역할, 승인 상태, 가입일
  - 검색 기능 (이메일, 이름)
  - 필터 (승인/미승인, 역할별)
  - 페이지네이션
- **사용자 승인**:
  - 미승인 사용자 목록 표시
  - "승인" 버튼 클릭 시 즉시 승인 (`user_profiles.is_approved = true`)
- **사용자 수정**:
  - 역할 변경 (ADMIN, ANALYST, VIEWER, USER)
  - 이름 수정
- **사용자 삭제**:
  - 확인 다이얼로그 후 삭제
  - Supabase Admin API로 `auth.users`에서도 삭제

**Server Actions**:
- `app/admin/users/actions.ts` (신규 생성)
  - `getUsers()`: Supabase에서 사용자 목록 조회
  - `approveUser(userId)`: `user_profiles.is_approved = true` 업데이트
  - `updateUser(userId, data)`: 사용자 정보 수정
  - `deleteUser(userId)`: Supabase Admin API로 사용자 삭제

**성공 기준**:
- ✅ 사용자 목록 조회 성공
- ✅ 승인 기능 동작
- ✅ 역할 변경 반영
- ✅ 삭제 시 확인 다이얼로그

#### Task 3.3: 권한 관리 페이지
**목표**: 역할별 권한 설정 및 사용자별 권한 할당

**파일**: `app/admin/permissions/page.tsx` (신규 생성)

**기능**:
- **역할별 권한 표**:
  - 역할(ADMIN, ANALYST, VIEWER, USER) × 권한 매트릭스
  - 체크박스로 권한 활성화/비활성화
  - `lib/rbac.ts`의 `RolePermissions` 기반
- **사용자별 커스텀 권한**:
  - 특정 사용자에게 추가 권한 부여
  - 권한 제거

**Server Actions**:
- `app/admin/permissions/actions.ts` (신규 생성)
  - `getRolePermissions()`: 역할별 권한 조회
  - `updateRolePermissions(role, permissions)`: 역할 권한 업데이트 (코드 레벨)
  - `grantUserPermission(userId, permissionId)`: `user_permissions` 테이블에 삽입
  - `revokeUserPermission(userId, permissionId)`: `user_permissions` 테이블에서 삭제

**성공 기준**:
- ✅ 역할별 권한 매트릭스 표시
- ✅ 권한 변경 저장
- ✅ 사용자별 권한 할당/제거

#### Task 3.4: 시스템 설정 페이지
**목표**: 애플리케이션 전역 설정 관리

**파일**: `app/admin/settings/page.tsx` (신규 생성)

**기능**:
- **일반 설정**:
  - 애플리케이션 이름
  - 기본 역할 (신규 사용자 기본 역할)
  - 회원 가입 허용 여부 (ON/OFF)
- **보안 설정**:
  - 세션 만료 시간
  - 비밀번호 정책 (최소 길이, 복잡도)
- **데이터 설정**:
  - 최대 업로드 파일 크기
  - 허용된 파일 형식

**Server Actions**:
- `app/admin/settings/actions.ts` (신규 생성)
  - `getSettings()`: `settings` 테이블에서 조회
  - `updateSettings(settings)`: `settings` 테이블 업데이트

**성공 기준**:
- ✅ 설정 조회/수정 기능
- ✅ 변경 사항 즉시 반영
- ✅ 회원 가입 ON/OFF 동작

#### Task 3.5: 감사 로그 페이지
**목표**: 모든 사용자 활동 기록 조회

**파일**: `app/admin/audit-logs/page.tsx` (신규 생성)

**기능**:
- **로그 목록 테이블**:
  - 타임스탬프, 사용자, 액션, 리소스, IP 주소
  - 검색 (사용자, 액션)
  - 필터 (날짜 범위, 액션 타입)
  - 페이지네이션
- **상세 정보**:
  - 로그 클릭 시 상세 정보 모달
  - `details` JSON 필드 표시

**Server Actions**:
- `app/admin/audit-logs/actions.ts` (신규 생성)
  - `getAuditLogs(filters)`: `audit_logs` 테이블 조회
  - `exportAuditLogs(filters)`: CSV/Excel 내보내기

**성공 기준**:
- ✅ 로그 목록 조회
- ✅ 검색/필터 동작
- ✅ 상세 정보 표시
- ✅ 내보내기 기능

---

### Phase 4: 감사 로깅 통합 (선택사항, 권장)

#### Task 4.1: Audit Log Helper 함수
**목표**: 모든 중요한 액션에 감사 로그 기록

**파일**: `lib/audit.ts` (확장 또는 신규)

**기능**:
- `logAction(userId, action, resource, details)`: `audit_logs` 테이블에 삽입
- 자동으로 IP 주소, User-Agent 수집 (Server Action에서)

**통합 위치**:
- 사용자 승인/수정/삭제
- 데이터 업로드
- 리포트 생성
- 권한 변경

**성공 기준**:
- ✅ 모든 관리자 액션 로깅
- ✅ 데이터 업로드 로깅
- ✅ 로그 조회 페이지에서 확인 가능

---

### Phase 5: UI/UX 개선 (선택사항)

#### Task 5.1: 승인 대기 페이지
**목표**: 미승인 사용자에게 안내 페이지

**파일**: `app/pending-approval/page.tsx` (신규 생성)

**내용**:
- "승인 대기 중입니다" 메시지
- 관리자에게 문의 안내
- 로그아웃 버튼

#### Task 5.2: 프로필 페이지
**목표**: 사용자가 자신의 정보 확인/수정

**파일**: `app/profile/page.tsx` (신규 생성)

**기능**:
- 이메일, 이름 표시
- 비밀번호 변경 (Supabase `updateUser()`)
- 역할 표시 (읽기 전용)

#### Task 5.3: 관리자 대시보드 홈
**목표**: 관리자 페이지 메인 대시보드

**파일**: `app/admin/page.tsx` (신규 생성)

**내용**:
- 통계 카드 (총 사용자, 미승인 사용자, 오늘의 활동)
- 최근 활동 목록
- 빠른 액션 버튼

---

## 🔒 보안 고려사항

### 1. 비밀번호 보안
- ✅ Supabase가 자동으로 bcrypt 해시 저장
- ✅ 비밀번호 정책 강제 (Supabase 설정 또는 앱 레벨)
- ✅ 비밀번호 재설정 토큰 (Supabase 기본 제공)

### 2. 세션 보안
- ✅ Supabase Auth의 JWT 기반 세션
- ✅ HttpOnly 쿠키 (Supabase 기본)
- ✅ Secure 쿠키 (HTTPS 환경)
- ✅ 세션 만료 시간 설정 (Supabase 설정)

### 3. 권한 체크
- ✅ Middleware에서 역할 체크
- ✅ Server Actions에서 이중 체크
- ✅ RLS (Row Level Security)로 데이터베이스 레벨 보안
- ✅ 클라이언트 UI는 보안 목적이 아닌 UX 목적

### 4. SQL Injection 방지
- ✅ Supabase Client 사용 (자동 파라미터화)
- ✅ Prisma 사용 시 자동 이스케이프
- ✅ Raw Query 사용 시 파라미터화

### 5. CSRF 방지
- ✅ Supabase Auth 기본 CSRF 보호
- ✅ SameSite 쿠키

### 6. RLS (Row Level Security)
- ✅ 테이블 레벨 보안 정책
- ✅ 사용자는 자신의 데이터만 조회 가능
- ✅ ADMIN은 모든 데이터 조회 가능

---

## 📦 필요한 패키지

### 추가 설치 필요
- ❌ `@supabase/supabase-js`: Supabase JavaScript 클라이언트
- ❌ `@supabase/ssr`: Next.js SSR 지원

### 이미 설치됨 (사용 가능)
- ✅ `zod@^4.1.12` (유효성 검사)
- ✅ `@prisma/client@^6.19.0` (선택사항, Supabase와 함께 사용 가능)

### 제거 가능 (선택사항)
- ⚠️ `next-auth@^5.0.0-beta.30` (Supabase Auth 사용 시 불필요)
- ⚠️ `@auth/prisma-adapter@^2.11.1` (Supabase Auth 사용 시 불필요)
- ⚠️ `bcryptjs@^3.0.3` (Supabase가 자동 처리)

---

## 🗄️ 데이터베이스 스키마

### Supabase Database 테이블

1. **`user_profiles`**: 사용자 프로필 확장
2. **`permissions`**: 권한 정의
3. **`user_permissions`**: 사용자별 권한
4. **`audit_logs`**: 감사 로그
5. **`settings`**: 시스템 설정

### Supabase Auth 테이블 (자동 생성)
- `auth.users`: Supabase Auth가 자동 관리
- `auth.sessions`: Supabase Auth가 자동 관리

---

## 🚀 구현 우선순위

### 🔴 Phase 0 (필수) - 1일
1. Supabase 프로젝트 생성 및 설정
2. Supabase 클라이언트 설치 및 설정

### 🔴 Phase 1 (필수) - 2일
1. 데이터베이스 스키마 설계 및 생성
2. 초기 데이터 시드

### 🔴 Phase 2 (필수) - 1주
1. 회원 가입 페이지
2. 로그인 페이지
3. Middleware 보호
4. 로그아웃 기능

### 🟡 Phase 3 (핵심) - 2주
1. 관리자 레이아웃
2. 사용자 관리 페이지
3. 권한 관리 페이지
4. 시스템 설정 페이지
5. 감사 로그 페이지

### 🟢 Phase 4 (권장) - 1주
1. Audit Log 통합

### 🟢 Phase 5 (선택) - 1주
1. 승인 대기 페이지
2. 프로필 페이지
3. 관리자 대시보드 홈

---

## 📝 구현 체크리스트

### Phase 0: Supabase 설정
- [ ] Task 0.1: Supabase 프로젝트 생성 및 설정
- [ ] Task 0.2: Supabase 클라이언트 설치 및 설정

### Phase 1: 데이터베이스 스키마
- [ ] Task 1.1: Supabase Database 스키마 설계
- [ ] Task 1.2: Supabase Database에 테이블 생성
- [ ] Task 1.3: 초기 데이터 시드

### Phase 2: 인증 시스템
- [ ] Task 2.1: 회원 가입 페이지
- [ ] Task 2.2: 로그인 페이지
- [ ] Task 2.3: Middleware 보호 강화
- [ ] Task 2.4: 로그아웃 기능

### Phase 3: 관리자 페이지
- [ ] Task 3.1: 관리자 레이아웃
- [ ] Task 3.2: 사용자 관리 페이지
- [ ] Task 3.3: 권한 관리 페이지
- [ ] Task 3.4: 시스템 설정 페이지
- [ ] Task 3.5: 감사 로그 페이지

### Phase 4: 감사 로깅
- [ ] Task 4.1: Audit Log Helper 함수

### Phase 5: UI/UX 개선
- [ ] Task 5.1: 승인 대기 페이지
- [ ] Task 5.2: 프로필 페이지
- [ ] Task 5.3: 관리자 대시보드 홈

---

## 🎓 예상 효과

### 보안
- ✅ 승인된 사용자만 접근 가능
- ✅ 모든 활동 추적 (감사 로그)
- ✅ 역할 기반 접근 제어
- ✅ RLS로 데이터베이스 레벨 보안

### 관리 효율성
- ✅ 중앙화된 사용자 관리
- ✅ 권한 관리 자동화
- ✅ 시스템 설정 통합 관리
- ✅ Supabase 대시보드에서도 관리 가능

### 사용자 경험
- ✅ 간단한 회원 가입 프로세스
- ✅ 명확한 승인 상태 안내
- ✅ 직관적인 관리자 인터페이스

### 개발 효율성
- ✅ Supabase Auth로 인증 로직 간소화
- ✅ 자동 비밀번호 해싱
- ✅ 세션 관리 자동화
- ✅ RLS로 보안 정책 간소화

---

## ⚠️ 주의사항

1. **초기 관리자 계정 생성**
   - 첫 배포 시 관리자 계정을 수동으로 Supabase에서 생성
   - 또는 시드 스크립트 작성

2. **환경 변수 설정**
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (서버 사이드만 사용)

3. **RLS 정책 테스트**
   - 각 테이블의 RLS 정책을 충분히 테스트
   - 일반 사용자와 ADMIN 사용자로 각각 테스트

4. **Supabase 서비스 한도**
   - 무료 플랜의 한도 확인 (사용자 수, API 요청 수 등)
   - 필요 시 유료 플랜 고려

5. **비밀번호 정책**
   - Supabase 대시보드에서 비밀번호 정책 설정
   - 또는 앱 레벨에서 유효성 검사

---

## 📄 관련 문서

- **Supabase 문서**: https://supabase.com/docs
- **Supabase Auth 문서**: https://supabase.com/docs/guides/auth
- **Supabase RLS 문서**: https://supabase.com/docs/guides/auth/row-level-security
- **Supabase JavaScript 클라이언트**: https://supabase.com/docs/reference/javascript
- **Next.js + Supabase 가이드**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

**다음 단계**: 사용자 승인 후 Executor 모드로 Phase 0부터 순차 구현
