# 경영·마케팅 전략 분석 고도화·정리 제안서 (v5.2)

**작성일**: 2026-07-11  
**역할**: Planner  
**상태**: 제안 + Round A 즉시 수정 병행  
**범위**: `/dashboard/strategy` 및 `components/strategy/*`

---

## 1. 한 줄 요약

전략 페이지는 **지표 정의가 대시보드와 어긋나고**, 시계열·유지·질병-수술이 **탭 안에서 겹칩니다**.  
먼저 **재방문율·성장률·환자키·수술 정의를 대시보드와 맞춘 뒤**, 중복 패널을 줄이는 편이 효과적입니다.

---

## 2. 현황 (실측)

| 항목 | 규모 | 이슈 |
|------|------|------|
| 탭 | 7개 (v5.1에서 14→7) | IA는 개선됐으나 탭 내부 패널이 여전히 과다 |
| 컴포넌트 | 15개 · ~5.3k LOC | 재방문·월별·STL이 3~4중 중복 |
| 경영 인사이트 | 상단 고정 | 벤치마크 대비 재방문 정의 불일치로 경고 과다 |
| 필터 | 질병·지역·기간 등 | **`windowSize` 미전달** (대시보드만 반영) |

### 탭별 구성 (현재)

| 탭 | 포함 패널 | 겹침 |
|----|-----------|------|
| 경영 요약 | ExecutiveDashboard | ManagementInsights와 KPI 중복 |
| 유입·유지 | Flow · RFM · Cohort · Journey | 재방문/이탈 정의 4종 |
| 지역 시장 | RegionalMarket | 대시보드 Boundary와 유사 |
| 질병·수술·연관 | DiseaseSurgery · Association | 매트릭스+Lift 이중 |
| 세그먼트 | CustomerSegment | 연령·성별만 — 유지 가능 |
| 시계열·예측 | Trend · Seasonal · **Prediction** | 월별 3중 + MA 예측 중복 |
| 이상·고급 | Anomaly · AdvancedStats | STL이 Seasonal과 중복 |

---

## 3. 없어도 되는 것 / 정리 권장

### A. 즉시 정리 (신뢰·중복)

| 대상 | 이유 | 조치 |
|------|------|------|
| **PredictionAnalysis 단독 패널** | SeasonalForecast가 이미 단기 예측·계절지수·STL 제공 | 시계열 탭에서 **제거** (파일은 보류 후 삭제 가능) |
| PatientJourney **죽은 Sankey 코드** | 미호출 타입·레이아웃 | 삭제 |
| DiseaseSurgery **미렌더 surgeryRetention** | 계산만 하고 UI 없음 | 차트 노출 **또는** 계산 제거 |
| Association 주석 “지지도 5%” vs 코드 1% | 문서·코드 불일치 | **5%로 통일** |
| 미사용 import·변수 | 유지비 | 정리 |

### B. 다음 라운드 (IA)

| 대상 | 제안 |
|------|------|
| PatientJourney | 유입·유지 탭의 Flow에 **요약 카드로 흡수** 후 패널 제거 |
| TrendAnalysis 월별 | 대시보드 월별과 동일 계열 → **분기·요일·계절만** 남기거나 대시보드 링크 |
| AdvancedStatistics STL | SeasonalForecast로 링크, 고급 탭은 KM·PSI·k-means만 |
| ManagementInsights vs Executive | 인사이트는 문장만, 숫자는 Executive 단일 소스 |

### C. 유지

| 대상 | 이유 |
|------|------|
| RFM · Cohort | 운영 액션(이탈 위험·코호트)에 직접 연결 |
| Association Lift | 질병×수술 의사결정의 본체로 적합 |
| Anomaly + FDR | 이상 탐지 고유 가치 |
| RegionalMarket | 시장 점유·성장 스토리 |

---

## 4. 고도화 (가치 순)

### P0 — 정확성 (차트 추가보다 중요)

1. **`windowSize`를 전략 전 구간에 전달** — 재방문 = 대시보드와 동일 (`interval ≤ window`)
2. **공용 `computeRetentionSummary` / 성장률(고유 환자 MoM)**  
3. **RFM 기준일 = 데이터 최신 방문일** (`Date.now()` 금지)  
4. **성별 `1`/`2` 정규화** — 세그먼트와 대시보드 피라미드 일치  
5. **유입 분석 first-visit = 최소 방문일** (배열 순서가 아님)

### P1 — 품질

| 항목 | 고도화 |
|------|--------|
| 질병별 재방문 | `computeDiseaseRecurrenceRates(data, windowSize)` 재사용 |
| 지역 신규/재방문 | UI에 “지역 내 첫 방문 기준” 명시 또는 전역 환자+윈도우로 통일 |
| 인사이트 벤치마크 | 윈도우 재방문율에 맞춰 문구·임계 재검토 |
| 날짜 파싱 | cohort/seasonal/anomaly → `parseDate` 통일 |
| 계절 막대 색 | Recharts `<Cell>`로 피크/비수기 색 복구 |

### P2 — UX

- 탭 설명 한 줄 + “대시보드 KPI와 동일 정의” 뱃지  
- 고급 통계 접기 기본값  
- 샘플 데이터 연도를 상대 날짜로 생성 (선택)

---

## 5. 구현 로드맵

| 라운드 | 내용 | 상태 |
|--------|------|------|
| **A** | P0 버그 + Prediction 패널 제거 + 죽은 코드/주석 불일치 | **이번 커밋** |
| B | Journey 흡수, Trend 축소, Advanced STL 정리 | 승인 후 |
| C | 인사이트 단일 소스, UI 뱃지·접기 | 승인 후 |

---

## 6. 성공 기준

- 동일 업로드·동일 필터에서 **대시보드 KPI 재방문율 ≈ 전략 Executive/인사이트** (소수 반올림 차이만)
- `windowSize` 변경 시 전략 재방문 지표가 **즉시 반영**
- 시계열 탭에 **예측 단독 패널 없음** (SeasonalForecast로 흡수)
- vitest / tsc / build 통과

---

## 7. 리스크

- 재방문 정의를 바꾸면 기존 인사이트 경고 빈도가 달라짐 (의도된 교정)
- Prediction 제거 시 단순 MA만 보던 사용자는 Seasonal 예측 카드로 유도 필요
