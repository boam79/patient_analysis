# 제작자 페이지 구성 계획 (옵션 2: 같은 프로젝트)

**작성일**: 2024-12-XX  
**작성자**: Planner  
**상태**: 계획 단계  
**구조**: 같은 프로젝트 내 `/admin` 경로 (옵션 2) ✅

---

## 📋 프로젝트 개요

### 목적
제작자(ADMIN) 전용 관리 페이지를 메인 대시보드와 같은 프로젝트 내에 `/admin` 경로로 구성

### 선택된 옵션
✅ **옵션 2: 같은 프로젝트 + `/admin` 경로**
- 현재 Vercel 배포 주소: `patient-analysis.vercel.app`
- 제작자 페이지 URL: `patient-analysis.vercel.app/admin`
- 하나의 Vercel 프로젝트로 관리
- 기존 컴포넌트 및 라이브러리 재사용 가능

### 프로젝트 구조
```
Patient_Analysis/              # 하나의 프로젝트 (현재 프로젝트)
├── app/
│   ├── dashboard/            # 메인 대시보드 (/dashboard)
│   ├── admin/                # 제작자 페이지 (/admin) ⭐ 신규 추가
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── users/
│   │   ├── monitoring/
│   │   ├── logs/
│   │   └── ...
│   └── ...
├── components/
│   ├── admin/                # 제작자 페이지 컴포넌트 ⭐ 신규 추가
│   └── ...
└── ...
```

### 배포 구조 (옵션 2 선택 ✅)

**웹주소 구조**:
- **메인 프로젝트**: `patient-analysis.vercel.app` (현재 배포된 주소)
- **제작자 페이지**: `patient-analysis.vercel.app/admin` ⭐ (같은 도메인, `/admin` 경로)

**Vercel 배포**:
- 하나의 Vercel 프로젝트로 배포
- 기존 Vercel 프로젝트에 코드 추가 후 재배포
- 별도 Vercel 프로젝트 생성 불필요

**장점**:
- ✅ 하나의 프로젝트로 간단하게 관리
- ✅ 공통 컴포넌트/라이브러리 재사용 (shadcn/ui, Zustand 등)
- ✅ 배포가 한 번에 이루어짐
- ✅ 초기 설정이 단순 (별도 프로젝트 생성 불필요)
- ✅ 현재 Vercel 배포 주소에 `/admin`만 추가하면 됨

---

## 🎯 핵심 원칙

### 1. 경로 기반 분리 (옵션 2)
- 메인 대시보드와 같은 프로젝트 내 경로 분리 (`/dashboard` vs `/admin`)
- 공통 컴포넌트/라이브러리 재사용 (shadcn/ui, Zustand 등)
- 하나의 Vercel 프로젝트로 배포
- Middleware를 통한 접근 제어 (ADMIN 역할만 `/admin/*` 접근)

### 2. 데이터 프라이버시 보장
- ✅ 제작자는 사용자가 업로드한 실제 데이터(환자 정보 등)를 볼 수 없음
- ✅ 메타데이터만 관리 (파일명, 업로드 시간, 레코드 수, 파일 크기)
- ✅ 사용자 활동 로그만 기록 (로그인/로그아웃, 페이지 방문)
- ✅ IP 주소 기록: 메인 대시보드 접근 시 IP 주소 자동 기록 (회원가입 없이도 기록)

### 3. 공통 인프라 공유
- 같은 Supabase 프로젝트 사용
- 같은 데이터베이스 스키마 (`user_profiles`, `user_sessions`, `audit_logs`, `ip_access_logs` 등)
- 독립적인 인증 세션 (Supabase Auth)

### 4. 제작자 계정 관리 방식
- **초기 관리자 계정**: 시드 스크립트로 직접 생성 (회원가입 불필요)
- **제작자 페이지 회원가입**: ❌ **다음 버전(v2)에서 구현 예정**
- **제작자 추가**: 기존 관리자가 사용자 관리 페이지에서 직접 계정 생성 또는 초대
- **보안**: 제작자 페이지는 ADMIN 역할만 접근 가능, 회원가입 페이지 미제공

### 5. IP 로그 기록 시스템
- **목적**: 메인 대시보드 접근 추적 및 보안 모니터링
- **범위**: 회원가입 없이도 모든 접근 기록 (익명 접근 포함)
- **기록 항목**: IP 주소, 접근 시간, 요청 경로, User-Agent, Referer
- **저장 위치**: Supabase `ip_access_logs` 테이블
- **조회 권한**: 제작자(ADMIN)만 접근 가능

---

## 📊 프로젝트 구조 (옵션 2: 같은 프로젝트)

### 현재 프로젝트에 추가될 구조
```
Patient_Analysis/              # 현재 프로젝트 (기존 구조 유지)
├── app/
│   ├── dashboard/            # 기존: 메인 대시보드
│   ├── admin/                # ⭐ 신규: 제작자 페이지 (/admin)
│   │   ├── layout.tsx        # 제작자 전용 레이아웃
│   │   ├── page.tsx          # 대시보드 홈 (/admin)
│   │   ├── login/            # 제작자 로그인 (/admin/login)
│   │   │   └── page.tsx
│   │   ├── users/            # 사용자 관리 (/admin/users)
│   │   │   └── page.tsx
│   │   ├── monitoring/       # 시스템 모니터링 (/admin/monitoring)
│   │   │   └── page.tsx
│   │   ├── logs/             # 로그 분석 (/admin/logs)
│   │   │   └── page.tsx
│   │   ├── maintenance/      # 시스템 유지보수 (/admin/maintenance)
│   │   │   └── page.tsx
│   │   ├── statistics/       # 대시보드 통계 (/admin/statistics)
│   │   │   └── page.tsx
│   │   └── audit/            # 감사 로그 (/admin/audit)
│   │       └── page.tsx
│   ├── api/
│   │   ├── log-ip/           # 기존: IP 로그 기록 API
│   │   └── admin/            # ⭐ 신규: 제작자 페이지 API
│   │       └── ...
│   └── ...
├── components/
│   ├── admin/                # ⭐ 신규: 제작자 페이지 컴포넌트
│   │   ├── layout/
│   │   │   ├── admin-header.tsx
│   │   │   └── admin-sidebar.tsx
│   │   ├── dashboard/
│   │   │   ├── admin-dashboard-stats.tsx
│   │   │   ├── admin-recent-activity.tsx
│   │   │   └── admin-quick-actions.tsx
│   │   ├── users/
│   │   │   ├── user-management-table.tsx
│   │   │   └── user-detail-panel.tsx
│   │   ├── logs/
│   │   │   ├── log-viewer.tsx
│   │   │   ├── ip-log-table.tsx
│   │   │   └── ip-statistics-cards.tsx
│   │   └── ...
│   ├── charts/               # 기존: 차트 컴포넌트
│   ├── map/                  # 기존: 지도 컴포넌트
│   └── ui/                   # 기존: shadcn/ui 컴포넌트 (재사용)
├── lib/
│   ├── supabase/             # ⭐ 신규: Supabase 클라이언트
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ip-utils.ts           # 기존: IP 유틸리티 (메인 대시보드)
│   └── ...                   # 기존 라이브러리들
├── middleware.ts             # ⭐ 수정: /admin 경로 접근 제어 추가
├── package.json              # ⭐ 수정: Supabase 패키지 추가
└── ...                       # 기존 파일들
```

### 주요 변경사항
- ✅ **신규 추가**: `app/admin/` 디렉토리 및 하위 페이지들
- ✅ **신규 추가**: `components/admin/` 디렉토리
- ✅ **신규 추가**: `lib/supabase/` 디렉토리
- ✅ **수정**: `middleware.ts`에 `/admin/*` 경로 보호 로직 추가
- ✅ **수정**: `package.json`에 Supabase 관련 패키지 추가
- ✅ **재사용**: 기존 `components/ui/` 컴포넌트 그대로 사용

---

## 🛠️ 기술 스택

### 필수 패키지
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "recharts": "^3.4.1",
    "lucide-react": "^0.553.0",
    "date-fns": "^3.0.0",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^9.39.1",
    "eslint-config-next": "^16.0.5"
  }
}
```

### UI 라이브러리
- **shadcn/ui**: 메인 프로젝트와 동일한 UI 컴포넌트 사용
- **Tailwind CSS**: 스타일링
- **Recharts**: 통계 차트

---

## 📋 구현 단계

### Phase 0: 프로젝트 준비 (옵션 2 - 현재 프로젝트에 추가)

#### Task 0.1: 필수 패키지 설치 (현재 프로젝트)
```bash
cd /Users/parkjaemin/Documents/app/Patient_Analysis
npm install @supabase/supabase-js @supabase/ssr
npm install date-fns zod
# lucide-react, recharts는 이미 설치되어 있을 수 있음
```

**참고**: 
- shadcn/ui는 이미 초기화되어 있으므로 추가 설치 불필요
- 기존 UI 컴포넌트를 그대로 재사용

#### Task 0.2: 환경 변수 설정
`.env.local` 파일에 추가 (이미 있으면 수정):
```env
# Supabase 설정 (제작자 페이지용)
NEXT_PUBLIC_SUPABASE_URL=https://bkmzuabmkbtxtetuzyaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Task 0.3: 디렉토리 구조 생성
현재 프로젝트에 다음 디렉토리 구조 생성:
```bash
mkdir -p app/admin/{login,users,monitoring,logs,maintenance,statistics,audit}
mkdir -p components/admin/{layout,dashboard,users,logs,monitoring}
mkdir -p lib/supabase
```

**성공 기준**:
- ✅ Supabase 패키지 설치 완료
- ✅ 환경 변수 설정 완료
- ✅ 디렉토리 구조 생성 완료
- ✅ 기존 프로젝트 정상 작동 확인 (`npm run dev`)

---

### Phase 1: Supabase 클라이언트 설정 (1일)

#### Task 1.1: Supabase 클라이언트 파일 생성
- `lib/supabase/client.ts`: 클라이언트 사이드 클라이언트
- `lib/supabase/server.ts`: 서버 사이드 클라이언트
- `lib/supabase/middleware.ts`: Middleware용 클라이언트

#### Task 1.2: Middleware 설정
- `middleware.ts`: 세션 갱신 및 접근 제어

#### Task 1.3: IP 로그 기록 시스템 설계 및 구현 (메인 대시보드)
**목표**: 메인 대시보드 접근 시 IP 주소 자동 기록

**메인 대시보드 작업 (Patient_Analysis 프로젝트)**:

1. **데이터베이스 스키마 추가**:
   - `prisma/schema.prisma`에 `IpAccessLog` 모델 추가
   ```prisma
   model IpAccessLog {
     id          String   @id @default(cuid())
     ipAddress   String
     path        String
     userAgent   String?
     referer     String?
     country     String?
     city        String?
     createdAt   DateTime @default(now())
     
     @@index([ipAddress])
     @@index([createdAt])
     @@index([path])
   }
   ```

2. **IP 로그 기록 API Route 생성**:
   - `app/api/log-ip/route.ts`: IP 접근 로그 저장
   - 요청 헤더에서 IP 추출 (X-Forwarded-For, X-Real-IP 처리)
   - Supabase에 로그 저장

3. **Middleware에서 IP 로그 기록**:
   - `middleware.ts`: 메인 대시보드 경로 접근 시 IP 로그 API 호출
   - 비동기 로깅으로 성능 영향 최소화

4. **IP 정보 조회 유틸리티**:
   - `lib/ip-utils.ts`: IP 주소 추출 함수 (프록시 환경 고려)
   - IP 기반 지리적 정보 조회 (선택사항: IP Geolocation API)

**성공 기준**:
- ✅ Supabase 클라이언트 초기화 완료
- ✅ Middleware에서 세션 갱신 동작 확인
- ✅ IP 로그 기록 API Route 동작 확인
- ✅ 메인 대시보드 접근 시 IP 로그 자동 저장 확인

---

### Phase 2: 인증 시스템 (2일)

**중요**: 제작자 페이지는 **회원가입 기능이 없습니다**. 초기 관리자 계정은 시드 스크립트로 생성하며, 추가 관리자는 기존 관리자가 직접 생성합니다. 제작자 페이지 회원가입 기능은 **다음 버전(v2)에서 구현 예정**입니다.

#### Task 2.1: 초기 관리자 계정 생성 (시드 스크립트)
- **목적**: 제작자 페이지 최초 접근을 위한 관리자 계정 생성
- **방식**: Supabase Admin API를 사용한 시드 스크립트
- **파일**: `scripts/seed-admin.ts` 또는 Supabase Migration SQL

**시드 스크립트 내용**:
1. Supabase Auth에 관리자 계정 생성 (Service Role Key 사용)
2. `user_profiles` 테이블에 ADMIN 역할 프로필 생성
3. 초기 비밀번호는 환경 변수 또는 설정 파일에서 로드
4. 첫 로그인 시 비밀번호 변경 유도 (선택사항)

**주의사항**:
- 초기 관리자 계정 정보는 안전하게 보관
- 프로덕션 환경에서는 환경 변수로 관리
- 시드 스크립트는 최초 1회만 실행

#### Task 2.2: 제작자 로그인 페이지
- **경로**: `/admin/login`
- **파일**: `app/admin/login/page.tsx`
- `components/admin/admin-login-form.tsx`
- Server Actions: `app/admin/login/actions.ts`

**기능**:
- 이메일/비밀번호 로그인만 지원 (회원가입 버튼 없음)
- Supabase Auth 로그인
- ADMIN 역할 확인
- 미승인 또는 ADMIN이 아닌 사용자는 접근 거부
- 로그인 성공 시 `/admin`으로 리다이렉트

#### Task 2.3: Middleware 수정
- `middleware.ts` 수정: `/admin/*` 경로 보호 로직 추가
- 로그인하지 않은 사용자는 `/admin/login`으로 리다이렉트
- ADMIN 역할이 아닌 사용자는 접근 거부

**성공 기준**:
- ✅ 초기 관리자 계정 시드 스크립트 실행 가능
- ✅ 로그인 페이지 렌더링 (회원가입 링크 없음)
- ✅ Supabase Auth로 로그인 가능
- ✅ ADMIN 역할 확인 후 `/admin`으로 리다이렉트
- ✅ ADMIN이 아닌 사용자는 접근 거부

---

### Phase 3: 제작자 레이아웃 및 대시보드 홈 (2일)

#### Task 3.1: 제작자 레이아웃
- `app/admin/layout.tsx`:
  - ADMIN 역할 확인
  - Sidebar + Header 구성
  - 미승인 사용자 리다이렉트
  - `/admin/login` 경로는 레이아웃 제외

#### Task 3.2: Sidebar 컴포넌트
- `components/admin/admin-sidebar.tsx`:
  - 대시보드 홈
  - 사용자 관리
  - 시스템 모니터링
  - 로그 분석
  - 시스템 유지보수
  - 대시보드 통계
  - 감사 로그

#### Task 3.3: Header 컴포넌트
- `components/admin/admin-header.tsx`:
  - 제작자 정보 표시
  - 로그아웃 버튼

#### Task 3.4: 대시보드 홈
- `app/admin/page.tsx`:
  - 시스템 전체 통계
  - 최근 활동 요약
  - 빠른 액션

**성공 기준**:
- ✅ 제작자 레이아웃 렌더링
- ✅ Sidebar 네비게이션 동작
- ✅ 대시보드 홈에 통계 표시

---

### Phase 4: 사용자 관리 페이지 (2일)

#### Task 4.1: 사용자 목록 테이블
- `app/admin/users/page.tsx`
- `components/admin/user-management-table.tsx`
- Server Actions: `app/admin/users/actions.ts`

**기능**:
- 사용자 목록 조회 (이메일, 이름, 역할, 승인 상태, 가입일, 마지막 로그인)
- 검색 (이메일, 이름)
- 필터 (승인/미승인, 역할별)
- 페이지네이션
- 사용자 승인/거부
- 역할 변경
- **제작자 계정 생성** (새 관리자 계정 직접 생성)
  - Supabase Admin API를 사용한 계정 생성
  - 이메일, 이름, 초기 비밀번호 입력
  - 역할: ADMIN 자동 지정
  - 생성 후 이메일로 초대 링크 전송 (선택사항)
- 사용자 삭제

**참고**: 제작자 페이지 자체의 회원가입 기능은 **다음 버전(v2)에서 구현 예정**입니다. 현재 버전에서는 기존 관리자가 사용자 관리 페이지에서 직접 계정을 생성합니다.

**성공 기준**:
- ✅ 사용자 목록 조회 성공
- ✅ 승인 기능 동작
- ✅ 역할 변경 반영
- ✅ 제작자 계정 생성 기능 동작
- ✅ 삭제 시 확인 다이얼로그

---

### Phase 5: 시스템 모니터링 페이지 (2일)

#### Task 5.1: 시스템 모니터링 패널
- `app/admin/monitoring/page.tsx`
- `components/admin/system-monitoring-panel.tsx`

**기능**:
- 서버 상태 (CPU, 메모리, 디스크)
- API 응답 시간
- 에러율
- 데이터베이스 상태
- 실시간 알림

**성공 기준**:
- ✅ 시스템 상태 표시
- ✅ 실시간 업데이트 (폴링 또는 WebSocket)

---

### Phase 6: 로그 분석 페이지 (2일)

#### Task 6.1: 로그 뷰어
- `app/admin/logs/page.tsx`
- `components/admin/log-viewer.tsx`
- Server Actions: `app/admin/logs/actions.ts`

**기능**:
- 사용자 활동 로그 (로그인/로그아웃, 페이지 방문, 세션 지속 시간)
- 시스템 로그 (에러, 경고, 정보)
- **IP 접근 로그 (신규 추가)**
  - IP 주소별 접근 통계
  - 시간대별 접근 패턴
  - 경로별 접근 빈도
  - IP 주소 지도 시각화 (선택사항)
  - 의심스러운 IP 탐지 (예: 짧은 시간 내 다수 요청)
- 로그 필터링 (날짜 범위, 사용자별, 로그 레벨별, IP 주소별)
- 로그 검색 (IP 주소, 경로, User-Agent 검색)
- 로그 내보내기 (CSV/Excel)

#### Task 6.2: IP 로그 조회 및 분석 기능
**목표**: 메인 대시보드의 IP 접근 로그를 제작자 페이지에서 조회 및 분석

**구현 파일**:
- `components/admin/ip-log-viewer.tsx`: IP 로그 전용 뷰어 컴포넌트
- Server Actions: `app/admin/logs/actions.ts`에 IP 로그 조회 함수 추가

**기능**:
1. **IP 로그 목록 테이블**:
   - IP 주소, 접근 시간, 접근 경로, User-Agent, Referer
   - 페이지네이션 (100개씩)
   - 정렬 (시간, IP 주소, 접근 횟수)

2. **IP 통계 대시보드**:
   - Top 10 접근 IP (접근 횟수 기준)
   - 일별/시간대별 접근 추이 차트
   - 경로별 접근 분포 파이 차트
   - 지리적 분포 (IP Geolocation 기반)

3. **IP 필터링 및 검색**:
   - IP 주소 검색 (부분 일치)
   - 날짜 범위 필터
   - 경로 필터
   - 특정 IP 주소의 상세 활동 내역

4. **보안 모니터링**:
   - 이상 접근 패턴 감지 (예: 단일 IP에서 초당 10회 이상)
   - 의심스러운 User-Agent 탐지
   - IP 주소 블랙리스트 관리 (선택사항)

5. **데이터 내보내기**:
   - IP 로그 CSV/Excel 내보내기
   - IP 통계 리포트 생성

**성공 기준**:
- ✅ 로그 목록 조회
- ✅ 필터링 동작
- ✅ 내보내기 기능 동작
- ✅ IP 로그 조회 및 통계 표시
- ✅ 이상 접근 패턴 감지 기능 동작

---

### Phase 7: 시스템 유지보수 페이지 (1일)

#### Task 7.1: 유지보수 페이지
- `app/admin/maintenance/page.tsx`

**기능**:
- 데이터베이스 관리 (테이블 통계, 인덱스 최적화)
- 캐시 관리 (캐시 초기화, 캐시 통계)
- 시스템 설정 (환경 변수 확인, 기능 플래그)
- 유지보수 모드 (시스템 점검 모드)

**성공 기준**:
- ✅ 유지보수 기능 동작
- ✅ 유지보수 모드 활성화/비활성화

---

### Phase 8: 대시보드 통계 페이지 (2일)

#### Task 8.1: 통계 차트
- `app/admin/statistics/page.tsx`
- `components/admin/statistics-charts.tsx`

**기능**:
- 사용자 통계 (가입 추이, 활성 사용자 추이, 유지율, 역할별 분포)
- 사용량 통계 (로그인 수, 세션 지속 시간, 페이지별 방문 수, 피크 시간대)
- 데이터 업로드 통계 (메타데이터만: 총 업로드 횟수, 평균 파일 크기, 평균 레코드 수)
- 차트 및 시각화 (라인 차트, 파이 차트, 바 차트)

**성공 기준**:
- ✅ 통계 데이터 조회
- ✅ 차트 렌더링
- ✅ 날짜 범위 필터 동작

---

### Phase 9: 감사 로그 페이지 (1일)

#### Task 9.1: 감사 로그 페이지
- `app/admin/audit/page.tsx`
- Server Actions: `app/admin/audit/actions.ts`

**기능**:
- 모든 관리자 액션 기록 (사용자 승인/거부, 역할 변경, 사용자 삭제, 설정 변경)
- 상세 정보 (타임스탬프, 실행한 관리자, 변경 전/후 값, **IP 주소**)
- **IP 주소는 제작자 페이지 접근 시 자동 기록**
- 검색 및 필터 (날짜 범위, 액션 타입별, 사용자별, IP 주소별)

**성공 기준**:
- ✅ 감사 로그 조회
- ✅ 검색/필터 동작

---

## 🔐 보안 고려사항

### 1. 접근 제어
- **Middleware**: 모든 `/admin/*` 경로에 대해 ADMIN 역할 확인
- **Layout**: 서버 사이드에서 ADMIN 역할 재확인
- **Server Actions**: 모든 관리자 액션에서 권한 재확인

### 2. RLS 정책
- 제작자는 `user_profiles` 전체 조회 가능
- 일반 사용자는 자신의 프로필만 조회 가능
- `audit_logs`는 ADMIN만 조회 가능
- `ip_access_logs`는 ADMIN만 조회 가능 (메인 대시보드 접근 로그)

### 3. 데이터 프라이버시
- 사용자 업로드 데이터는 조회 불가
- 메타데이터만 저장 및 조회
- 감사 로그에도 실제 데이터 미포함

---

## 📊 추가 제안 기능 (향후 고도화)

### 1. 보안·접근 제어 고도화

- IP / 접속 패턴 이상 징후 알림
  - 특정 IP에서 짧은 시간 내 과도한 요청 발생 시 관리자 페이지에 경고 배지 표시
  - 해외 IP 또는 평소와 다른 지역에서의 접속 패턴 감지
  - 반복 로그인 실패·비정상적인 인증 시도에 대한 요약 지표 제공
- 간단 블랙리스트 / 화이트리스트 관리
  - IP·IP 대역, User-Agent 기반 차단 리스트 관리
  - 병원/기관 내부망 IP를 화이트리스트로 등록하여 “신뢰된 접속” 구분

### 2. 사용자·조직 운영 기능

- 라이선스 / 시트(Seat) 관리
  - 병원/조직별 활성 사용자 수, 남은 사용 가능 슬롯 수 표시
  - 조직 단위 사용량 통계(로그인 수, 대시보드 사용 시간, 활성 사용자 비율) 제공
- 템플릿 기반 권한 프리셋
  - 예: “원장”, “분석 담당자”, “레지던트/인턴” 등 역할 프리셋 정의
  - 신규 사용자 생성 시 프리셋 선택만으로 역할·권한 일괄 설정

### 3. 데이터 사용·품질 모니터링

- 업로드 데이터 품질 리포트
  - 업로드 직후 누락 비율, 이상값(음수, 비현실적인 나이 등), 코드 매핑 실패율 자동 계산
  - “이 데이터로 분석 시 이런 한계가 있다”는 경고 배지/알림 제공
- 데이터 스키마 변화 감지
  - 컬럼 추가/삭제/이름 변경 등 스키마 변화 감지 시 제작자 페이지에 경고 표시
  - “최근 7일 내 스키마 변화 감지”와 같은 타임라인 로그 제공

### 4. 분석 활용도·가치 측정

- 대시보드 사용 인사이트
  - 가장 많이 사용된 탭/차트 TOP N
  - 평균 세션 길이, 사용자별 재방문 빈도, 피크 사용 시간대
  - 병원/지점별 사용량 비교로 “가장 적극적으로 활용하는 조직” 파악
- 즐겨찾기/프리셋 관리
  - 현장에서 자주 사용하는 필터 조합을 “템플릿”으로 저장
  - 제작자가 템플릿 사용 빈도를 보고 “공식 추천 프리셋”으로 승격할 수 있는 기능

---

## 📦 배포 계획 (옵션 2: 같은 프로젝트)

### Vercel 배포
1. **기존 Vercel 프로젝트 사용**: 현재 배포된 `patient-analysis` 프로젝트 그대로 사용
2. **Git 저장소**: 기존 저장소에 코드 추가 후 푸시
3. **자동 배포**: Vercel이 자동으로 감지하여 재배포
4. **환경 변수 설정**: Vercel 대시보드에서 기존 환경 변수에 Supabase 관련 변수 추가

### 접근 URL
- **메인 대시보드**: `patient-analysis.vercel.app/dashboard`
- **제작자 페이지**: `patient-analysis.vercel.app/admin` ⭐

### 환경 변수 추가 (Vercel 대시보드)
기존 환경 변수에 다음 추가:
```env
NEXT_PUBLIC_SUPABASE_URL=https://bkmzuabmkbtxtetuzyaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 배포 프로세스
1. 로컬에서 코드 작성 및 테스트
2. Git 커밋 및 푸시
3. Vercel 자동 배포 트리거
4. 배포 완료 후 `patient-analysis.vercel.app/admin` 접속 확인

---

## 📊 예상 일정

| Phase | 작업 | 예상 기간 |
|-------|------|----------|
| Phase 0 | 프로젝트 준비 (패키지 설치, 디렉토리 생성) | 0.5일 |
| Phase 1 | Supabase 클라이언트 설정 + IP 로그 시스템 (메인 대시보드) | 2일 |
| Phase 2 | 인증 시스템 | 2일 |
| Phase 3 | 제작자 레이아웃 및 대시보드 홈 | 2일 |
| Phase 4 | 사용자 관리 페이지 | 2일 |
| Phase 5 | 시스템 모니터링 페이지 | 2일 |
| Phase 6 | 로그 분석 페이지 + IP 로그 조회 기능 | 3일 |
| Phase 7 | 시스템 유지보수 페이지 | 1일 |
| Phase 8 | 대시보드 통계 페이지 | 2일 |
| Phase 9 | 감사 로그 페이지 | 1일 |
| **총계** | | **17.5일 (약 3-4주)** |

**참고**: Phase 0이 별도 프로젝트 생성에서 패키지 설치 및 디렉토리 생성으로 단순화되어 0.5일로 단축되었습니다.

---

## ✅ 다음 단계

사용자 승인 후 Executor 모드로 Phase 0부터 순차 구현

---

## 🔮 다음 버전(v2) 구현 예정 기능

### 제작자 페이지 회원가입 기능

**현재 버전(v1)에서는 제작자 페이지에 회원가입 기능이 없습니다.**

**인증 방식 (v1)**:
- ✅ 초기 관리자 계정: 시드 스크립트로 직접 생성
- ✅ 추가 관리자 계정: 기존 관리자가 사용자 관리 페이지에서 직접 생성
- ✅ 로그인만 지원 (회원가입 페이지 없음)

**다음 버전(v2)에서 추가 예정**:

#### 1. 제작자 회원가입 페이지
- **경로**: `/admin/register` 또는 `/admin/signup`
- **기능**:
  - 제작자용 회원가입 폼 (이메일, 비밀번호, 이름, 소속 등)
  - 이메일 인증 (Supabase Auth)
  - 가입 후 "승인 대기" 상태 (`is_approved=false`)
  - 기존 관리자의 승인 필요
- **보안**:
  - 이메일 도메인 화이트리스트 (선택사항)
  - 초대 코드 기반 가입 (더 안전한 옵션)

#### 2. 제작자 초대 시스템
- **기능**:
  - 기존 관리자가 이메일로 초대 링크 발송
  - 초대 링크를 통한 가입 프로세스
  - 초대 토큰 기반 인증 (일회용, 만료 시간 설정)
  - 초대 이력 추적 (누가 누구를 초대했는지)

#### 3. 제작자 역할 세분화 (선택사항)
- **SUPER_ADMIN**: 시스템 최고 관리자 (모든 권한)
- **ADMIN**: 일반 관리자 (사용자 관리, 로그 조회 등)
- **MODERATOR**: 제한된 관리 권한 (로그 조회만, 사용자 승인 불가)

**v1에서 회원가입 기능을 제외한 이유**:
- ✅ **초기 설정 단순화**: 시드 스크립트로 첫 관리자 계정을 생성하는 방식이 더 안전하고 간단
- ✅ **보안 강화**: 제작자 페이지는 민감한 관리 기능이므로, 자동 회원가입보다는 직접 생성 방식을 선호
- ✅ **빠른 MVP 출시**: 복잡한 초대 시스템보다는 핵심 기능 구현에 집중

**v2에서 추가하는 이유**:
- ✅ **사용자 편의성**: 여러 관리자가 필요할 때 초대 시스템이 유용
- ✅ **확장성**: 조직이 커질 때 관리자 추가 프로세스 자동화
- ✅ **감사 추적**: 초대 이력을 통한 책임 추적 가능

---

## 📄 관련 문서

- **인증/관리자 시스템 제안서**: `/docs/AUTH_ADMIN_PROPOSAL.md`
- **Supabase 문서**: https://supabase.com/docs
- **Next.js 문서**: https://nextjs.org/docs

---

## 📝 IP 로그 기록 시스템 상세 설계

### 메인 대시보드 구현 (Patient_Analysis 프로젝트)

#### 1. 데이터베이스 스키마

**Prisma Schema 추가 (`prisma/schema.prisma`)**:
```prisma
model IpAccessLog {
  id          String   @id @default(cuid())
  ipAddress   String   // IPv4 또는 IPv6 주소
  path        String   // 접근한 경로 (예: /dashboard, /dashboard/map)
  method      String   @default("GET") // HTTP 메서드
  userAgent   String?  // 브라우저/클라이언트 정보
  referer     String?  // Referer 헤더
  country     String?  // IP 기반 국가 (IP Geolocation API 결과)
  city        String?  // IP 기반 도시
  statusCode  Int      @default(200) // HTTP 응답 코드
  responseTime Int?    // 응답 시간 (밀리초)
  createdAt   DateTime @default(now())
  
  @@index([ipAddress])
  @@index([createdAt])
  @@index([path])
  @@map("ip_access_logs")
}
```

**Supabase Migration SQL**:
```sql
CREATE TABLE ip_access_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ip_address TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  status_code INTEGER DEFAULT 200,
  response_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ip_access_logs_ip_address ON ip_access_logs(ip_address);
CREATE INDEX idx_ip_access_logs_created_at ON ip_access_logs(created_at);
CREATE INDEX idx_ip_access_logs_path ON ip_access_logs(path);

-- RLS 정책: ADMIN만 조회 가능
ALTER TABLE ip_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only ADMIN can view IP logs"
  ON ip_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );
```

#### 2. IP 추출 유틸리티

**`lib/ip-utils.ts`**:
```typescript
import { NextRequest } from 'next/server'

/**
 * Next.js Request에서 실제 클라이언트 IP 주소 추출
 * 프록시 환경(Vercel, Nginx 등) 고려
 */
export function getClientIp(request: NextRequest): string {
  // 1. X-Forwarded-For 헤더 확인 (프록시가 추가한 IP)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // 첫 번째 IP가 실제 클라이언트 IP (프록시들이 추가한 IP는 쉼표로 구분)
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }

  // 2. X-Real-IP 헤더 확인 (Nginx 프록시)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // 3. 직접 연결 (개발 환경)
  const remoteAddress = request.headers.get('remote-addr')
  if (remoteAddress) {
    return remoteAddress
  }

  // 4. 기본값 (fallback)
  return 'unknown'
}

/**
 * IP 주소 유효성 검사
 */
export function isValidIp(ip: string): boolean {
  // IPv4 정규식
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 정규식 (간단한 버전)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'unknown'
}
```

#### 3. IP 로그 기록 API Route

**`app/api/log-ip/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isValidIp } from '@/lib/ip-utils'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role Key 사용 (RLS 우회)
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, method = 'GET', statusCode = 200, responseTime } = body

    // IP 주소 추출
    const ipAddress = getClientIp(request)
    
    if (!isValidIp(ipAddress)) {
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400 }
      )
    }

    // User-Agent, Referer 추출
    const userAgent = request.headers.get('user-agent') || null
    const referer = request.headers.get('referer') || null

    // IP 로그 저장 (비동기, 에러 무시 - 로그 실패가 서비스에 영향 주지 않도록)
    supabase
      .from('ip_access_logs')
      .insert({
        ip_address: ipAddress,
        path: path || '/',
        method,
        user_agent: userAgent,
        referer: referer,
        status_code: statusCode,
        response_time: responseTime,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to log IP access:', error)
        }
      })
      .catch((err) => {
        console.error('IP logging error:', err)
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('IP logging API error:', error)
    // 에러가 발생해도 200 반환 (로그 실패가 서비스에 영향 주지 않도록)
    return NextResponse.json({ success: false })
  }
}
```

#### 4. Middleware에서 IP 로그 기록

**`middleware.ts` (메인 대시보드 프로젝트)**:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const response = NextResponse.next()

  // 메인 대시보드 경로 접근 시에만 IP 로그 기록
  const shouldLog = request.nextUrl.pathname.startsWith('/dashboard') ||
                    request.nextUrl.pathname === '/'

  if (shouldLog) {
    const responseTime = Date.now() - startTime

    // 비동기로 IP 로그 기록 (응답 차단하지 않음)
    fetch(`${request.nextUrl.origin}/api/log-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // IP 정보를 전달하기 위해 헤더 복사
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'x-real-ip': request.headers.get('x-real-ip') || '',
        'user-agent': request.headers.get('user-agent') || '',
        'referer': request.headers.get('referer') || '',
      },
      body: JSON.stringify({
        path: request.nextUrl.pathname,
        method: request.method,
        responseTime,
      }),
    }).catch((err) => {
      // 에러는 무시 (로깅 실패가 서비스에 영향 주지 않도록)
      console.error('IP logging failed:', err)
    })
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
}
```

### 제작자 페이지 구현 (Patient_Analysis_Admin 프로젝트)

#### 5. IP 로그 조회 Server Actions

**`app/admin/logs/actions.ts`**:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getIpLogs(params: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  ipAddress?: string
  path?: string
}) {
  const supabase = await createClient()
  
  // ADMIN 권한 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  let query = supabase
    .from('ip_access_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // 필터 적용
  if (params.startDate) {
    query = query.gte('created_at', params.startDate)
  }
  if (params.endDate) {
    query = query.lte('created_at', params.endDate)
  }
  if (params.ipAddress) {
    query = query.ilike('ip_address', `%${params.ipAddress}%`)
  }
  if (params.path) {
    query = query.ilike('path', `%${params.path}%`)
  }

  // 페이지네이션
  const page = params.page || 1
  const limit = params.limit || 100
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    logs: data || [],
    total: count || 0,
    page,
    limit,
  }
}

export async function getIpStatistics(params: {
  startDate?: string
  endDate?: string
}) {
  // IP 통계 조회 로직
  // Top 10 IP, 일별/시간대별 접근 추이 등
}
```

이제 문서에 IP 로그 기록 시스템이 추가되었습니다!

---

## 🎨 제작자 페이지 UI/UX 설계

### 디자인 원칙

#### 1. 운영 콘솔(Operations Console) 스타일
- **안정적이고 읽기 쉬운 UI**: 의료 데이터 관리라는 특성상 실수를 방지하고, 정보를 명확하게 전달
- **프로페셔널한 느낌**: 신뢰감 있는 다크/라이트 컬러 조합
- **빠른 정보 파악**: 카드 기반 대시보드 + 상세 테이블 패턴

#### 2. 레이아웃 구조

**전체 레이아웃 (3단 구조)**:
```
┌─────────────────────────────────────────────────────────┐
│ Header (고정, 64px)                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Logo │ [탭/브레드크럼]          │ [프로필] [알림] [로그아웃] │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────┬───────────────────────────────────────────────┤
│         │                                               │
│ Sidebar │  Main Content Area (가변 너비)                │
│ (260px) │                                               │
│ (고정)  │  - 대시보드 홈: 카드 그리드                    │
│         │  - 리스트 페이지: 테이블 + 상세 패널           │
│         │  - 설정 페이지: 폼 + 사이드바                  │
│         │                                               │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

#### 3. 색상 팔레트

**기본 컬러**:
- **Sidebar**: 다크 그레이 배경 (`bg-slate-900` 또는 `bg-zinc-900`)
- **Main Content**: 밝은 배경 (`bg-slate-50` 또는 `bg-white`)
- **Header**: 흰색 배경 + 그림자 (`bg-white shadow-sm`)

**강조 색상**:
- **Primary**: 블루 (`blue-600`, `blue-700`) - 주요 액션 버튼
- **Success**: 초록 (`green-600`) - 승인, 성공 상태
- **Warning**: 주황 (`orange-500`) - 주의 필요
- **Danger**: 빨강 (`red-600`) - 삭제, 차단 액션
- **Info**: 틴트 블루 (`cyan-600`) - 정보성 표시

**상태 색상**:
- **승인됨**: 초록 배지
- **미승인**: 주황 배지
- **차단됨**: 빨강 배지
- **활성**: 초록 점 + 텍스트
- **비활성**: 회색 점 + 텍스트

---

### 컴포넌트별 상세 설계

#### 1. Header (Admin Header)

**위치**: 최상단 고정 (64px 높이)

**구성 요소**:
```
┌────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard / Users / Monitoring / Logs ...  │  [🔔] [👤] [⚙️] │
└────────────────────────────────────────────────────────────┘
```

**기능**:
- 좌측: 로고 + 현재 페이지 브레드크럼 또는 탭 네비게이션
- 우측: 
  - 알림 아이콘 (배지로 미승인 사용자 수, 이상 접근 등 표시)
  - 사용자 프로필 드롭다운 (이름, 역할, 로그아웃)
  - 설정 아이콘 (시스템 설정 빠른 링크)

**디자인**:
- 배경: `bg-white`
- 그림자: `shadow-sm`
- 구분선: 하단 `border-b border-slate-200`
- 높이: `h-16` (64px)

---

#### 2. Sidebar (Admin Sidebar)

**위치**: 좌측 고정 (260px 너비, 반응형에서는 토글 가능)

**구성**:
```
┌──────────────┐
│ 🏠 대시보드    │ ← 활성 상태 (bg-slate-800, border-l-4 border-blue-500)
│ 👥 사용자 관리 │
│ 📊 통계       │
│ 🔍 로그 분석   │
│ 🖥️  모니터링   │
│ 🛠️  유지보수   │
│ 📝 감사 로그   │
│              │
│ [구분선]      │
│ ⚙️  설정      │
└──────────────┘
```

**디자인**:
- 배경: `bg-slate-900` (다크)
- 텍스트: `text-slate-300` (기본), `text-white` (호버/활성)
- 활성 메뉴: `bg-slate-800 border-l-4 border-blue-500`
- 호버: `hover:bg-slate-800`
- 아이콘: Lucide React 아이콘 (24px)
- 폰트: 메뉴 항목 `text-sm font-medium`

**메뉴 항목**:
1. **대시보드 홈** (`/admin`)
   - 아이콘: `LayoutDashboard`
   - 설명: 시스템 전체 통계 및 빠른 액션
2. **사용자 관리** (`/admin/users`)
   - 아이콘: `Users`
   - 배지: 미승인 사용자 수 (주황 배지)
3. **통계** (`/admin/statistics`)
   - 아이콘: `BarChart3`
4. **로그 분석** (`/admin/logs`)
   - 아이콘: `Search`
   - 서브메뉴: 
     - 사용자 활동 로그
     - IP 접근 로그 ⭐ (새로 추가)
     - 시스템 로그
5. **모니터링** (`/admin/monitoring`)
   - 아이콘: `Activity`
   - 배지: 경고 상태 (빨강 배지, 있을 경우)
6. **유지보수** (`/admin/maintenance`)
   - 아이콘: `Settings`
7. **감사 로그** (`/admin/audit`)
   - 아이콘: `FileText`

---

#### 3. 대시보드 홈 (`/admin`)

**레이아웃**: 카드 그리드 (2열 또는 3열, 반응형)

**구성**:
```
┌─────────────────────────────────────────────────────────┐
│ 시스템 통계 카드 (4개, 2x2 그리드)                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ 총 사용자 │ │ 활성 사용자│ │ 오늘 접속 │ │ 미승인   │  │
│ │   1,234  │ │    890    │ │   156    │ │    12    │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│ 최근 활동 (좌측, 50%)        빠른 액션 (우측, 50%)        │
│ ┌──────────────────┐        ┌──────────────────┐      │
│ │ 최근 로그인        │        │ [사용자 승인]     │      │
│ │ 최근 IP 접근       │        │ [IP 차단]        │      │
│ │ 최근 관리자 액션    │        │ [시스템 설정]     │      │
│ │ ...              │        │ [데이터 백업]     │      │
│ └──────────────────┘        └──────────────────┘      │
│                                                         │
│ 차트 영역 (전체 너비)                                     │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 일별 접속 추이 (라인 차트)                            │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**카드 디자인**:
- 카드: `bg-white rounded-lg border border-slate-200 shadow-sm`
- 카드 헤더: `px-6 py-4 border-b border-slate-200`
- 카드 타이틀: `text-sm font-medium text-slate-600`
- 카드 값: `text-3xl font-bold text-slate-900`
- 카드 변경량 (추세): `text-sm text-green-600` (증가) / `text-red-600` (감소)

**빠른 액션 버튼**:
- 버튼 스타일: `w-full justify-start text-left`
- 아이콘 + 텍스트 + 화살표
- 호버: `hover:bg-slate-50`

---

#### 4. 사용자 관리 페이지 (`/admin/users`)

**레이아웃**: 테이블 (좌측 70%) + 상세 패널 (우측 30%, 선택 시 나타남)

**구성**:
```
┌──────────────────────────────────────────────────────────────┐
│ 필터 바                                                       │
│ [검색: 이메일/이름]  [승인 상태 ▼]  [역할 ▼]  [리셋]          │
├──────────────────────────────────┬───────────────────────────┤
│ 사용자 목록 테이블 (좌측)          │ 상세 패널 (우측, 선택 시)   │
│                                  │                           │
│ ┌──────────────────────────────┐ │ ┌──────────────────────┐ │
│ │ 이메일 │ 이름 │ 역할 │ 승인 │...│ │ 사용자 상세 정보      │ │
│ ├──────────────────────────────┤ │ │                      │ │
│ │ user@... │ 홍길동 │ ANALYST│ ⏳ │ │ 이메일: user@...     │ │
│ │ (클릭)  │      │      │     │ │ │ 이름: 홍길동         │ │
│ ├──────────────────────────────┤ │ │ 역할: ANALYST        │ │
│ │ ...                          │ │ │ [승인] [역할변경]     │ │
│ └──────────────────────────────┘ │ │ [삭제] (빨강 버튼)    │ │
│                                  │ └──────────────────────┘ │
│ [페이지네이션]                     │                           │
└──────────────────────────────────┴───────────────────────────┘
```

**테이블 디자인**:
- 헤더: `bg-slate-50 text-slate-600 font-medium text-xs uppercase`
- 행: `hover:bg-slate-50 cursor-pointer`
- 선택된 행: `bg-blue-50 border-l-4 border-blue-500`
- 승인 상태 배지:
  - 승인됨: `bg-green-100 text-green-800`
  - 미승인: `bg-orange-100 text-orange-800`
  - 차단됨: `bg-red-100 text-red-800`

**상세 패널** (슬라이드 패널):
- 배경: `bg-white border-l border-slate-200`
- 패딩: `p-6`
- 스크롤: `overflow-y-auto`
- 액션 버튼:
  - 승인: 초록 버튼
  - 역할 변경: 블루 드롭다운
  - 삭제: 빨강 버튼 + 확인 모달 (2단계 확인)

**2단계 삭제 확인**:
```
1단계: [삭제] 버튼 클릭
  → 모달 팝업: "사용자를 삭제하시겠습니까?"
  → 설명: "이 작업은 되돌릴 수 없습니다. 사용자의 모든 데이터가 삭제됩니다."
  → 입력 필드: 사용자 이메일 일부 입력 (예: "user@exam" 입력해야 삭제 버튼 활성화)
  → [취소] [삭제] 버튼

2단계: 삭제 버튼 활성화 후 클릭
  → 실제 삭제 수행
```

---

#### 5. 로그 분석 페이지 (`/admin/logs`)

**레이아웃**: 탭 기반 + 필터 + 테이블

**구성**:
```
┌────────────────────────────────────────────────────────┐
│ 탭: [사용자 활동] [IP 접근 로그 ⭐] [시스템 로그]        │
├────────────────────────────────────────────────────────┤
│ 필터 바                                                 │
│ [날짜 범위] [IP 주소 검색] [경로 ▼] [검색] [리셋]        │
├────────────────────────────────────────────────────────┤
│ IP 통계 카드 (4개, 한 줄)                                │
│ [오늘 접속] [고유 IP] [의심 접속] [Top IP]              │
├────────────────────────────────────────────────────────┤
│ IP 로그 테이블                                          │
│ [IP 주소] [시간] [경로] [User-Agent] [국가] [상세보기]   │
│                                                         │
│ [페이지네이션]                                           │
└────────────────────────────────────────────────────────┘
```

**IP 로그 테이블**:
- 컬럼:
  1. IP 주소 (클릭 가능, IP별 필터)
  2. 접근 시간 (날짜 + 시간)
  3. 경로 (예: `/dashboard`, `/dashboard/map`)
  4. User-Agent (약식, 전체는 툴팁)
  5. 국가/도시 (IP Geolocation 결과, 있을 경우)
  6. 상세보기 버튼 (모달 또는 사이드 패널)

**의심스러운 IP 탐지**:
- 배경색: `bg-orange-50` (의심 접속)
- 아이콘: `AlertTriangle` (주황색)
- 툴팁: "짧은 시간 내 다수 요청 감지"

**IP 상세 모달**:
- IP 주소
- 접근 통계 (총 접근 수, 마지막 접근, 첫 접근)
- 시간대별 접근 추이 (작은 차트)
- 경로별 접근 분포
- [차단] 버튼 (빨강)

---

#### 6. 시스템 모니터링 페이지 (`/admin/monitoring`)

**레이아웃**: 카드 그리드 (시스템 메트릭) + 실시간 차트

**구성**:
```
┌────────────────────────────────────────────────────────┐
│ 시스템 상태 카드 (4개)                                    │
│ [CPU] [메모리] [디스크] [네트워크]                        │
├────────────────────────────────────────────────────────┤
│ API 응답 시간 차트 (라인 차트, 실시간 업데이트)            │
├────────────────────────────────────────────────────────┤
│ 에러 로그 테이블 (최근 50개)                              │
│ [시간] [레벨] [메시지] [스택]                            │
└────────────────────────────────────────────────────────┘
```

**시스템 상태 카드**:
- 값: `text-2xl font-bold`
- 상태 색상:
  - 정상: 초록 (`text-green-600`, 0-70%)
  - 주의: 주황 (`text-orange-600`, 70-90%)
  - 위험: 빨강 (`text-red-600`, 90%+)
- 프로그레스 바: 상태 색상 반영

---

### 인터랙션 패턴

#### 1. 드릴다운 패턴 (리스트 → 상세)

**사용자 관리, IP 로그, 감사 로그** 등에서 사용:

1. 테이블 행 클릭
2. 우측 슬라이드 패널 열림 (애니메이션: 슬라이드 인)
3. 상세 정보 표시
4. 패널 외부 클릭 또는 [X] 버튼으로 닫기

**애니메이션**:
- 슬라이드 인: `transform: translateX(0)` (300ms ease-out)
- 슬라이드 아웃: `transform: translateX(100%)` (200ms ease-in)

#### 2. 모달 패턴 (확인/폼)

**삭제, 설정 변경** 등 위험 액션:

1. 버튼 클릭
2. 모달 오버레이 + 모달 창 표시 (페이드 인)
3. 사용자 확인/입력
4. 확인 시 액션 수행 + 모달 닫기

**모달 디자인**:
- 오버레이: `bg-black/50 backdrop-blur-sm`
- 모달 창: `bg-white rounded-lg shadow-xl` (최대 너비 500px)
- 애니메이션: 스케일 + 페이드 (`scale-95 → scale-100`, `opacity-0 → opacity-100`)

#### 3. 로딩 상태

**스켈레톤 UI**:
- 테이블: 회색 플레이스홀더 행 (5-10개)
- 카드: 회색 플레이스홀더 박스
- 애니메이션: 펄스 효과 (`animate-pulse`)

**로딩 인디케이터**:
- 작은 작업: 버튼 내 스피너
- 큰 작업: 상단 로딩 바 (전체 너비, 진행률 표시)

#### 4. 에러 처리

**에러 메시지**:
- 위치: 상단 토스트 알림 또는 인라인 에러 메시지
- 스타일: 빨강 배경 (`bg-red-50 border border-red-200 text-red-800`)
- 아이콘: `AlertCircle` (빨강)
- 자동 사라짐: 5초 후 또는 수동 닫기

---

### 반응형 디자인

#### 데스크톱 (≥1024px)
- Sidebar: 항상 표시 (260px)
- Main Content: 나머지 공간
- 카드 그리드: 3-4열

#### 태블릿 (768px - 1023px)
- Sidebar: 토글 가능 (햄버거 메뉴)
- Main Content: 전체 너비 (Sidebar 숨김 시)
- 카드 그리드: 2열
- 상세 패널: 전체 너비 (테이블 아래)

#### 모바일 (≤767px)
- Sidebar: 드로어 (좌측에서 슬라이드)
- Header: 간소화 (로고 + 햄버거 메뉴)
- 카드 그리드: 1열
- 테이블: 스크롤 가능 (가로 스크롤)
- 상세 패널: 전체 화면 모달

---

### 접근성 (A11y)

1. **키보드 네비게이션**:
   - Tab: 포커스 이동
   - Enter/Space: 버튼/링크 활성화
   - Escape: 모달 닫기
   - Arrow keys: 테이블 행 네비게이션 (선택 사항)

2. **스크린 리더 지원**:
   - `aria-label` 속성 추가
   - 상태 변경 시 `aria-live` 영역 업데이트
   - 테이블 헤더: `scope="col"`

3. **색상 대비**:
   - 텍스트/배경 대비 비율: WCAG AA 기준 (4.5:1)
   - 색상만으로 정보 전달하지 않기 (아이콘 + 텍스트)

---

### 컴포넌트 파일 구조

```
components/admin/
├── layout/
│   ├── admin-header.tsx        # Header 컴포넌트
│   ├── admin-sidebar.tsx       # Sidebar 컴포넌트
│   └── admin-layout.tsx        # 전체 레이아웃 래퍼
├── dashboard/
│   ├── admin-dashboard-stats.tsx      # 통계 카드
│   ├── admin-recent-activity.tsx      # 최근 활동 리스트
│   └── admin-quick-actions.tsx        # 빠른 액션 버튼
├── users/
│   ├── user-management-table.tsx      # 사용자 테이블
│   ├── user-detail-panel.tsx          # 사용자 상세 패널
│   └── user-approval-dialog.tsx       # 승인 확인 다이얼로그
├── logs/
│   ├── log-viewer.tsx                 # 로그 뷰어
│   ├── ip-log-table.tsx               # IP 로그 테이블
│   ├── ip-statistics-cards.tsx        # IP 통계 카드
│   └── ip-detail-modal.tsx            # IP 상세 모달
├── monitoring/
│   └── system-monitoring-panel.tsx    # 시스템 모니터링 패널
└── shared/
    ├── confirm-dialog.tsx              # 확인 다이얼로그 (재사용)
    ├── detail-panel.tsx                # 상세 패널 래퍼 (재사용)
    └── status-badge.tsx                # 상태 배지 (재사용)
```

---

이제 제작자 페이지의 UI/UX 설계가 문서에 추가되었습니다!

