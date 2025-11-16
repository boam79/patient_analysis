import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface FilterState {
  // 기간 필터
  dateRange: {
    start: string // YYYY-MM-DD
    end: string
  }
  
  // 윈도우 (재방문 간격)
  windowSize: number // 일 단위 (30, 90, 180)
  
  // 질병 필터
  selectedDiseases: string[] // 질병 코드 또는 이름
  
  // 수술 필터
  selectedSurgeries: string[] // 수술 코드 또는 이름
  
  // 연령 필터
  ageGroups: string[] // ['20대', '30대', ...]
  
  // 지역 필터
  selectedRegions: string[] // 시/군/구
  
  // 성별 필터
  genders: ('남성' | '여성')[]
  
  // 지도 선택 영역
  selectedH3Index: string | null
  
  // 차트 선택 데이터
  selectedChartData: {
    type: 'disease' | 'surgery' | 'region' | 'age' | null
    value: string | null
  }
}

export interface FilterActions {
  // 기간 설정
  setDateRange: (start: string, end: string) => void
  
  // 윈도우 설정
  setWindowSize: (size: number) => void
  
  // 질병 필터
  setDiseases: (diseases: string[]) => void
  addDisease: (disease: string) => void
  removeDisease: (disease: string) => void
  clearDiseases: () => void
  
  // 수술 필터
  setSurgeries: (surgeries: string[]) => void
  addSurgery: (surgery: string) => void
  removeSurgery: (surgery: string) => void
  clearSurgeries: () => void
  
  // 연령 필터
  setAgeGroups: (ageGroups: string[]) => void
  toggleAgeGroup: (ageGroup: string) => void
  clearAgeGroups: () => void
  
  // 지역 필터
  setRegions: (regions: string[]) => void
  addRegion: (region: string) => void
  removeRegion: (region: string) => void
  clearRegions: () => void
  
  // 성별 필터
  setGenders: (genders: ('남성' | '여성')[]) => void
  toggleGender: (gender: '남성' | '여성') => void
  
  // 지도 선택
  setSelectedH3Index: (h3Index: string | null) => void
  
  // 차트 선택
  setSelectedChartData: (
    type: 'disease' | 'surgery' | 'region' | 'age' | null,
    value: string | null
  ) => void
  
  // 전체 초기화
  resetFilters: () => void
}

export type FilterStore = FilterState & FilterActions

const defaultState: FilterState = {
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31',
  },
  windowSize: 90,
  selectedDiseases: [],
  selectedSurgeries: [],
  ageGroups: [],
  selectedRegions: [],
  genders: ['남성', '여성'],
  selectedH3Index: null,
  selectedChartData: {
    type: null,
    value: null,
  },
}

export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,

        // 기간 설정
        setDateRange: (start, end) =>
          set((state) => ({
            dateRange: { start, end },
          })),

        // 윈도우 설정
        setWindowSize: (size) =>
          set(() => ({
            windowSize: size,
          })),

        // 질병 필터
        setDiseases: (diseases) =>
          set(() => ({
            selectedDiseases: diseases,
          })),

        addDisease: (disease) =>
          set((state) => ({
            selectedDiseases: [...state.selectedDiseases, disease],
          })),

        removeDisease: (disease) =>
          set((state) => ({
            selectedDiseases: state.selectedDiseases.filter((d) => d !== disease),
          })),

        clearDiseases: () =>
          set(() => ({
            selectedDiseases: [],
          })),

        // 수술 필터
        setSurgeries: (surgeries) =>
          set(() => ({
            selectedSurgeries: surgeries,
          })),

        addSurgery: (surgery) =>
          set((state) => ({
            selectedSurgeries: [...state.selectedSurgeries, surgery],
          })),

        removeSurgery: (surgery) =>
          set((state) => ({
            selectedSurgeries: state.selectedSurgeries.filter((s) => s !== surgery),
          })),

        clearSurgeries: () =>
          set(() => ({
            selectedSurgeries: [],
          })),

        // 연령 필터
        setAgeGroups: (ageGroups) =>
          set(() => ({
            ageGroups,
          })),

        toggleAgeGroup: (ageGroup) =>
          set((state) => {
            const exists = state.ageGroups.includes(ageGroup)
            return {
              ageGroups: exists
                ? state.ageGroups.filter((g) => g !== ageGroup)
                : [...state.ageGroups, ageGroup],
            }
          }),

        clearAgeGroups: () =>
          set(() => ({
            ageGroups: [],
          })),

        // 지역 필터
        setRegions: (regions) =>
          set(() => ({
            selectedRegions: regions,
          })),

        addRegion: (region) =>
          set((state) => ({
            selectedRegions: [...state.selectedRegions, region],
          })),

        removeRegion: (region) =>
          set((state) => ({
            selectedRegions: state.selectedRegions.filter((r) => r !== region),
          })),

        clearRegions: () =>
          set(() => ({
            selectedRegions: [],
          })),

        // 성별 필터
        setGenders: (genders) =>
          set(() => ({
            genders,
          })),

        toggleGender: (gender) =>
          set((state) => {
            const exists = state.genders.includes(gender)
            return {
              genders: exists
                ? state.genders.filter((g) => g !== gender)
                : [...state.genders, gender],
            }
          }),

        // 지도 선택
        setSelectedH3Index: (h3Index) =>
          set(() => ({
            selectedH3Index: h3Index,
          })),

        // 차트 선택
        setSelectedChartData: (type, value) =>
          set(() => ({
            selectedChartData: { type, value },
          })),

        // 전체 초기화
        resetFilters: () =>
          set(() => ({
            ...defaultState,
          })),
      }),
      {
        name: 'pdr-filter-storage',
        partialize: (state) => ({
          dateRange: state.dateRange,
          windowSize: state.windowSize,
          genders: state.genders,
        }),
      }
    )
  )
)

// 선택자 헬퍼 함수
export const selectActiveFilters = (state: FilterStore) => {
  const activeCount =
    (state.selectedDiseases.length > 0 ? 1 : 0) +
    (state.selectedSurgeries.length > 0 ? 1 : 0) +
    (state.ageGroups.length > 0 ? 1 : 0) +
    (state.selectedRegions.length > 0 ? 1 : 0) +
    (state.genders.length < 2 ? 1 : 0)

  return {
    count: activeCount,
    hasActiveFilters: activeCount > 0,
  }
}

// SQL WHERE 절 생성 헬퍼
export const generateWhereClause = (state: FilterStore): string => {
  const conditions: string[] = []

  // 기간 필터
  conditions.push(
    `date >= '${state.dateRange.start}' AND date <= '${state.dateRange.end}'`
  )

  // 질병 필터
  if (state.selectedDiseases.length > 0) {
    const diseaseList = state.selectedDiseases.map((d) => `'${d}'`).join(', ')
    conditions.push(`disease IN (${diseaseList})`)
  }

  // 수술 필터
  if (state.selectedSurgeries.length > 0) {
    const surgeryList = state.selectedSurgeries.map((s) => `'${s}'`).join(', ')
    conditions.push(`surgery IN (${surgeryList})`)
  }

  // 연령 필터
  if (state.ageGroups.length > 0) {
    const ageList = state.ageGroups.map((a) => `'${a}'`).join(', ')
    conditions.push(`age_group IN (${ageList})`)
  }

  // 지역 필터
  if (state.selectedRegions.length > 0) {
    const regionList = state.selectedRegions.map((r) => `'${r}'`).join(', ')
    conditions.push(`region IN (${regionList})`)
  }

  // 성별 필터
  if (state.genders.length === 1) {
    conditions.push(`gender = '${state.genders[0]}'`)
  }

  // H3 인덱스 필터
  if (state.selectedH3Index) {
    conditions.push(`h3_index = '${state.selectedH3Index}'`)
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
}

