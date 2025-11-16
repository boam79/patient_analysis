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
      // 1. 지역별 환자 수 집계
      const regionCountMap = new Map<string, number>()
      rawData.forEach((patient) => {
        if (patient.region && patient.region !== '미분류') {
          const count = regionCountMap.get(patient.region) || 0
          regionCountMap.set(patient.region, count + 1)
        }
      })

      // 2. 주요 지역 좌표 매핑 (샘플)
      const regionCoordinates: Record<string, { lat: number; lng: number }> = {
        '서울 종로구': { lat: 37.5730, lng: 126.9794 },
        '서울 중구': { lat: 37.5641, lng: 126.9979 },
        '서울 용산구': { lat: 37.5326, lng: 126.9900 },
        '서울 성동구': { lat: 37.5634, lng: 127.0368 },
        '서울 강남구': { lat: 37.5172, lng: 127.0473 },
        '서울 서초구': { lat: 37.4836, lng: 127.0327 },
        '서울 송파구': { lat: 37.5145, lng: 127.1060 },
        '서울 강동구': { lat: 37.5301, lng: 127.1238 },
        '서울 마포구': { lat: 37.5663, lng: 126.9019 },
        '서울 영등포구': { lat: 37.5264, lng: 126.8963 },
        '서울 관악구': { lat: 37.4784, lng: 126.9516 },
        '서울 동작구': { lat: 37.5124, lng: 126.9393 },
        '서울 강서구': { lat: 37.5509, lng: 126.8495 },
        '서울 구로구': { lat: 37.4954, lng: 126.8874 },
        '서울 금천구': { lat: 37.4568, lng: 126.8956 },
        '서울 양천구': { lat: 37.5172, lng: 126.8664 },
        '경기 수원시': { lat: 37.2636, lng: 127.0286 },
        '경기 성남시': { lat: 37.4201, lng: 127.1262 },
        '경기 고양시': { lat: 37.6584, lng: 126.8320 },
        '경기 부천시': { lat: 37.5034, lng: 126.7660 },
        '경기 화성시': { lat: 37.1990, lng: 126.8310 },
        '경기 남양주시': { lat: 37.6360, lng: 127.2164 },
        '경기 안산시': { lat: 37.3219, lng: 126.8309 },
        '경기 안양시': { lat: 37.3943, lng: 126.9568 },
        '경기 평택시': { lat: 36.9922, lng: 127.1129 },
        '경기 시흥시': { lat: 37.3800, lng: 126.8028 },
        '경기 김포시': { lat: 37.6152, lng: 126.7157 },
        '경기 광명시': { lat: 37.4786, lng: 126.8644 },
        '경기 군포시': { lat: 37.3617, lng: 126.9352 },
        '경기 하남시': { lat: 37.5393, lng: 127.2147 },
        '인천 중구': { lat: 37.4738, lng: 126.6216 },
        '인천 동구': { lat: 37.4739, lng: 126.6433 },
        '인천 남구': { lat: 37.4539, lng: 126.6508 },
        '인천 연수구': { lat: 37.4095, lng: 126.6785 },
        '인천 남동구': { lat: 37.4474, lng: 126.7314 },
        '인천 부평구': { lat: 37.5069, lng: 126.7218 },
        '인천 계양구': { lat: 37.5376, lng: 126.7379 },
        '인천 서구': { lat: 37.5454, lng: 126.6759 },
      }

      // 3. 지도 데이터 생성
      const mapData: MapData[] = Array.from(regionCountMap.entries())
        .map(([region, count]) => {
          // 좌표가 있으면 사용, 없으면 서울 중심 기준 랜덤
          const coords = regionCoordinates[region] || {
            lat: 37.5665 + (Math.random() - 0.5) * 0.5,
            lng: 126.9780 + (Math.random() - 0.5) * 0.5,
          }
          return {
            latitude: coords.lat,
            longitude: coords.lng,
            value: count,
            h3Index: `h3_${region.replace(/\s/g, '_')}`,
            region,
            patientCount: count,
          }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 50) // 상위 50개 지역만 표시

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

