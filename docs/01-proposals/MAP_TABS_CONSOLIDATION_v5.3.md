# 지도 분석 탭 고도화·정리 제안서 (v5.3)

**작성일**: 2026-07-11  
**역할**: Planner + Executor Round A  
**범위**: `/dashboard/map`, `components/map/*`

---

## 1. 한 줄 요약

지도 분석은 **탭 8개가 같은 레이아웃을 8번 복제**하고, 재방문 정의가 대시보드와 어긋나며, 필터 결과가 비면 **샘플 좌표가 다시 뜹니다**.  
**4탭 + 보조 셀렉터 + 지도 1개**로 줄이고 지표를 윈도우·필터와 맞춥니다.

---

## 2. 현황 → 목표

| 항목 | Before | After |
|------|--------|-------|
| 분석 탭 | 신환·재환·환자수·재방문율·질병·수술·연령·성별 (8) | **분포 · 재방문 · 임상 · 인구통계 (4)** |
| LeafletMap | 탭마다 마운트 (최대 8) | **단일 인스턴스** |
| 재방문 | `visits.length > 1` | **`windowSize` 윈도우** |
| 빈 필터 결과 | SAMPLE 가짜 점 | **빈 레이어** |
| 수술 셀렉트 | 코드 옵션 vs name만 매칭 | **name \|\| code** |

### 탭 매핑

| 새 탭 | 보조 선택 | 구 탭 |
|-------|-----------|-------|
| 분포 | 방문수 / 고유환자 / 신환 / 재환 | patients, new, returning |
| 재방문 | 재방문율(%) / 재환 수 | recurrence (+ returning) |
| 임상 | 질병 \| 수술 + 항목 Select | disease, surgery |
| 인구통계 | 연령대 \| 성별(남성%) + 연령 Select | age, gender |

---

## 3. Round A (완료)

1. `lib/utils/map-metrics.ts` — 지역 레이어 공용 계산  
2. `map/page.tsx` 재구성 — 4탭 · 단일 지도 · 버그 수정  
3. 제안서 문서화 · 패키지 5.3.0

## 4. Round B (이번 구현)

- [x] InteractiveMap 삭제 → LeafletMap 단일 엔진  
- [x] 대시보드 임베드: 마커/원형/히트맵 + 선택 하이라이트 + 토글 필터  
- [x] 클릭 시 flyTo 지역  
- [x] LeafletMap remount 버그 수정 (center/zoom이 init deps에 있던 문제)

## 5. Round C (선택)

- 대시보드 ↔ 지도 페이지 deep-link (`?region=`)  
- 클러스터 모드
