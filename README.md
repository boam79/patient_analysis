# PDR Dashboard v4.1

**Patient Data Review Dashboard** - 환자 데이터 분석 및 재방문 패턴 시각화 대시보드

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![License](https://img.shields.io/badge/license-MIT-green)

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

PDR Dashboard는 의료 데이터 분석을 위한 최신 웹 기반 대시보드입니다. 환자의 재방문 패턴을 분석하고, 질병 및 수술 데이터를 시각화하여 의료 의사결정을 지원합니다.

### 핵심 가치
- ✅ **로컬 데이터 처리**: 브라우저 내에서 모든 데이터 분석 수행 (보안)
- ✅ **PHI 최소화**: Protected Health Information 보호
- ✅ **고성능**: Web Worker, 가상화, 메모이제이션
- ✅ **확장 가능**: 모듈식 아키텍처

---

## ✨ 주요 기능

### 1. 데이터 관리
- 📁 **CSV/Excel 파일 업로드** - 드래그 앤 드롭 지원
- 🔄 **DuckDB WASM** - 브라우저 내 SQL 처리
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
- 🔐 **Next-Auth v5** - 사용자 인증
- 🛡️ **RBAC** - 역할 기반 권한 관리
- 🔒 **보안 헤더** - HSTS, CSP, XSS Protection
- 🚦 **Rate Limiting** - API 요청 제한

### 7. 최근 업데이트 (2024-11-25)
- ♻️ **실시간 필터 반영 개선**: 재방문 윈도우(30/90/180일)와 수술 필터가 KPI·차트·지도·테이블에 즉시 적용되도록 로직 고도화
- 🧠 **재방문 판별 고도화**: 환자별 방문 간격을 윈도우 기준으로 계산해 Boundary/Boxplot/Trend 지표 정밀도 향상
- 🔍 **필터 조합 안정성 확보**: 질병·수술·지역·연령·성별·기간 필터를 동시에 적용해도 일관된 결과 보장

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
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: Next-Auth v5
- **Data Processing**: DuckDB WASM
- **File Parsing**: PapaParse, XLSX

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
- **Client Storage**: localStorage (Zustand persist)
- **File Processing**: PapaParse (CSV), XLSX (Excel)

---

## 🚀 시작하기

### 필수 조건
- Node.js 20+
- PostgreSQL 16+ (또는 Docker)
- npm 또는 yarn

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/pdr-dashboard.git
cd pdr-dashboard

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 값 설정

# 4. 데이터베이스 마이그레이션
npx prisma migrate dev

# 5. 개발 서버 실행
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
docker build -t pdr-dashboard:latest .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  pdr-dashboard:latest
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
│   ├── tables/              # 테이블 컴포넌트
│   ├── ui/                  # UI 기본 컴포넌트 (shadcn/ui)
│   └── upload/              # 파일 업로드 컴포넌트
├── lib/                     # 유틸리티 함수
│   ├── auth.ts              # NextAuth 설정
│   ├── duckdb.ts            # DuckDB 초기화
│   ├── duckdb-worker.ts     # DuckDB Web Worker
│   ├── export-utils.ts      # 내보내기 유틸
│   ├── geocoding-batch.ts   # 지오코딩 배치
│   ├── indexeddb.ts         # IndexedDB 관리
│   ├── performance-utils.ts # 성능 유틸
│   ├── preprocessor.ts      # 데이터 전처리
│   ├── rbac.ts              # RBAC 유틸
│   └── utils.ts             # 공통 유틸
├── hooks/                   # 커스텀 훅
│   ├── use-debounce.ts
│   ├── use-duckdb-worker.ts
│   ├── use-intersection-observer.ts
│   └── use-toast.ts
├── stores/                  # Zustand 스토어
│   ├── data-store.ts        # 데이터 상태 관리 (with persist)
│   └── filter-store.ts      # 필터 상태 관리 (with persist)
├── types/                   # TypeScript 타입
│   └── react-window.d.ts
├── prisma/                  # Prisma 스키마
│   └── schema.prisma
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

| Phase | 작업 내용 | 예상 시간 | 실제 시간 | 효율 |
|-------|----------|----------|----------|------|
| Phase 1 | 프로젝트 초기 설정 | 3.5h | 2h | 175% |
| Phase 2 | 인증 시스템 구축 | 8h | 6h | 133% |
| Phase 3 | 데이터 업로드 및 전처리 | 6h | 4h | 150% |
| Phase 4 | 지오코딩 및 지도 | 5.5h | 2h | 275% |
| Phase 5 | 데이터 분석 및 시각화 | 8.5h | 3h | 283% |
| Phase 6 | 필터링 및 인터랙션 | 7.5h | 2h | 375% |
| Phase 7 | 보고서 및 내보내기 | 6h | 1.5h | 400% |
| Phase 8 | 성능 최적화 및 테스트 | 10h | 2.5h | 400% |
| Phase 9 | 실전 배포 준비 | 6h | 1.5h | 400% |
| **총합** | | **61h** | **24.5h** | **249%** |

---

## 🎨 스크린샷

### 대시보드 메인
![Dashboard Main](docs/screenshots/dashboard-main.png)

### 지도 분석
![Map Analysis](docs/screenshots/map-analysis.png)

### 차트 분석
![Chart Analysis](docs/screenshots/chart-analysis.png)

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
- ✅ 연령 피라미드 (남성/여성 분포)
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
- ✅ 연령 및 성별 분포 피라미드
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
- **문의사항**: ckadltmfxhrxhrxhr@gmail.com

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [DuckDB WASM](https://duckdb.org/docs/api/wasm)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Leaflet.js](https://leafletjs.com/)
- [Recharts](https://recharts.org/)

---

## 📚 문서

더 자세한 정보는 다음 문서를 참조하세요:

### 개발 완료 보고서
- [Phase 4 완료 보고서](docs/PHASE4_COMPLETE.md) - 지오코딩 & 지도 구현
- [Phase 5 완료 보고서](docs/PHASE5_COMPLETE.md) - 데이터 분석 & 시각화
- [Phase 6 완료 보고서](docs/PHASE6_COMPLETE.md) - 필터링 & 인터랙션
- [Phase 7 완료 보고서](docs/PHASE7_COMPLETE.md) - 보고서 & 내보내기
- [Phase 8 완료 보고서](docs/PHASE8_COMPLETE.md) - 성능 최적화 & 테스트
- [Phase 9 완료 보고서](docs/PHASE9_COMPLETE.md) - 실전 배포 준비

### 설계 문서
- [제품 설계 문서 (PDR v4.1)](docs/PDR_Dashboard_v4.1_Final.md) - 전체 시스템 설계
- [와이어프레임 부록](docs/pdr_appendix_wireframe.md) - UI/UX 설계
- [지오코딩 설정](docs/geocodingmap.md) - OpenStreetMap 설정

### 배포 가이드
- [배포 가이드](docs/DEPLOYMENT_GUIDE.md) - Docker/Vercel 배포
- [Vercel 배포 단계](docs/VERCEL_DEPLOYMENT_STEPS.md) - 단계별 가이드
- [Vercel 배포 준비](docs/VERCEL_DEPLOY_READY.md) - 사전 준비 사항
- [로컬 테스트 완료](docs/LOCAL_TEST_COMPLETE.md) - 로컬 테스트 결과
- [최종 배포 요약](docs/FINAL_DEPLOYMENT_SUMMARY.md) - 배포 완료 보고서
- [UI 업데이트 가이드](docs/UI_UPDATE_GUIDE.md) - UI 변경 사항

### 프로젝트 관리
- [프로젝트 현황 보드](.cursor/scratchpad.md) - 실시간 진행 상황
- [환경 변수 예시](.env.example) - 설정 템플릿

---

<div align="center">

**Made with ❤️ by Boam79**

⭐ Star us on GitHub — it helps!

[Report Bug](https://github.com/boam79/patient_analysis/issues) · [Request Feature](https://github.com/boam79/patient_analysis/issues) · [View Demo](https://patient-analysis-phi.vercel.app)

</div>
