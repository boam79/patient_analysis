import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// 환자 데이터 타입
export interface PatientData {
  patient_id: string
  visit_date: string
  age: number
  gender: string
  disease_code: string
  disease_name: string
  surgery_code?: string
  surgery_name?: string
  address: string
  region: string
  latitude?: number
  longitude?: number
  h3_index?: string
}

// 질병 통계 타입
export interface DiseaseStats {
  name: string
  count: number
  percentage: number
}

// 지도 데이터 타입
export interface MapData {
  latitude: number
  longitude: number
  value: number
  h3Index: string
  region: string
  patientCount?: number
}

// 연령 피라미드 데이터 타입
export interface AgePyramidData {
  ageGroup: string
  male: number
  female: number
}

// 월별 트렌드 데이터 타입
export interface MonthlyTrendData {
  month: string
  recurrenceRate: number
  newPatients: number
  returningPatients: number
}

export interface DataState {
  // 원본 데이터
  rawData: PatientData[]
  isDataLoaded: boolean
  
  // 처리된 데이터
  diseases: DiseaseStats[]
  mapData: MapData[]
  agePyramid: AgePyramidData[]
  monthlyTrend: MonthlyTrendData[]
  
  // KPI 데이터
  totalPatients: number
  recurrenceRate: number
  avgInterval: number
  totalSurgery: number
  
  // 로딩 상태
  isLoading: boolean
  error: string | null
}

export interface DataActions {
  // 데이터 로드
  setRawData: (data: PatientData[]) => void
  processData: () => void
  
  // 개별 데이터 설정
  setDiseases: (diseases: DiseaseStats[]) => void
  setMapData: (mapData: MapData[]) => void
  setAgePyramid: (agePyramid: AgePyramidData[]) => void
  setMonthlyTrend: (monthlyTrend: MonthlyTrendData[]) => void
  
  // KPI 설정
  setKPI: (kpi: { totalPatients: number; recurrenceRate: number; avgInterval: number; totalSurgery: number }) => void
  
  // 상태 관리
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetData: () => void
}

const initialState: DataState = {
  rawData: [],
  isDataLoaded: false,
  diseases: [],
  mapData: [],
  agePyramid: [],
  monthlyTrend: [],
  totalPatients: 0,
  recurrenceRate: 0,
  avgInterval: 0,
  totalSurgery: 0,
  isLoading: false,
  error: null,
}

export const useDataStore = create<DataState & DataActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setRawData: (data) => {
        set({ rawData: data, isDataLoaded: true, error: null })
      },

      processData: () => {
        const { rawData } = get()
        if (!rawData || rawData.length === 0) return

        try {
          set({ isLoading: true, error: null })

          // 질병 통계 계산
          const diseaseMap = new Map<string, number>()
          rawData.forEach((patient) => {
            const count = diseaseMap.get(patient.disease_name) || 0
            diseaseMap.set(patient.disease_name, count + 1)
          })

          const diseases: DiseaseStats[] = Array.from(diseaseMap.entries())
            .map(([name, count]) => ({
              name,
              count,
              percentage: (count / rawData.length) * 100,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

          // 지도 데이터 계산 (지역별 집계)
          const regionMap = new Map<string, { lat: number; lng: number; count: number }>()
          rawData.forEach((patient) => {
            if (patient.latitude && patient.longitude) {
              const existing = regionMap.get(patient.region) || { lat: 0, lng: 0, count: 0 }
              regionMap.set(patient.region, {
                lat: (existing.lat * existing.count + patient.latitude) / (existing.count + 1),
                lng: (existing.lng * existing.count + patient.longitude) / (existing.count + 1),
                count: existing.count + 1,
              })
            }
          })

          const mapData: MapData[] = Array.from(regionMap.entries()).map(([region, data]) => ({
            latitude: data.lat,
            longitude: data.lng,
            value: data.count,
            h3Index: `h3-${region}`,
            region,
            patientCount: data.count,
          }))

          // 연령 피라미드 계산
          const ageGroupMap = new Map<string, { male: number; female: number }>()
          rawData.forEach((patient) => {
            const age = patient.age
            let ageGroup = ''
            if (age < 20) ageGroup = '10대 이하'
            else if (age < 30) ageGroup = '20대'
            else if (age < 40) ageGroup = '30대'
            else if (age < 50) ageGroup = '40대'
            else if (age < 60) ageGroup = '50대'
            else if (age < 70) ageGroup = '60대'
            else ageGroup = '70대 이상'

            const existing = ageGroupMap.get(ageGroup) || { male: 0, female: 0 }
            if (patient.gender === '남성' || patient.gender === 'M') {
              existing.male++
            } else {
              existing.female++
            }
            ageGroupMap.set(ageGroup, existing)
          })

          const agePyramid: AgePyramidData[] = [
            '70대 이상',
            '60대',
            '50대',
            '40대',
            '30대',
            '20대',
            '10대 이하',
          ].map((ageGroup) => ({
            ageGroup,
            male: ageGroupMap.get(ageGroup)?.male || 0,
            female: ageGroupMap.get(ageGroup)?.female || 0,
          }))

          // KPI 계산
          const totalPatients = rawData.length
          const surgeryCount = rawData.filter((p) => p.surgery_code).length
          const recurrenceRate = 45.2 // TODO: 실제 재방문율 계산 로직 필요
          const avgInterval = 28 // TODO: 실제 평균 간격 계산 로직 필요

          set({
            diseases,
            mapData,
            agePyramid,
            totalPatients,
            recurrenceRate,
            avgInterval,
            totalSurgery: surgeryCount,
            isLoading: false,
          })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      setDiseases: (diseases) => set({ diseases }),
      setMapData: (mapData) => set({ mapData }),
      setAgePyramid: (agePyramid) => set({ agePyramid }),
      setMonthlyTrend: (monthlyTrend) => set({ monthlyTrend }),

      setKPI: (kpi) => set(kpi),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      resetData: () => set(initialState),
    }),
    { name: 'DataStore' }
  )
)

