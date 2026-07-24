# 분석·인사이트 정확도 점검 및 개선 제안 v5.8

**작성일**: 2026-07-24  
**모드**: Planner (구현은 Executor 승인 후)  
**범위**: 재방문·집계 정의 일관성, 경영 인사이트 근거, 샘플 편향 — **분석 로직 과설계/모델 도입은 비목표**

---

## 1. 점검 결론

핵심 윈도우 재방문(`N일 내 인접 방문 간격 ≤ window`)은 `computeRetentionSummary` / `isReturningWithinWindow`로 **대시보드 KPI·경영 인사이트·지도 스플릿**에 공유되어 견고합니다.  
정확도 문제는 **같은 라벨「재방문율」이 화면마다 다른 정의**인 점과, **인사이트 evidenceLevel 과대 표기**, **샘플 간격 분포 편향**에 집중됩니다.

가짜 HIRA 수술비중·COC 인용은 v5.3.4에서 이미 제거됨 (`management-insights.test.ts` 회귀 방지).

---

## 2. 지표 정의 매트릭스 (현재)

| 라벨 | 실제 정의 | 윈도우 | 위치 |
|------|-----------|--------|------|
| 대시보드 KPI 재방문율 | 환자 중 N일 내 재방문 ≥1 | `windowSize` | `page.tsx` + `strategy-metrics` |
| 헤더/store KPI | 동일 로직 | **고정 90일** | `data-store.processData` |
| 지도 recurrence_rate | **지역 내** 방문만으로 N일 재방문 | `windowSize` | `map-metrics` |
| 월별 「재방문율」 | 생애 첫방문 이후 월 = 재방문 | **무시** (`_windowSize`) | `monthly-trend.ts` |
| 수술 산점도 재방문율 | 전역 방문 **2회+** | **없음** | `dashboard/page.tsx` |
| 수술(전략) | 수술 환자 + 전역 윈도우 | `windowSize` | `disease-surgery-strategy` |
| 지역 시장 분석 | 지역 내 **2회+** | **없음** | `regional-market-analysis` |
| 질병별 재방문율 | 해당 질병 방문만 간격 | `windowSize` | `computeDiseaseRecurrenceRates` |
| 유입 분석 카드 | 큰 숫자=2회+, 부제=윈도우율 | 혼재 | `patient-flow-analysis` |

---

## 3. 발견 사항 (우선순위)

### P0 — 라벨·정의 충돌 (숫자 신뢰도 직격)

1. **수술 산점도 ≠ 전략 수술 재방문**  
   대시보드: `patientVisitCountMap > 1`. 전략: `isReturningWithinWindow`.  
   → 동일 수술이라도 화면마다 %.

2. **월별 추세 차트**  
   제목「재방문율」이지만 생애 신규/재방문. 윈도우 변경해도 **불변**.  
   KPI·인사이트와 비교하면 사용자가 「버그」로 인식.

3. **지역 시장 분석**  
   2회+ 비율을 재방문율로 표기. 지도/바운더리(윈도우)와 불일치.

4. **환자 유입 카드**  
   본문 수치(2회+)와 부제(윈도우율) 혼재 → 인사이트 해석 오류.

### P1 — 집계·근거·편향

5. **store KPI 고정 90일** vs UI `windowSize` — 헤더 숫자와 대시보드 KPI 어긋날 수 있음.  
6. **질병 재방문 분모**: 질병 방문만 vs 첫 질환 귀속 + `rate×total` 역산 (`patient-flow`) → 건수·율 불일치 가능.  
7. **지역 귀속**: 지도=지역 내 방문 / 유입 Top=첫 방문 지역+전역 윈도우 / 박스플롯=첫 방문 지역 — 의도적일 수 있으나 **UI에 미설명**.  
8. **질환 포트폴리오 `evidenceLevel: 'official'`** — CRM 질병명 근사인데 지정규칙(MDC)을 official로 붙임 → 과신.  
9. **하드코딩 임계** 신규 >70% / <25%, 연환산 ≥6 — 벤치마크 모듈 밖.  
10. **샘플 생성** 재방문 간격 14–120일 → 30일 윈도우면 재방문율 인위적 저조, 90일이면 유리.  
11. **업로드 32bit 해시 patient_id** — 충돌 시 재방문율 과대.  
12. **날짜 `new Date('YYYY-MM-DD')` UTC** — 월 경계 하루 밀림 가능 (코호트·월별).

### P2 — 표현·경미

13. 합성 `confidence` 점수가 통계 CI처럼 오해될 여지.  
14. 수술 비중 = 방문 **행** 기준 (환자·에피소드와 다름) — 라벨 보완.  
15. RFM/코호트는 윈도우 미사용(타당)이나 KPI와 병치 시 설명 필요.

---

## 4. 이미 견고한 점

- `resolvePatientId` / `groupVisitsByPatient` 환자키 통일  
- `computeRetentionSummary` + 경영 인사이트·executive 연동  
- 벤치마크 official/literature/operational 분리 + 가짜 HIRA 회귀 테스트  
- 지도 샘플 좌표 폴백 금지, 런타임 `Math.random` 없음  
- 코호트 Wilson CI, RFM 데이터 기준일

---

## 5. 고도화 제안 (실행 단위)

### Phase A — 정의 단일화·라벨 정직화 (필수, 침습도 낮음)

| ID | 작업 | 성공 기준 |
|----|------|-----------|
| A1 | 수술 산점도 → `isReturningWithinWindow` (또는 「다회 방문율」로 라벨 분리) | 대시보드·전략 수술 재방문 정의 일치 또는 라벨 구분 |
| A2 | 월별 차트 제목 → 「월별 신규·생애재방문」 또는 윈도우 시리즈 분리; `_windowSize` 미사용 문서화/제거 | 윈도우 변경 시 사용자 기대와 문서 일치 |
| A3 | 지역 시장·유입: 2회+는 「다회 방문」, 윈도우율은 별 컬럼/`computeRegionPatientSplit` | 동일 페이지에 두 정의 공존 시 라벨로 구분 |
| A4 | 대시보드 KPI·InsightBanner에 `· {windowSize}일` 표기 | 벤치마크와 비교 시 윈도우 가시 |

### Phase B — 파이프라인·인사이트 근거 (권장)

| ID | 작업 | 성공 기준 |
|----|------|-----------|
| B1 | `processData(windowSize?)` 또는 store KPI를 「업로드 요약(90일)」로 UI 구분 | 헤더≠필터 KPI 혼동 제거 |
| B2 | 질병 재방문: rate·건수 동일 집합; 역산 제거 | 유입 질병 표 합계 일치 테스트 |
| B3 | 질환 포트폴리오 `evidenceLevel` → `operational`(또는 literature) | official은 MDC 실집계만 |
| B4 | 임계값 70/25/6 → `*_OPS` 상수 + 근거 note | 벤치마크 파일에 집중 |
| B5 | 샘플 모드 인사이트/배너에 「샘플 간격 14–120일 편향」 한 줄 | 데모 해석 오해 감소 |
| B6 | 날짜 파싱 `extractMonth`/로컬 noon 통일 | 월별·코호트 경계 테스트 |

### Phase C — 정확도 강화 (선택, 중침습)

| ID | 작업 | 성공 기준 |
|----|------|-----------|
| C1 | 업로드 ID: `name\|address` 또는 충돌 감지 로그 | 해시 충돌 silent merge 방지 |
| C2 | 지표 glossary UI (재방문율 / 다회방문 / 생애재방문) | 전략·대시보드 공통 툴팁 |
| C3 | 인사이트 confidence를 「표본 가산 점수」로 라벨 변경 또는 Wilson CI 병기 | CI 오해 방지 |
| C4 | 샘플 생성기: 윈도우별 기대 재방문율 스냅샷 테스트 | 회귀 시 알림 |

**비목표**: TensorFlow 예측, 외부 EHR 연동, 차트 라이브러리 교체.

---

## 6. 권장 착수 순서

1. **A1–A4** (라벨·헬퍼 통일) — ROI 최고  
2. **B1–B3** (store 구분 + evidenceLevel)  
3. 사용자 승인 후 **B4–B6 / C**

예상 효과: 「화면마다 다른 재방문율」 불만 제거, 경영 인사이트 과신 감소, 샘플·실데이터 해석 실관성 향상.

---

## 7. Executor 대기

구현 범위 지시 예:
- 「Executor로 Phase A만」
- 「Executor로 A+B」
- 「전부」
