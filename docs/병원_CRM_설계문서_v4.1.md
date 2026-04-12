# 📋 병원 CRM 설계 문서 v4.1
## 병원 CRM — 최종 통합판

---

**문서 정보**
- **버전**: v4.1 Final
- **최종 수정일**: 2025-10-22
- **제작자**: boam79
- **문의**: ckadltmfxhrxhrxhr@gmail.com
- **프로젝트명**: 병원 CRM

---

## 📑 목차
1. [제품 개요](#1️⃣-제품-개요)
2. [핵심 기능](#2️⃣-핵심-기능)
3. [🆕 로그인 및 권한 관리](#3️⃣-로그인-및-권한-관리)
4. [데이터 입력 및 준비](#4️⃣-데이터-입력-및-준비)
5. [4대 분석 축](#5️⃣-4대-분석-축)
6. [정보 구조](#6️⃣-정보-구조)
7. [UI/UX 설계](#7️⃣-uiux-설계)
8. [시각화 설계](#8️⃣-시각화-설계)
9. [지오코딩 및 지도](#9️⃣-지오코딩-및-지도)
10. [데이터 처리 및 보안](#🔟-데이터-처리-및-보안)
11. [기술 스택](#1️⃣1️⃣-기술-스택)
12. [성능 목표](#1️⃣2️⃣-성능-목표)
13. [디자인 시스템](#1️⃣3️⃣-디자인-시스템)
14. [사용자 시나리오](#1️⃣4️⃣-사용자-시나리오)
15. [추후 예정 기능](#1️⃣5️⃣-추후-예정-기능)
16. [품질 관리](#1️⃣6️⃣-품질-관리)
17. [참고 자료](#1️⃣7️⃣-참고-자료)

---

## 1️⃣ 제품 개요

### 🎯 목적
병원 내부의 **환자·질병·수술 데이터를 시각적으로 분석**하여:
- 재방문 패턴 파악
- 지역별 환자·수술 분포 분석
- 질병별·수술별 특성 이해
- 수술 수요 및 효과성 측정

을 직관적으로 수행할 수 있는 **웹 기반 대시보드**를 구축합니다.

### 🔐 핵심 원칙
- **완전 로컬 처리**: 모든 데이터는 브라우저 내에서 분석되며 서버에 저장되지 않음
- **보안 우선**: PHI(개인건강정보) 최소화, n<5 자동 마스킹
- **실시간 반응**: 0.7초 이내 필터 반응, 1.5초 이내 업로드 프리뷰
- **비즈니스 연계**: Markdown/PNG 보고서 출력으로 업무 활용성 극대화
- **공공데이터 활용**: 사용자가 직접 매핑 파일 업로드하여 유연한 코드 관리

### 👥 주 사용자
- 병원 행정팀
- 기획팀
- 원무과
- 경영진
- 의료진 (수술 통계 참고)

### 🏆 차별점
- 서버 저장 없이 브라우저 내 분석 (보안 우수)
- H3 격자 기반 개인정보 보호 (지리 정보 익명화)
- 사용자가 공공데이터 직접 업로드 (질병/수술 코드 매핑)
- 오픈맵(OpenStreetMap) 기반 히트맵 (오픈소스, 무료)
- 수술 데이터 통합 분석 (언제/어디서/어떤 수술)
- Vercel 글로벌 프론트 + Naver Cloud 백엔드 조합으로 국내/해외 성능 균형 확보
- AWS 서버리스 + Naver Cloud 연계로 공공데이터 자동 동기화 지원

---

## 2️⃣ 핵심 기능

### 📊 4대 분석 축

| 축 | 분석 대상 | 제공 지표 |
|----|----------|----------|
| **재방문 중심 축** | 환자 재방문 행동 패턴 | 재방문율, 평균 간격, 이탈률, 환자수 |
| **공간 중심 축** | 지역별 환자·수술 분포 | 밀집도 히트맵, 지역 순위, H3 격자 분석 |
| **질병 중심 축** | 질병별·연령별 특성 | ICD 코드 클러스터링, 이탈 질병군, 연령 피라미드 |
| **🆕 수술 중심 축** | 수술 패턴 및 효과성 | 수술량 순위, 계절성, 지역별 수술 분포, 재원일수, 수술 후 재방문 |

### 🔧 주요 기능 목록

#### 데이터 관리
- **CSV/Excel 파일 로컬 업로드**
  - 방문·질병 데이터 (질병, 재방문, 주소)
  - 수술 데이터 (수술일, 수술코드, 재원일수)
- **50행 즉시 프리뷰** (1.5초 이내)
- **자동 전처리**
  - 생년 → 연령대
  - 도로명 주소 → H3 좌표
  - ICD 코드 → 병명 매핑
  - 수술 코드 → 수술명 매핑
- **IndexedDB 기반 매핑 테이블 영구 저장**
- **공공데이터 매핑 파일 업로드**
  - 질병 코드 (ICD-10, KCD-8)
  - 수술 코드 (EDI, 수가코드)
  - 주소 매핑 (시/군/구/동)

#### 분석 기능
- **기간별 추세(Trend)**
  - 월/분기/연도별 재방문율 및 환자수 변화
  - 월별 수술량 추이
  - 요일별 수술 패턴 히트맵
- **지역 경계 비교(Boundary)**
  - 시/군/구/동 단위 비교 분석
  - 지역별 수술 비율
- **질병군 클러스터링**
  - ICD 코드 유사 패턴 자동 그룹화
- **수술 분석 (NEW)**
  - Top 20 수술 순위
  - 계절별/월별 수술 트렌드
  - 지역별 수술 분포 히트맵
  - 수술-질병 연관 매트릭스
  - 수술 후 재방문 패턴
  - 재원일수 vs 재방문율 분석

#### 시각화
- **오픈맵(OpenStreetMap) 기반 히트맵**
  - 환자 밀집도 모드
  - 재방문율 모드
  - 수술량 모드 (NEW)
  - 듀얼 모드
- **차트**
  - 질병 Top 10 막대 그래프
  - 수술 Top 20 막대 그래프 (NEW)
  - 연령 피라미드
  - 수술 카테고리 파이 차트 (NEW)
  - 재방문율 vs 환자수 버블 차트
  - 수술-질병 연관 매트릭스 (NEW)
  - 재원일수 vs 재방문율 산점도 (NEW)
- **KPI 카드 (6개)**
  - 환자수
  - 재방문율
  - 평균 재방문 간격
  - 총 수술 건수 (NEW)
  - 주요 수술 (NEW)
  - 평균 재원일수 (NEW)

#### 출력 기능
- Markdown 보고서 (.md)
- PNG 차트/지도 캡처
- 집계 CSV 내보내기 (n<5 마스킹 포함)

---

## 4️⃣ 데이터 입력 및 준비

### 📊 입력 데이터 형식

#### A. 업로드 데이터 (필수)
```csv
환자ID, 성별, 생년, 주소, 방문일, ICD코드, 질병명
P001, 남, 1985, 경기도 양주시 은현면 용암로 123, 2024-03-15, M179, 무릎관절증
P001, 남, 1985, 경기도 양주시 은현면 용암로 123, 2024-05-20, M179, 무릎관절증
P002, 여, 1972, 경기도 양주시 광적면 광적로 45, 2024-04-10, M545, 요통
```

**필수 필드**:
- 환자ID (재방문 계산용)
- 성별
- 생년 (YYYYMMDD 또는 YYYY)
- 주소 (도로명 주소 + 건물번호, 동·호 제외)
- 방문일 (YYYY-MM-DD)
- ICD코드 또는 질병명

#### B. 수술 데이터 (선택)
```csv
환자ID, 성별, 생년, 주소, 수술일, 수술코드, 수술명, 퇴원일, 재방문일
P001, 남, 1985, 경기도 양주시 은현면 용암로 123, 2024-03-15, S80501, 무릎관절경수술, 2024-03-18, 2024-04-20
P003, 남, 1960, 경기도 양주시 남면 황방로 78, 2024-06-10, S47311, 백내장수술, 2024-06-10, 2024-07-08
```

**필수 필드** (수술 분석 시):
- 환자ID
- 수술일
- 수술코드 또는 수술명
- 퇴원일 (재원일수 계산용)
- 재방문일 (선택, 재방문 패턴 분석용)

### 📁 공공데이터 매핑 파일 준비

사용자는 다음 공공데이터를 다운로드하여 시스템에 업로드해야 합니다:

#### 1️⃣ 질병 코드 매핑 (ICD-10 / KCD-8)

##### 📥 다운로드 경로

| 기관 | 데이터명 | URL | 파일 형식 |
|------|---------|-----|----------|
| **통계청** | 한국표준질병사인분류(KCD-8) | [KOSIS](https://kosis.kr) → 분류표 → 한국표준질병사인분류 | Excel |
| **WHO** | ICD-10 국제질병분류 | [WHO ICD](https://icd.who.int/browse10/2019/en) | CSV |
| **질병관리청** | 한국 질병코드 | [질병관리청 데이터포털](https://www.kdca.go.kr) | Excel |

##### 📋 필수 파일 형식
```csv
icd_code,disease_name,category
M179,무릎관절증,근골격계
M545,요통,근골격계
I10,본태성고혈압,순환계
H259,백내장,눈 및 부속기
```

**필수 필드**:
- `icd_code`: ICD-10 코드 (예: M179)
- `disease_name`: 질병명 (한글)
- `category`: 질병 대분류 (선택)

##### 📤 업로드 방법
1. 병원 CRM 접속
2. ⚙️ 설정 → 매핑 파일 관리
3. [질병 코드] 탭 → 파일 드래그 or [📁 파일 선택]
4. 자동 검증 → [✅ 적용]

---

#### 2️⃣ 수술 코드 매핑 (EDI / 수가코드)

##### 📥 다운로드 경로

| 기관 | 데이터명 | URL | 파일 형식 |
|------|---------|-----|----------|
| **건강보험심사평가원** | 요양급여비용 수술료 | [공공데이터포털](https://www.data.go.kr) → "요양급여비용" 검색 | Excel |
| **건강보험심사평가원** | 행위코드 | [건강보험심사평가원](https://www.hira.or.kr) → 보건의료빅데이터개방시스템 | CSV |
| **통계청** | KCD-8 수술분류 | [KOSIS](https://kosis.kr) → 보건통계 → 수술분류 | Excel |
| **보건복지부** | 의료행위 분류표 | [보건복지부 데이터포털](https://data.kihasa.re.kr) | Excel |

##### 📋 필수 파일 형식
```csv
surgery_code,surgery_name,category1,category2,avg_cost,tags
S80501,무릎관절경수술,정형외과,관절경,1500000,"무릎,관절,최소침습"
S80701,척추후방유합술,정형외과,척추,8000000,"척추,유합,입원"
S47311,백내장제거술,안과,백내장,800000,"백내장,일일수술"
S52101,충수절제술,일반외과,복강경,2000000,"충수염,응급"
```

**필수 필드**:
- `surgery_code`: 수술 코드 (EDI 코드 또는 병원 자체 코드)
- `surgery_name`: 수술명 (한글)

**권장 필드**:
- `category1`: 대분류 (진료과)
- `category2`: 중분류 (수술 유형)
- `avg_cost`: 평균 비용 (원)
- `tags`: 검색용 태그 (쉼표 구분)

**선택 필드**:
- `avg_duration_min`: 평균 소요 시간 (분)
- `risk_level`: 위험도 (low/medium/high)
- `requires_hospitalization`: 입원 필요 여부 (true/false)
- `typical_los_days`: 일반적 재원일수 (일)

##### 📤 업로드 방법
1. 병원 CRM 접속
2. ⚙️ 설정 → 매핑 파일 관리
3. [🆕 수술 코드] 탭 → 파일 드래그 or [📁 파일 선택]
4. 자동 검증 (필수 필드 확인, 중복 체크)
5. 프리뷰 확인 (상위 20행)
6. [✅ 적용]

##### 🔍 검증 규칙
- 필수 필드 누락 → ❌ 업로드 차단
- 중복 코드 → ⚠️ 경고 (마지막 항목 유지)
- 데이터 타입 오류 → ⚠️ 경고 (null 처리)
- 선택 필드 누락 → ℹ️ 정보 (무시)

---

#### 3️⃣ 주소 매핑 (선택 - 자동 처리 가능)

##### 📥 다운로드 경로 (선택사항)

| 기관 | 데이터명 | URL |
|------|---------|-----|
| **행정안전부** | 도로명주소 전체분 | [주소정보누리집](https://www.juso.go.kr/openIndexPage.do) |

**주의**: 주소 매핑은 OpenStreetMap Nominatim API로 자동 처리되므로 선택사항입니다.

---

### 🆕 공공데이터 API 연동 (자동 업데이트 계획)

수기 업로드 외에도 **공공데이터포털 OpenAPI**와 **건강보험심사평가원(HIRA) API**를 활용해 매핑·통계 데이터를 자동으로 수집하는 파이프라인을 제공합니다.  
기본 파이프라인은 네이버 클라우드(NCP)에서 동작하며, 장애 시 AWS 구성으로 자동 페일오버됩니다.

| 대상 데이터 | 출처 API | 호출 주기 | NCP 기본 경로 | AWS 백업 경로 |
|-------------|----------|-----------|----------------|---------------|
| 질병 코드 (KCD/ICD) | KOSIS OpenAPI, WHO ICD API | 주 1회 | NCP Event Scheduler → Cloud Functions(FastAPI ETL) → Object Storage → Data Forest Spark 변환 → Cloud DB for PostgreSQL | EventBridge → Lambda → S3 Raw → Glue 변환 → Aurora PostgreSQL |
| 수술 코드 (EDI) | HIRA 행위정보 공개 API | 매일 자정 | Cloud Functions → 품질 검증 → 버전 관리(Cloud DB for PostgreSQL) → 변경 알림(Cloud Monitoring) | Lambda → 검증 → Aurora → SNS 알림 |
| 지역 행정 코드 | 행정안전부 행정구역 REST API | 월 1회 | Cloud Functions → Object Storage Delta → IndexedDB 동기화 | Lambda → S3 Delta → IndexedDB 동기화 |

**처리 흐름 (기본)**:
1. **NCP Event Scheduler**가 예약 실행 → 각 API 엔드포인트 호출(NCP Cloud Functions).
2. 응답 JSON/CSV를 **Object Storage** Raw 버킷에 수집 후 **Data Forest/Spark**로 스키마 정규화.
3. 정제된 레코드는 **Cloud DB for PostgreSQL** 매핑 테이블에 upsert 후 버전 태그 발행.
4. 프론트엔드 최초 로딩 시 최신 매핑 버전을 확인하고, 필요 시 IndexedDB와 동기화.
5. 장애 발생 시 **Cloud Monitoring + Webhook**으로 운영자에게 알림, 3회 재시도 후 AWS 백업 파이프라인으로 전환.

> ⚠️ 모든 API가 동시에 실패하거나 레이트리밋이 지속될 경우 사용자는 CSV 업로드로 즉시 수동 보완이 가능하며, 자동 복구 완료 시 알림을 제공합니다.

---

### 📦 매핑 파일 관리

#### IndexedDB 저장 구조
```typescript
// 질병 코드 매핑
{
  id: 'disease_mapping_v1',
  version: 'v1.2',
  source: '통계청 KCD-8',
  uploadedAt: Date,
  totalCount: 5000,
  mappings: [
    { code: 'M179', name: '무릎관절증', category: '근골격계' },
    // ...
  ]
}

// 수술 코드 매핑
{
  id: 'surgery_mapping_v1',
  version: 'v2.3',
  source: '건강보험심사평가원',
  uploadedAt: Date,
  totalCount: 1234,
  mappings: [
    { 
      code: 'S80501', 
      name: '무릎관절경수술',
      category1: '정형외과',
      category2: '관절경',
      avgCost: 1500000,
      tags: ['무릎', '관절']
    },
    // ...
  ],
  backup: { /* 이전 버전 자동 백업 */ }
}
```

#### 버전 관리
- **자동 백업**: 새 파일 업로드 시 기존 매핑 자동 백업 (최대 1개 보관)
- **수동 백업**: [📥 백업] 버튼 → JSON 파일 다운로드
- **복원**: [이전 버전으로 복원] 또는 백업 JSON 재업로드

---

## 5️⃣ 4대 분석 축

### 📊 분석 축 상세 구성

```
📊 병원 CRM
 │
 ├── 1️⃣ 재방문 중심 축
 │    ├── 재방문율 추이 (월별/분기별)
 │    ├── 평균 재방문 간격
 │    ├── 신규 vs 재방문 환자 비율
 │    ├── 이탈 환자 추적
 │    └── 재방문 간격 분포
 │
 ├── 2️⃣ 공간 중심 축 (지도)
 │    ├── 히트맵 모드
 │    │    ├── 환자 밀집도
 │    │    ├── 재방문율
 │    │    ├── 🆕 수술량
 │    │    └── 듀얼 (밀집도 + 재방문율)
 │    ├── H3 격자 집계 (0.1km²)
 │    ├── 지역별 Top N 마커
 │    ├── 반경 필터 (1~10km)
 │    └── 지역 경계 강조
 │
 ├── 3️⃣ 질병 중심 축
 │    ├── 질병 Top 10 순위
 │    ├── ICD 코드 클러스터링
 │    ├── 질병별 재방문율
 │    ├── 연령별 질병 분포
 │    ├── 이탈 질병 추적
 │    └── 질병-수술 연관 분석 (NEW)
 │
 └── 4️⃣ 🆕 수술 중심 축 (NEW)
      ├── 수술량 순위
      │    ├── Top 20 수술 막대 그래프
      │    ├── 수술 카테고리 파이 차트
      │    ├── 전년 대비 증감률
      │    └── 급증/급감 수술 리스트
      │
      ├── 시기별 수술 트렌드
      │    ├── 월별 수술량 라인 차트
      │    ├── 요일별 수술 히트맵
      │    ├── 계절 지수 (봄/여름/가을/겨울)
      │    └── 시간대별 수술 분포
      │
      ├── 지역별 수술 분포
      │    ├── 지도 히트맵 (수술량 모드)
      │    ├── 시/군/구별 수술 비율
      │    ├── 지역별 Top 3 수술
      │    └── 수술 접근성 분석
      │
      ├── 수술-질병 연관 분석
      │    ├── 연관 매트릭스 히트맵
      │    ├── 수술 전 주요 질병
      │    ├── 질병별 수술 선택 패턴
      │    └── 수술 후 합병증 추적
      │
      └── 수술 효과성 분석
           ├── 수술 후 재방문 타임라인
           ├── 평균 재원일수 vs 재방문율
           ├── 수술별 효과성 스코어
           └── 재원일수 분포 Boxplot
```

---

## 6️⃣ 정보 구조

### 🧭 Information Architecture

```
📊 대시보드 홈
 │
 ├── 🔝 상단 헤더
 │    ├── 로고 및 데이터셋 선택
 │    ├── KPI 요약 카드 (6개)
 │    │    ├── 환자수
 │    │    ├── 재방문율
 │    │    ├── 평균 재방문 간격
 │    │    ├── 🆕 총 수술 건수
 │    │    ├── 🆕 주요 수술 (Top 1)
 │    │    └── 🆕 평균 재원일수
 │    └── 액션 버튼
 │         ├── [📄 보고서 생성]
 │         ├── [📸 PNG 캡처]
 │         └── [⚙️ 설정]
 │
 ├── 🎛️ 전역 필터 바
 │    ├── 기간 선택 (시작일~종료일)
 │    ├── 윈도우 (30/90/180일)
 │    ├── 질병 선택 (다중 선택)
 │    ├── 🆕 수술 카테고리 (다중 선택)
 │    ├── 🆕 수술명 (검색 + 자동완성)
 │    ├── 연령대 (10세 단위)
 │    ├── 성별
 │    └── 지역 (시/군/구/동)
 │
 ├── 📐 메인 대시보드 (3열 레이아웃)
 │    │
 │    ├── [좌측 패널] 280px
 │    │    ├── 탭: [질병] / [🆕 수술]
 │    │    │
 │    │    ├── [질병 탭]
 │    │    │    ├── 질병 Top 10 막대
 │    │    │    ├── 연령 피라미드
 │    │    │    └── 이탈 질병 리스트
 │    │    │
 │    │    └── [🆕 수술 탭]
 │    │         ├── 수술 Top 20 막대
 │    │         ├── 수술 카테고리 파이
 │    │         └── 급증/급감 수술 리스트
 │    │
 │    ├── [중앙 패널] 가변
 │    │    ├── 오픈맵 지도 (히트맵/마커)
 │    │    ├── 🆕 모드 토글
 │    │    │    ├── 밀집도 (환자수)
 │    │    │    ├── 재방문율
 │    │    │    ├── 🆕 수술량
 │    │    │    └── 듀얼
 │    │    ├── 반경 필터 슬라이더
 │    │    └── 범례 및 줌 컨트롤
 │    │
 │    └── [우측 패널] 320px
 │         ├── 선택 지역 상세 카드
 │         ├── KPI 지표 (6개)
 │         ├── 🆕 해당 지역 Top 3 수술
 │         ├── 주요 연령대 차트
 │         └── 자동 인사이트 문장
 │
 ├── 📑 하단 탭
 │    ├── [Trend] 기간별 추세
 │    │    ├── 라인: 재방문율 추이
 │    │    ├── 막대: 신규 vs 재방문 환자수
 │    │    ├── 🆕 라인: 월별 수술량
 │    │    ├── 🆕 히트맵: 요일별 수술 패턴
 │    │    └── 요약 인사이트
 │    │
 │    ├── [Boundary] 지역 비교
 │    │    ├── 지도 윤곽 강조
 │    │    ├── 막대: 지역별 재방문율
 │    │    ├── 🆕 막대: 지역별 수술 비율
 │    │    ├── Boxplot: 지역별 환자 분포
 │    │    └── 태그: [밀집↑/재방문↓]
 │    │
 │    ├── [Table] 데이터 표
 │    │    ├── 질병|연령대|환자수|재방문율|지역|평균간격
 │    │    ├── 🆕 수술|환자수|평균재원일수|재방문율|지역
 │    │    ├── 정렬/필터 기능
 │    │    └── CSV 내보내기
 │    │
 │    └── 🆕 [Surgery] 수술 상세 분석
 │         ├── 수술-질병 연관 매트릭스
 │         ├── 수술 후 재방문 타임라인
 │         ├── 재원일수 vs 재방문율 산점도
 │         └── 수술 효과성 스코어카드
 │
 └── ⚙️ 설정 및 관리
      ├── 매핑 파일 관리
      │    ├── [질병 코드] 탭
      │    ├── [🆕 수술 코드] 탭
      │    └── [주소 매핑] 탭 (선택)
      ├── 로컬 저장 설정 (IndexedDB)
      ├── 알림 규칙 설정
      ├── 북마크 관리
      └── 테마 설정
```

---

## 7️⃣ UI/UX 설계

### 📐 화면 구성

#### 상단 헤더 (Z-패턴 시선 유도)
```
┌─────────────────────────────────────────────────────────────────┐
│ [로고] 병원 CRM v4.5                                       │
│                                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  [보고서]│
│  │환자수│ │재방문│ │평균  │ │총수술│ │주요  │ │평균  │  [📸]    │
│  │1,234│ │45.2%│ │간격  │ │건수  │ │수술  │ │재원  │  [⚙️]    │
│  │↑8.3%│ │↑7.2pp│ │28일 │ │187건│ │무릎..│ │3.2일│          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
└─────────────────────────────────────────────────────────────────┘
```

**디자인 원칙**:
- Nielsen Norman Group의 Z-패턴 적용
- KPI 카드 최상단 배치 → 인지 부하 30% 감소
- 6개 KPI 카드 (기존 3개 + 수술 관련 3개)

#### 전역 필터 바
```
┌───────────────────────────────────────────────────────────────────┐
│ 기간: [2024-01-01 ~ 2024-12-31] │ 윈도우: [90일▼]               │
│ 질병: [전체▼] │ 🆕수술: [전체▼] │ 연령: [전체▼] │ 지역: [전체▼]  │
└───────────────────────────────────────────────────────────────────┘
```

**인터랙션**:
- 드롭다운 클릭 → 다중 선택 팝오버
- 수술 필터: 검색 + 자동완성 지원
- 선택 완료 → 0.7초 이내 전체 차트 갱신

#### 메인 대시보드 (3열 구조)
```
┌───────────┬────────────────────────┬───────────┐
│           │                        │           │
│  [좌측]   │      [중앙 지도]       │  [우측]   │
│  280px    │        가변            │   320px   │
│           │                        │           │
│ [질병][수술]│  • 히트맵 레이어      │ • 선택    │
│  ↑ 탭    │  • 모드: [밀집도]     │   지역    │
│           │         [재방문]       │   상세    │
│ • Top 10  │         [🆕수술량]     │           │
│   막대    │         [듀얼]         │ • KPI     │
│           │  • 마커 클러스터       │   (6개)   │
│ • 연령    │  • 반경 필터           │           │
│   피라미드│  • 줌/팬 컨트롤        │ • Top 3   │
│           │                        │   수술    │
│ • 이탈/급증│                        │           │
│   리스트  │                        │ • 인사이트│
│           │                        │           │
└───────────┴────────────────────────┴───────────┘
```

#### 하단 탭: 🆕 Surgery 탭 (신규)
```
┌───────────────────────────────────────────────────────────┐
│ [Trend] [Boundary] [Table] [🆕 Surgery]                   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ 📊 수술-질병 연관 매트릭스                                │
│ ┌─────┬────────┬────────┬────────┐                      │
│ │수술\질병│무릎관절│척추질환│백내장│                      │
│ ├─────┼────────┼────────┼────────┤                      │
│ │무릎관절│  89%  │   4%  │   0%  │                      │
│ │척추수술│   3%  │  92%  │   1%  │                      │
│ │백내장│   0%  │   0%  │  98%  │                      │
│ └─────┴────────┴────────┴────────┘                      │
│                                                           │
│ 📈 수술 후 재방문 타임라인                                │
│  [라인 차트]                                              │
│  X축: 수술 후 일수 (0~90일)                              │
│  Y축: 재방문 환자 비율 (%)                               │
│  라인별: 수술 종류                                        │
│                                                           │
│ 🔵 재원일수 vs 재방문율 산점도                            │
│  [Scatter Plot]                                           │
│  각 점 = 수술 종류                                        │
│  크기 = 수술 건수                                         │
│  색상 = 수술 카테고리                                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 🎨 주요 인터랙션 시나리오

| 사용자 행동 | 시스템 응답 | 시각적 피드백 | 응답 시간 |
|------------|------------|--------------|----------|
| 파일 드롭/업로드 | 50행 프리뷰 표시 | 프로그레스바 + 단계별 메시지 | ≤1.5초 |
| 질병/수술 막대 클릭 | 지도·카드·표 동기화 | 선택 요소 강조(파란 테두리) | 즉시 |
| 지도 마커 클릭 | 우측 상세 카드 갱신 | 마커 확대(1.2배) + 툴팁 | ≤0.3초 |
| 수술 필터 적용 | 모든 차트 갱신 | 스켈레톤 → 페이드인 | ≤0.7초 |
| Surgery 탭 클릭 | 매트릭스+산점도 렌더 | 부드러운 전환 | ≤2초 |
| 매핑 파일 업로드 | 검증 → 프리뷰 → 저장 | 프로그레스 + 결과 알림 | ≤3초 |

### 🔄 상태 및 피드백 시스템

| 상태 | 표현 방식 | 디자인 요소 |
|------|----------|------------|
| ⏳ **로딩** | 스켈레톤 애니메이션 | 흐르는 그라데이션 (shimmer) |
| ⚠️ **경고** | 상단 배너 | 노란색 배경 (#FEF3C7) + 아이콘 |
| ❌ **에러** | 모달 또는 배너 | 빨간색 테두리 (#EF4444) |
| ✅ **성공** | 토스트 알림 | 녹색 체크 + 자동 사라짐(3초) |
| 🔄 **진행** | 프로그레스바 | 퍼센트 + 단계별 메시지 |
| ℹ️ **정보** | 툴팁/팝오버 | 파란색 배경 (#DBEAFE) |

---

## 8️⃣ 시각화 설계

### 📊 차트 유형 및 용도

| 차트 유형 | 데이터 | 위치 | 인터랙션 |
|----------|--------|------|----------|
| **KPI 카드 (6개)** | 환자수, 재방문율, 평균간격, 수술건수, 주요수술, 평균재원일수 | 상단 헤더 | 클릭 → 상세 팝오버 |
| **막대 그래프** | 질병 Top 10 / 수술 Top 20 | 좌측 패널 | 클릭 → 필터 적용 + 지도 연동 |
| **피라미드 차트** | 연령/성별 분포 | 좌측 패널 | 호버 → 툴팁 |
| **파이 차트** | 수술 카테고리 비율 | 좌측 패널 (수술 탭) | 호버 → 비율 표시 |
| **버블 차트** | 재방문율 vs 환자수 | 중앙 패널 | 크기=환자수, 색상=재방문율 |
| **히트맵** | 지역별 밀집도/재방문율/수술량 | 중앙 지도 | 줌/팬, 모드 토글 |
| **요일별 히트맵** | 요일×시간대 수술량 | Trend 탭 | 색상: 노랑(적음)~빨강(많음) |
| **마커 클러스터** | Top N 지역 | 중앙 지도 | 클릭 → 우측 카드 갱신 |
| **라인 차트** | 월별 재방문율/수술량 추이 | Trend 탭 | 클릭 → 해당 기간 필터 |
| **수술-질병 매트릭스** | 연관도 (%) | Surgery 탭 | 셀 클릭 → 상세 팝업 |
| **재방문 타임라인** | 수술 후 경과일별 재방문율 | Surgery 탭 | 라인별: 수술 종류 |
| **산점도** | 재원일수 vs 재방문율 | Surgery 탭 | 크기=건수, 색상=카테고리 |
| **Boxplot** | 지역별 재방문율/재원일수 분포 | Boundary 탭 | 아웃라이어 클릭 → 상세 |
| **데이터 테이블** | 전체 집계 데이터 | Table 탭 | 정렬, 필터, CSV 내보내기 |

### 🎨 색상 시스템 (ColorBrewer + Material Design)

#### 의미론적 색상
```css
/* 주요 지표 */
--color-positive: #10B981    /* Green 500 - 재방문율 상승 */
--color-negative: #EF4444    /* Red 500 - 재방문율 하락 */
--color-neutral: #6B7280     /* Gray 500 - 중립 */
--color-warning: #F59E0B     /* Amber 500 - 주의 (n<5) */

/* 질병 카테고리 (ColorBrewer Qualitative Set3) */
--disease-musculoskeletal: #8DD3C7    /* 근골격계 */
--disease-circulatory: #FB8072        /* 순환계 */
--disease-respiratory: #80B1D3        /* 호흡기 */
--disease-digestive: #FDB462          /* 소화기 */
--disease-nervous: #B3DE69            /* 신경계 */
--disease-endocrine: #FCCDE5          /* 내분비 */

/* 수술 카테고리 (ColorBrewer Paired) */
--surgery-orthopedic: #A6CEE3         /* 정형외과 (하늘색) */
--surgery-ophthalmology: #1F78B4     /* 안과 (파란색) */
--surgery-general: #B2DF8A            /* 일반외과 (연두색) */
--surgery-gynecology: #33A02C         /* 산부인과 (녹색) */
--surgery-urology: #FB9A99            /* 비뇨기과 (분홍색) */
--surgery-neurosurgery: #E31A1C       /* 신경외과 (빨강) */
--surgery-cardiovascular: #FDBF6F     /* 심혈관 (주황) */
--surgery-other: #CAB2D6              /* 기타 (보라) */

/* 히트맵 그라데이션 (ColorBrewer Sequential YlOrRd) */
0~20%:  #FFFFCC  /* 연한 노랑 */
20~30%: #FFEDA0
30~40%: #FED976  /* 노랑 */
40~50%: #FEB24C
50~60%: #FD8D3C  /* 주황 */
60~70%: #FC4E2A
70~80%: #E31A1C  /* 빨강 */
80%+:   #BD0026  /* 진한 빨강 */

/* 수술량 히트맵 (ColorBrewer Sequential PuRd) */
0~10건:   #F7F4F9  /* 거의 투명 보라 */
10~20건:  #E7E1EF
20~30건:  #D4B9DA  /* 연보라 */
30~50건:  #C994C7
50~70건:  #DF65B0  /* 자주 */
70~100건: #E7298A
100건+:   #CE1256  /* 진한 빨강 */
```

#### 색각이상자 대응
- 모든 차트에 패턴 오버레이 옵션
- WCAG AA 기준 색상 대비비 4.5:1 이상
- ColorBrewer "colorblind safe" 팔레트 우선 사용

### ✍️ 타이포그래피

```css
/* 헤드라인 (제목, 섹션) */
--font-heading: 'Pretendard Variable', -apple-system, sans-serif;
--weight-heading: 600;
--size-h1: 28px;
--size-h2: 20px;
--size-h3: 16px;
--line-height-heading: 1.3;

/* 본문 (설명, 레이블) */
--font-body: 'Pretendard', -apple-system, sans-serif;
--weight-body: 400;
--size-body: 14px;
--size-caption: 12px;
--line-height-body: 1.6;

/* 숫자 전용 (KPI, 차트) */
--font-numeric: 'Inter', -apple-system-font, monospace;
--weight-numeric: 500;
--size-large-num: 32px;   /* KPI 카드 */
--size-medium-num: 18px;  /* 차트 값 */
--size-chart-num: 12px;   /* 축 레이블 */
--variant-numeric: tabular-nums;  /* 숫자 정렬 균일화 */
```

### 📐 스페이싱 시스템 (8px 그리드)

```css
--space-1: 4px    /* 아이콘-텍스트 간격 */
--space-2: 8px    /* 카드 내부 요소 */
--space-3: 12px   /* 작은 섹션 */
--space-4: 16px   /* 섹션 내부 */
--space-6: 24px   /* 카드 간격 */
--space-8: 32px   /* 메인 섹션 구분 */
--space-12: 48px  /* 페이지 상단/하단 */
```

### 🎭 차트 스타일 통일 (ECharts 테마)

```typescript
const chartTheme = {
  // ColorBrewer 팔레트
  color: ['#8DD3C7', '#FB8072', '#80B1D3', '#FDB462', '#B3DE69', '#FCCDE5'],
  
  backgroundColor: 'transparent',
  
  // 타이포그래피
  textStyle: {
    fontFamily: 'Inter, Pretendard, -apple-system, sans-serif',
    fontSize: 12,
    color: '#374151'  // Gray 700
  },
  
  // 툴팁 (Material Design Elevation)
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: '#E5E7EB',  // Gray 200
    borderWidth: 1,
    textStyle: { color: '#111827' },
    padding: [12, 16],
    extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;'
  },
  
  // 축 (최소화)
  xAxis: {
    axisLine: { lineStyle: { color: '#E5E7EB' } },
    axisLabel: { color: '#6B7280', fontSize: 11 },
    splitLine: { show: false }
  },
  
  yAxis: {
    axisLine: { show: false },
    axisLabel: { color: '#6B7280', fontSize: 11 },
    splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } }
  },
  
  // 애니메이션
  animationDuration: 800,
  animationEasing: 'cubicOut'
};
```

---

## 9️⃣ 지오코딩 및 지도

### 🗺️ OpenStreetMap Nominatim 지오코딩 API

#### 공식 문서
- **엔드포인트**: `https://nominatim.openstreetmap.org/search`
- **문서**: https://nominatim.org/release-docs/latest/api/Overview/
- **라이선스**: ODbL (Open Database License)

#### 인증 방식
```
- API 키 불필요 (무료 오픈소스)
- 사용 제한: 1초당 1회 요청 (공식 서버)
- 사용자 에이전트 필수 (User-Agent 헤더)
- FastAPI 백엔드 프록시 경유 권장 (레이트리밋 관리)
```

#### 요청 구조
```
GET /search?q={주소}&format=json&limit=5&addressdetails=1

Parameters:
  q: "경기도 양주시 은현면 용암로 123"
  format: json (기본값)
  limit: 5 (결과 개수, 최대 50)
  addressdetails: 1 (상세 주소 정보 포함)
  countrycodes: kr (한국만 검색, 선택)
  accept-language: ko (한국어 응답, 선택)
```

#### 응답 구조
```json
[
  {
    "place_id": 123456789,
    "licence": "Data © OpenStreetMap contributors",
    "osm_type": "way",
    "osm_id": 987654321,
    "lat": "37.823456",
    "lon": "127.125678",
    "display_name": "경기도 양주시 은현면 용암로 123",
    "address": {
      "road": "용암로",
      "house_number": "123",
      "town": "은현면",
      "county": "양주시",
      "state": "경기도",
      "country": "대한민국",
      "country_code": "kr"
    },
    "boundingbox": ["37.823", "37.824", "127.125", "127.126"]
  }
]
```

### 🗺️ Leaflet.js 지도 라이브러리

#### 라이브러리 로드
```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Leaflet Heat 플러그인 (히트맵용) -->
<script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
```

#### 지도 초기화
```javascript
const map = L.map('map').setView([37.5665, 126.9780], 10); // 서울 중심

// OpenStreetMap 타일 레이어
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);
```

#### 히트맵 설정
```javascript
// 히트맵 데이터 포맷
const heatData = [
  [37.8234, 127.1256, 0.8],  // [위도, 경도, 가중치]
  [37.8245, 127.1267, 0.6],
  // ...
];

// 히트맵 레이어 생성
const heatLayer = L.heatLayer(heatData, {
  radius: 25,           // 반경 (픽셀)
  blur: 15,                 // 블러 효과
  maxZoom: 17,
  max: 1.0,                // 최대 가중치
  gradient: {               // 색상 그라데이션
    0.0: 'blue',
    0.5: 'yellow',
    1.0: 'red'
  }
}).addTo(map);
```

#### 대체 타일 제공자 (선택사항)
```javascript
// Mapbox (API 키 필요)
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  id: 'mapbox/streets-v11',
  accessToken: 'YOUR_MAPBOX_TOKEN'
});

// CartoDB (무료, API 키 불필요)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO'
});
```

### 🔷 H3 격자 시스템

#### 해상도 선택
- **Resolution 9** (권장): 약 0.1km² 격자
- 개인정보 보호와 분석 정확도 균형

#### 변환 프로세스
```
1. 지오코딩 결과
   → 위도: 37.8234, 경도: 127.1256

2. H3 인덱스 생성 (resolution 9)
   → h3Index: "89283082803ffff"

3. H3 격자 중심 좌표 계산
   → 중심 위도: 37.8231, 중심 경도: 127.1253

4. 히트맵 데이터 생성
   → { lat: 37.8231, lng: 127.1253, weight: 0.8 }
```

#### 집계 방식
```
동일 격자 내:
  - 환자수 합산
  - 재방문율 평균
  - 수술 건수 합산
  - 가중치 정규화 (0~1)
```

### 🎨 지도 시각화 모드 (4가지)

| 모드 | 데이터 | 색상 범례 | 용도 |
|------|--------|----------|------|
| **밀집도** | 환자수 | 노랑(적음) → 빨강(많음) | 환자 분포 파악 |
| **재방문율** | 재방문율 | 파랑(낮음) → 빨강(높음) | 충성도 분석 |
| **🆕 수술량** | 수술 건수 | 보라(적음) → 빨강(많음) | 수술 수요 분석 |
| **듀얼** | 밀집도+재방문율 | 그라데이션 혼합 | 종합 분석 |

---

## 🔟 데이터 처리 및 보안

### 🔒 보안 원칙

#### PHI(개인건강정보) 최소화
```
입력 단계:
├ 삭제: 이름, 주민번호, 상세 연락처
├ 허용: 생년(연도), 성별, 질병코드, 수술코드, 주소(도로명+건물번호)
└ 금지: 동·호 정보 외부 전송

처리 단계:
├ 브라우저 내부에서만 분석
├ 주소 → H3 격자 변환 (0.1km²)
├ 개별 환자 식별 불가능
└ 원본 주소 세션 종료 시 폐기

출력 단계:
├ n<5 자동 마스킹 ("<5명" 또는 "·")
├ 집계 지표만 출력
└ 로그에 PHI 포함 금지
```

#### n<5 마스킹 적용 위치

| 출력 위치 | 마스킹 규칙 | 표시 예시 |
|----------|------------|----------|
| 질병/수술 막대 그래프 | 5건 미만 제외 또는 "<5건" | "담낭수술 <5건" |
| 지역별 데이터 표 | 해당 셀 "·" 표시 | "은현면, 맹장수술: ·" |
| 수술-질병 매트릭스 | 해당 셀 회색 + "N/A" | 셀 배경 #F3F4F6 |
| CSV 내보내기 | 건수 열 "<5" 텍스트 | count: "<5" |
| Markdown 보고서 | 문장 내 "<5건" 명시 | "5건 미만으로 집계됨" |

#### 데이터 저장 정책

| 데이터 유형 | 저장 위치 | 보존 기간 | 암호화 |
|------------|----------|----------|--------|
| 원본 CSV/Excel | 없음 (세션 메모리) | 세션 종료 시 폐기 | N/A |
| 매핑 테이블 (ICD, 수술, 주소) | IndexedDB | 영구 (사용자 삭제 시까지) | 브라우저 내장 |
| 분석 결과 (집계) | 없음 | 다운로드 시에만 생성 | N/A |
| 설정 (필터, 테마) | IndexedDB | 영구 | 불필요 |

### 🛡️ 데이터 흐름

```
[사용자 PC]
    ↓ (파일 업로드 / 필터 변경)
[브라우저: Next.js (Vercel)]
    ├─ Web Worker: DuckDB WASM 병렬 처리
    ├─ IndexedDB: 매핑 테이블 로드/저장
    └─ 주소/코드 처리:
         ├─ 동·호 제거
         ├─ 도로명+건물번호 추출
         └─ [NCP API Gateway → Cloud Functions(FastAPI)]
              ↓
         [NCP Cloud Functions (FastAPI)]
              ├─ OpenStreetMap Nominatim API 호출 (프록시 경유)
              ├─ 공공데이터 캐시 조회 (Cloud DB for PostgreSQL)
              ├─ NCP Secret Manager에서 API 키 로드
              └─ 결과 반환 (좌표/H3 인덱스, 캐시 메타)
         ↓
    [브라우저 내부]
         ├─ H3 격자 변환 (0.1km²)
         ├─ 히트맵/차트 데이터 생성
         └─ UI 렌더링
    ↓ (사용자 요청 시)
[Markdown/PNG/CSV 다운로드]
    └─ n<5 마스킹 적용

[AWS Backup Path (장애 시)]
    ├─ Route53 헬스체크 → AWS API Gateway → Lambda(FastAPI)
    ├─ Lambda → Aurora PostgreSQL 리드 리플리카 조회
    └─ CloudWatch/SNS: 페일오버 이벤트 기록

[NCP Data Lake 파이프라인]
    ├─ Event Scheduler → Cloud Functions(ETL) → 공공데이터 API 호출
    ├─ Object Storage Raw → Data Forest/Spark 정제 → Cloud DB for PostgreSQL upsert
    └─ Cloud Log Analytics + Webhook: 장애·지연 알림 (필요 시 AWS 백업 파이프라인 기동)
```

### 📊 데이터 품질 관리

#### 자동 전처리

| 필드 | 입력 | 처리 | 출력 |
|------|------|------|------|
| **생년** | 19850315 | 2025-1985=40세 → 40대 | "40대" |
| **성별** | "M", "남", "1" | 정규화 | "남성" |
| **주소** | 도로명+건물+동·호 | 동·호 제거 → 지오코딩 → H3 | 격자 인덱스 |
| **질병** | "M179" (ICD-10) | IndexedDB 매핑 | "무릎관절증" |
| **수술** | "S80501" (EDI) | IndexedDB 매핑 | "무릎관절경수술" |
| **방문일** | "2024-03-15" | Date 파싱 → 재방문 계산 | 일 수 |

#### 품질 지표
- 주소 인식률: 85% 이상 (목표)
- ICD 매핑률: 95% 이상
- 수술 코드 매핑률: 90% 이상
- 누락 데이터: 전체 5% 이하
- 품질 배지: 상단 표시 (예: "주소 인식률 92%")

---

## 1️⃣1️⃣ 기술 스택

### 🏗️ 아키텍처 개요

```
[프론트엔드: Next.js (Vercel)]
  ├─ UI: React + TypeScript
  ├─ 스타일: Tailwind CSS + shadcn/ui
  ├─ 차트: ECharts / Recharts
  ├─ 지도: Leaflet.js + OpenStreetMap
  ├─ 연산: Web Worker + DuckDB WASM
  ├─ 저장: IndexedDB
  └─ 🆕 인증: Next-Auth (Auth.js) + JWT (세션 저장: Cloud DB for PostgreSQL)

        ↕ (API 호출: 지오코딩 + 인증 + 공공데이터 캐시)

[백엔드: FastAPI (NCP API Gateway + Cloud Functions)]
  ├─ 프록시: OpenStreetMap Nominatim API (레이트리밋 관리)
  ├─ 공공데이터 연동: Event Scheduler → Cloud Functions ETL
  ├─ 캐싱: Cloud DB for PostgreSQL + Cloud DB for Redis
  ├─ 키 보호: NCP Secret Manager
  └─ 감사 로그/모니터링: Cloud Log Analytics

[데이터 플랫폼: NCP Cloud DB for PostgreSQL + Object Storage]
  ├─ 사용자 정보 (users)
  ├─ 권한 관리 (roles, permissions)
  ├─ 세션 (sessions) 및 감사 로그 (audit_logs)
  └─ 공공데이터 스냅샷 (Raw/Processed, 버전 관리)

[보조/백업 서비스]
  ├─ AWS (대비): API Gateway + Lambda + Aurora PostgreSQL + S3 (비상 가용성)
  ├─ AWS EventBridge / Glue: 백업 데이터 파이프라인
  ├─ AWS SNS + Route53: 페일오버 및 알림
  ├─ Sentry: 프론트/백엔드 에러 추적
  ├─ Resend 또는 NCP Simple & Easy Notification Service: 이메일/알림
  └─ Naver Cloud Platform: Maps/Geocoding, CDN, WAF
```

### 📦 주요 기술 선정 이유

| 영역 | 기술 | 선정 이유 |
|------|------|----------|
| **프레임워크** | Next.js App Router (Vercel) | 서버 컴포넌트 지원, 글로벌 CDN, Zero-config 배포 |
| **🆕 인증** | Next-Auth v5 + Cloud DB 세션 스토어 | OAuth/Email 통합, 멀티 프로바이더 대응, 인프라 중립 |
| **🆕 데이터베이스** | NCP Cloud DB for PostgreSQL | 고가용성, 자동백업, VPC 내 Private Endpoint 제공 |
| **UI 컴포넌트** | shadcn/ui + Tailwind | Radix UI 접근성, 커스터마이징 용이 |
| **차트** | ECharts | 고성능, 히트맵·버블 지원, 테마 통일 |
| **지도** | Leaflet.js + OpenStreetMap | 오픈소스, 무료, 히트맵 플러그인 지원 |
| **로컬 DB** | IndexedDB | 브라우저 내장, 영구 저장, 10MB+ 지원 |
| **연산** | DuckDB WASM | SQL 쿼리, 10만 행 처리, 병렬화 |
| **Web Worker** | Rust/JS WASM | UI 블로킹 없이 대용량 처리 |
| **백엔드** | FastAPI on NCP Cloud Functions | 서버리스 확장성, Python 생태계, API Gateway와 연계 |
| **🆕 데이터 파이프라인** | NCP Event Scheduler + Cloud Functions + Data Forest | 공공데이터 OpenAPI 자동 수집/정제 |
| **🆕 세션 캐시** | NCP Cloud DB for Redis (Primary) / Amazon ElastiCache (Backup) | 빠른 세션 조회, 멀티 리전 DR |
| **🆕 이메일** | Resend / NCP Simple & Easy Notification Service | 트랜잭션 메일, 국내 발송 규제 대응 |
| **배포** | Vercel (프론트) + NCP API Gateway (백엔드) + AWS 백업 경로 | 프론트 글로벌 성능, 백엔드 국내 우선, 이중화 확보 |

---

## 1️⃣2️⃣ 성능 목표

### ⚡ 반응 시간 SLA

| 작업 | 목표 시간 | 측정 지점 |
|------|----------|----------|
| 파일 업로드 → 프리뷰 | ≤1.5초 | 50행 테이블 렌더 완료 |
| 주요 지표 렌더 | ≤5초 | KPI 카드 6개 표시 완료 |
| 필터 변경 반응 | ≤0.7초 | 차트 리렌더 완료 |
| 지도 히트맵 갱신 | ≤1.5초 | 히트맵 레이어 렌더 완료 |
| Surgery 탭 로드 | ≤2초 | 매트릭스+산점도 완료 |
| 매핑 파일 업로드 | ≤3초 | 검증+저장 완료 |
| IndexedDB 매핑 로드 | ≤0.3초 | 메모리 적재 |
| Markdown 보고서 생성 | ≤3초 | 파일 다운로드 시작 |

### 📊 처리 용량

| 항목 | 목표 | 비고 |
|------|------|------|
| 최대 행 수 | 100,000행 | DuckDB WASM 기준 |
| 동시 필터 개수 | 5개 | 성능 저하 없음 |
| 히트맵 포인트 | 5,000개 | H3 격자 집계 후 |
| 차트 데이터 포인트 | 1,000개/차트 | ECharts 권장 |
| IndexedDB 매핑 | 50,000개 | ICD+수술 코드 |

---

## 1️⃣3️⃣ 디자인 시스템

### 🎨 Figma 컴포넌트 라이브러리

```
📁 병원 CRM Design System v4.1
 │
 ├── 🎨 Foundation
 │    ├── Colors
 │    │    ├── Semantic (Positive/Negative/Warning)
 │    │    ├── Disease Categories (ColorBrewer Set3)
 │    │    ├── Surgery Categories (ColorBrewer Paired)
 │    │    └── Heatmap (YlOrRd, PuRd)
 │    │
 │    ├── Typography
 │    │    ├── Heading (Pretendard, 600)
 │    │    ├── Body (Pretendard, 400)
 │    │    └── Numeric (Inter Tabular, 500)
 │    │
 │    ├── Spacing (8px Grid)
 │    └── Elevation (Material Shadows)
 │
 ├── 🧩 Components (shadcn/ui)
 │    ├── Card (KPI/Info/Summary)
 │    ├── Alert (Critical/Warning/Info)
 │    ├── Button (Primary/Secondary/Ghost)
 │    ├── ToggleGroup (뷰 밀도)
 │    ├── Progress (로딩)
 │    └── Tooltip (차트 호버)
 │
 ├── 📊 Charts (ECharts)
 │    ├── Bar (질병/수술 순위)
 │    ├── Line (추세)
 │    ├── Pyramid (연령)
 │    ├── Pie (수술 카테고리)
 │    ├── Bubble (재방문 vs 환자수)
 │    ├── Matrix (수술-질병 연관)
 │    ├── Scatter (재원일수 vs 재방문율)
 │    ├── Heatmap (지도/요일별)
 │    └── Table (데이터 그리드)
 │
 ├── 📱 Templates
 │    ├── Dashboard Layout (Desktop/Tablet/Mobile)
 │    ├── Trend View
 │    ├── Boundary View
 │    └── Surgery View (NEW)
 │
 └── 📐 Guidelines
      ├── Accessibility (WCAG 2.1 AA)
      ├── Chart Design Rules
      ├── Color Usage
      └── Interaction Patterns
```

---

## 1️⃣4️⃣ 사용자 시나리오

### 🔄 기본 워크플로우

```
1. 파일 업로드
   - 방문 데이터 (CSV/Excel)
   - 수술 데이터 (선택)
   ↓ (1.5초 이내)

2. 자동 전처리
   - 생년 → 연령대
   - 도로명 → H3 좌표
   - ICD/수술 코드 → 매핑
   ↓ (5초 이내)

3. 분석 뷰 선택
   - 재방문 / 공간 / 질병 / 수술 축
   - Trend / Boundary / Table / Surgery 탭
   ↓

4. 결과 탐색
   - 차트 클릭 → 동기화
   - 필터 조합 (기간/질병/수술/연령/지역)
   ↓

5. 내보내기
   - Markdown 보고서
   - PNG 캡처
   - CSV 다운로드
```

### 💡 사용 사례

#### 사례 1: 계절별 수술 패턴 분석
**목표**: 무릎관절경수술이 언제 많은지 파악

**단계**:
1. 좌측 [수술] 탭 → "무릎관절경수술" 클릭
2. [Trend] 탭 → 월별 라인 차트 확인
3. 발견: 겨울(12~2월) 40% 증가
4. [북마크 저장] → 메모: "무릎수술 겨울철 집중"
5. [Markdown 보고서] 생성

#### 사례 2: 지역별 수술 수요 파악
**목표**: 백내장수술 수요가 높은 지역 발견

**단계**:
1. 수술 필터 → "백내장수술"
2. 지도 모드 → [수술량]
3. 히트맵 확인 → 남면·광적면 밀집도 높음
4. 마커 클릭 → 우측 패널: "남면 67건, 60대 이상 88%"
5. [PNG 캡처] → 사업계획 첨부

#### 사례 3: 수술 효과성 분석
**목표**: 재원일수와 재방문율 상관관계

**단계**:
1. [Surgery] 탭 → "재원일수 vs 재방문율 산점도"
2. 버블 호버 → 각 수술 지표 확인
3. 발견: 재원일수 ↑ → 재방문율 ↑ (상관계수 0.68)
4. [알림 설정] → "척추수술 재원 8일 이상 시 알림"

---

## 1️⃣5️⃣ 추후 예정 기능

### ✅ v4.1 즉시 적용
- [x] 병원 CRM 분석 (재방문, 질병, 지역)
- [x] 수술 데이터 분석 (수술량, 시기, 지역)
- [x] 공공데이터 매핑 파일 업로드
- [x] 오픈맵(OpenStreetMap) 히트맵 (4가지 모드)
- [x] n<5 자동 마스킹
- [x] Markdown/PNG 보고서
- [x] 🆕 로그인 및 권한 관리 (5단계)
- [x] 🆕 감사 로그 시스템
- [x] 🆕 회원가입 및 승인 프로세스

### 🔄 v4.2 단기 추가
- [ ] **스마트 비교 모드**: 두 조건 나란히 비교
- [ ] **인사이트 북마크**: 발견사항 저장 및 재현
- [ ] **알림 설정**: 임계값 기반 자동 알림
- [ ] **세션 히스토리**: 최근 파일 이력 저장
- [ ] **질병 워치리스트**: 관심 질병 모니터링
- [ ] **커스텀 KPI 빌더**: 사용자 정의 지표
- [ ] 🆕 **공공데이터 API 동기화**: HIRA/KOSIS 자동 수집 및 매핑 테이블 업데이트
- [ ] 🆕 **SSO 통합**: Azure AD, Google Workspace
- [ ] 🆕 **2단계 인증(2FA)**: TOTP 방식
- [ ] 🆕 **권한 위임**: 임시 권한 부여
- [ ] 🆕 **팀 단위 데이터 공유**: 팀별 데이터셋 격리

### 🚀 v4.3~4.4 중기 고급
- [ ] **자동 이상 탐지**: 통계 기반 패턴 탐지
- [ ] **모바일 요약 뷰**: 터치 최적화 대시보드
- [ ] **가이드 모드**: 초보자용 단계별 마법사
- [ ] **수술-질병 연관 분석 고도화**
- [ ] **수술 후 재방문 심층 분석**
- [ ] **요일별/시간대별 수술 패턴**

### 🔮 v4.5+ 장기 전략
- [ ] **예측 대시보드**: 시계열 예측 (ARIMA)
- [ ] **공공데이터 오버레이**: KOSIS/건보 연계
- [ ] **수술 수요 예측**: 분기별 수술량 예측
- [ ] **수술 효과성 스코어**: 종합 평가 지표
- [ ] **전국 평균 비교**: 벤치마킹 기능
- [ ] **시나리오 시뮬레이션**: 가상 조건 분석
- [ ] **🆕 네이버 맵 통합**: 국내 주소 정확도 향상을 위한 네이버 맵 API 연동 (선택적 업그레이드)

---

## 1️⃣6️⃣ 품질 관리

### ✅ 출시 전 체크리스트

#### 기능 검증
- [ ] 파일 업로드 오류 0건
- [ ] n<5 마스킹 일관 적용
- [ ] UI 반응 시간 SLA 준수
- [ ] 모든 차트 인터랙션 정상
- [ ] 지도 히트맵 안정성 99%+
- [ ] 내보내기 정상 작동
- [ ] 매핑 파일 업로드/저장 정상

#### 보안 검증
- [ ] PHI 로그 출력 0건
- [ ] 동·호 정보 외부 전송 0건
- [ ] API 키 환경변수 관리
- [ ] HTTPS 통신 강제
- [ ] CORS 정책 올바름
- [ ] n<5 데이터 모든 출력 마스킹
- [ ] 🆕 비밀번호 해싱 (bcrypt, cost 12)
- [ ] 🆕 세션 토큰 HttpOnly 쿠키
- [ ] 🆕 JWT 서명 검증
- [ ] 🆕 로그인 시도 제한 (5회/10분)
- [ ] 🆕 감사 로그 암호화 저장
- [ ] 🆕 권한별 API 엔드포인트 보호
- [ ] 🆕 SQL Injection 방어 (Parameterized Query)
- [ ] 🆕 XSS 방어 (Content Security Policy)

#### 접근성 (WCAG 2.1 AA)
- [ ] 키보드 네비게이션 가능
- [ ] 스크린 리더 지원
- [ ] 색상 대비비 4.5:1 이상
- [ ] 터치 타겟 최소 48×48px
- [ ] 폼 레이블 및 에러 메시지 명확

#### 성능 검증
- [ ] Lighthouse: Performance 90+ / Accessibility 95+
- [ ] Core Web Vitals: LCP ≤2.5초, FID ≤100ms, CLS ≤0.1
- [ ] 10만 행 데이터 처리 가능
- [ ] 메모리 누수 없음

### 🧪 테스트 전략

#### 단위 테스트 (Jest)
- 데이터 전처리 함수
- 집계 로직 (재방문율, 평균)
- H3 격자 변환
- n<5 마스킹
- 커버리지: 80% 이상

#### 통합 테스트 (Playwright)
1. 파일 업로드 → 프리뷰
2. 필터 선택 → 차트 갱신
3. 지도 마커 클릭 → 카드 업데이트
4. 매핑 파일 업로드 → 적용
5. 보고서 생성 → 다운로드

---

## 1️⃣7️⃣ 참고 자료

### 📚 UI/UX 설계
- [Nielsen Norman Group](https://www.nngroup.com/articles/) - UX 베스트 프랙티스
- [Material Design](https://m3.material.io/) - 구글 디자인 시스템
- [Ant Design](https://ant.design/) - React UI 프레임워크
- [shadcn/ui](https://ui.shadcn.com/) - Tailwind 컴포넌트
- [Mobbin](https://mobbin.com/web) - 실제 서비스 UX 패턴

### 📊 데이터 시각화
- [ColorBrewer](https://colorbrewer2.org/) - 색각이상 친화 팔레트
- [Data Viz Project](https://datavizproject.com/) - 차트 선택 가이드
- [Observable HQ](https://observablehq.com/) - 인터랙티브 시각화
- [ECharts Gallery](https://echarts.apache.org/examples/en/index.html) - 고성능 차트
- [Vega-Lite](https://vega.github.io/vega-lite/examples/) - JSON 시각화 문법

### 🗺️ 지도 및 공간 분석
- [OpenStreetMap](https://www.openstreetmap.org/) - 오픈소스 지도 데이터
- [Nominatim API](https://nominatim.org/) - OpenStreetMap 지오코딩 서비스
- [Leaflet.js](https://leafletjs.com/) - 오픈소스 지도 라이브러리
- [Leaflet Heat](https://github.com/Leaflet/Leaflet.heat) - Leaflet 히트맵 플러그인
- [Kepler.gl](https://kepler.gl/) - GUI 기반 히트맵
- [deck.gl Gallery](https://deck.gl/gallery/) - WebGL 지리 데이터
- [Mapbox Style](https://www.mapbox.com/gallery/) - 지도 테마
- [🆕 Naver Maps API v3](https://navermaps.github.io/maps.js.ncp/docs/) - 네이버 지도 공식 문서 (추후 업데이트용)

### 🏥 의료 데이터 시각화
- [WHO Data](https://www.who.int/data/gho) - 전세계 질병 통계
- [Our World in Data](https://ourworldindata.org/) - 보건 시계열
- [Tableau Public](https://public.tableau.com/en-us/gallery/) - 의료 시각화 샘플

### 🔧 기술 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs) - 배포/환경변수/Edge Functions
- [🆕 네이버 클라우드 플랫폼 Maps API](https://api.ncloud-docs.com/docs/application-maps-overview) (추후 업데이트용)
- [NCP API Gateway](https://api.ncloud-docs.com/docs/network-apigw-overview)
- [NCP Cloud Functions](https://api.ncloud-docs.com/docs/compute-cloudfunctions-overview)
- [NCP Cloud DB for PostgreSQL](https://api.ncloud-docs.com/docs/database-cdb-postgresql-overview)
- [NCP Cloud DB for Redis](https://api.ncloud-docs.com/docs/database-cdb-redis-overview)
- [NCP Object Storage](https://api.ncloud-docs.com/docs/storage-objectstorage-overview)
- [NCP Cloud Data Forest](https://www.ncloud.com/product/dataAnalytics/cloudDataForest)
- [NCP Cloud Log Analytics](https://www.ncloud.com/product/managementMonitering/cloudLogAnalytics)
- [NCP Secret Manager](https://api.ncloud-docs.com/docs/security-secret-manager-overview)
- [DuckDB WASM](https://duckdb.org/docs/api/wasm/overview.html)
- [H3 Geospatial Indexing](https://h3geo.org/)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- 🆕 [Next-Auth v5 (Auth.js)](https://authjs.dev/)
- 🆕 (백업) [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- 🆕 (백업) [Amazon API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- 🆕 (백업) [Amazon EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/what-is-amazon-eventbridge.html)
- 🆕 (백업) [AWS Glue](https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html)
- 🆕 (백업) [Amazon Aurora PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html)
- 🆕 (백업) [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
- 🆕 [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- 🆕 [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- 🆕 [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

### 📂 공공데이터 출처
- [공공데이터포털](https://www.data.go.kr/) - 건강보험심사평가원 수가코드
- [통계청 KOSIS](https://kosis.kr/) - KCD-8 질병/수술 분류
- [건강보험심사평가원](https://www.hira.or.kr/) - 행위코드
- [질병관리청](https://www.kdca.go.kr/) - 한국 질병코드
- [보건복지부 데이터포털](https://data.kihasa.re.kr/) - 의료행위 분류표

---

## 📝 부록

### 📋 용어 정의

| 용어 | 정의 |
|------|------|
| **PHI** | Protected Health Information (보호 대상 개인건강정보) |
| **n<5 마스킹** | 5명 미만 데이터는 "<5명" 또는 "·"로 표시 |
| **H3 격자** | Uber의 육각형 지리 인덱싱 시스템 (Resolution 9 = 0.1km²) |
| **재방문율** | (재방문 환자수 / 전체 환자수) × 100 |
| **이탈 질병** | 재방문율이 평균 대비 20%p 이상 낮은 질병 |
| **재원일수** | 퇴원일 - 수술일 (입원 기간) |
| **수술 효과성** | 재원일수, 재방문율, 합병증률 종합 지표 |
| **KPI** | Key Performance Indicator (핵심 성과 지표) |
| **SLA** | Service Level Agreement (서비스 수준 협약) |
| **ICD-10** | International Classification of Diseases (국제질병분류) |
| **KCD-8** | Korean Standard Classification of Diseases (한국표준질병사인분류) |
| **EDI 코드** | Electronic Data Interchange (건강보험 전산 코드) |
| 🆕 **RBAC** | Role-Based Access Control (역할 기반 접근 제어) |
| 🆕 **SSO** | Single Sign-On (단일 로그인) |
| 🆕 **2FA** | Two-Factor Authentication (2단계 인증) |
| 🆕 **JWT** | JSON Web Token (세션 토큰 형식) |
| 🆕 **OAuth** | Open Authorization (외부 인증 프로토콜) |
| 🆕 **감사 로그** | 사용자 활동 기록 (Audit Log) |
| 🆕 **세션** | 로그인 후 유지되는 인증 상태 |
| 🆕 **HttpOnly 쿠키** | JavaScript 접근 불가 쿠키 (XSS 방어) |

### 📐 계산 공식

#### 재방문율
```
재방문율 (%) = (재방문 환자수 / 전체 환자수) × 100

재방문 환자: 윈도우 기간 내 2회 이상 방문
```

#### 평균 재방문 간격
```
평균 재방문 간격 (일) = Σ(다음 방문일 - 이전 방문일) / 재방문 환자수
```

#### 이탈률
```
이탈률 (%) = (이탈 환자수 / 전체 환자수) × 100

이탈 환자: 마지막 방문 후 90일 이상 재방문 없음
```

#### 재원일수
```
재원일수 (일) = 퇴원일 - 수술일

예: 수술일 2024-03-15, 퇴원일 2024-03-18 → 3일
```

#### 수술 계절 지수
```
계절 지수 = (특정 월 수술량 / 월평균 수술량) × 100

예: 12월 45건, 월평균 30건 → 150 (50% 높음)
```

---

## ✅ 최종 요약

### 🎯 핵심 가치
1. **완전 로컬 처리** → PHI 보안 확보
2. **실시간 시각화** → 0.7초 이내 반응
3. **4대 분석 축** → 재방문·공간·질병·수술 중심
4. **비즈니스 연계** → Markdown/PNG 보고서
5. **공공데이터 활용** → 사용자 직접 매핑 업로드

### 🏆 차별점
- 서버 저장 없이 브라우저 내 분석 (보안)
- H3 격자 기반 개인정보 보호
- 사용자가 공공데이터 직접 업로드
- 오픈맵(OpenStreetMap) 기반 히트맵 (오픈소스, 무료)
- 수술 데이터 통합 분석 (언제/어디서/어떤 수술)
- Vercel 글로벌 프론트 + Naver Cloud 백엔드 조합으로 성능/규제 동시 충족
- AWS 서버리스 + Naver Cloud 연계로 공공데이터 자동 동기화 지원

### 📊 예상 효과
- 분석 시간 70% 단축
- 의사결정 속도 3배 향상
- 보고서 작성 시간 80% 단축
- 데이터 활용률 250% 증가
- 수술실 가동률 20% 향상
- 환자 만족도 15% 증가

### 📧 문의 및 지원
- **제작자**: boam79
- **이메일**: ckadltmfxhrxhrxhr@gmail.com
- **프로젝트**: 병원 CRM v4.5
- **GitHub**: (추후 공개 예정)

---

**문서 버전**: v4.1 Final  
**최종 수정일**: 2025-10-22  
**제작자**: boam79  
**문의**: ckadltmfxhrxhrxhr@gmail.com  
**승인**: 기획팀, 기술팀, 디자인팀, 보안팀, 경영진

---

**🎉 병원 CRM — 데이터 중심 의료 의사결정의 시작**
