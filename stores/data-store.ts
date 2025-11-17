import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

// 환자 데이터 타입
export interface PatientData {
  patient_id: string
  name: string  // 환자 이름 추가
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
    persist(
      (set, get) => ({
        ...initialState,

      setRawData: (data) => {
        // localStorage 용량 체크 (대략적)
        const dataSize = JSON.stringify(data).length
        const sizeMB = (dataSize / 1024 / 1024).toFixed(2)
        console.log(`📊 데이터 크기: ${sizeMB}MB (${data.length}개 레코드)`)
        
        if (dataSize > 4 * 1024 * 1024) { // 4MB 이상
          console.warn('⚠️ 데이터가 너무 큽니다. 브라우저 저장소 제한으로 일부 기능이 제한될 수 있습니다.')
        }
        
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
      // 1. 지역별 환자 수 및 좌표 집계
      const regionDataMap = new Map<string, { 
        count: number
        latitudes: number[]
        longitudes: number[]
      }>()
      
      rawData.forEach((patient) => {
        if (patient.region && patient.region !== '미분류') {
          const existing = regionDataMap.get(patient.region) || {
            count: 0,
            latitudes: [],
            longitudes: [],
          }
          
          existing.count++
          
          // 실제 데이터에 좌표가 있으면 수집
          if (patient.latitude && patient.longitude) {
            existing.latitudes.push(patient.latitude)
            existing.longitudes.push(patient.longitude)
          }
          
          regionDataMap.set(patient.region, existing)
        }
      })

      // 2. 백업용 전국 지역 좌표 매핑 (실제 좌표가 없을 때만 사용)
      const regionCoordinates: Record<string, { lat: number; lng: number }> = {
        // 서울
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
        '서울 강북구': { lat: 37.6396, lng: 127.0257 },
        '서울 성북구': { lat: 37.5894, lng: 127.0167 },
        '서울 노원구': { lat: 37.6542, lng: 127.0568 },
        '서울 은평구': { lat: 37.6027, lng: 126.9291 },
        '서울 서대문구': { lat: 37.5791, lng: 126.9368 },
        '서울 도봉구': { lat: 37.6688, lng: 127.0471 },
        // 경기
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
        '경기 용인시': { lat: 37.2410, lng: 127.1776 },
        '경기 파주시': { lat: 37.7599, lng: 126.7800 },
        '경기 의정부시': { lat: 37.7381, lng: 127.0337 },
        // 인천
        '인천 중구': { lat: 37.4738, lng: 126.6216 },
        '인천 동구': { lat: 37.4739, lng: 126.6433 },
        '인천 남구': { lat: 37.4539, lng: 126.6508 },
        '인천 연수구': { lat: 37.4095, lng: 126.6785 },
        '인천 남동구': { lat: 37.4474, lng: 126.7314 },
        '인천 부평구': { lat: 37.5069, lng: 126.7218 },
        '인천 계양구': { lat: 37.5376, lng: 126.7379 },
        '인천 서구': { lat: 37.5454, lng: 126.6759 },
        // 부산
        '부산 해운대구': { lat: 35.1631, lng: 129.1635 },
        '부산 부산진구': { lat: 35.1628, lng: 129.0530 },
        '부산 동래구': { lat: 35.2048, lng: 129.0785 },
        '부산 남구': { lat: 35.1364, lng: 129.0846 },
        '부산 북구': { lat: 35.1975, lng: 128.9896 },
        '부산 사상구': { lat: 35.1523, lng: 128.9910 },
        '부산 중구': { lat: 35.1064, lng: 129.0326 },
        '부산 서구': { lat: 35.0977, lng: 129.0246 },
        '부산 동구': { lat: 35.1296, lng: 129.0454 },
        '부산 영도구': { lat: 35.0912, lng: 129.0678 },
        // 대구
        '대구 중구': { lat: 35.8694, lng: 128.6065 },
        '대구 수성구': { lat: 35.8581, lng: 128.6311 },
        '대구 달서구': { lat: 35.8298, lng: 128.5327 },
        '대구 북구': { lat: 35.8858, lng: 128.5828 },
        '대구 동구': { lat: 35.8869, lng: 128.6354 },
        '대구 서구': { lat: 35.8719, lng: 128.5592 },
        // 광주
        '광주 서구': { lat: 35.1527, lng: 126.8895 },
        '광주 북구': { lat: 35.1741, lng: 126.9118 },
        '광주 남구': { lat: 35.1328, lng: 126.9026 },
        '광주 광산구': { lat: 35.1397, lng: 126.7934 },
        '광주 동구': { lat: 35.1460, lng: 126.9228 },
        // 대전
        '대전 유성구': { lat: 36.3621, lng: 127.3567 },
        '대전 서구': { lat: 36.3554, lng: 127.3838 },
        '대전 중구': { lat: 36.3255, lng: 127.4211 },
        '대전 동구': { lat: 36.3505, lng: 127.4545 },
        '대전 대덕구': { lat: 36.3686, lng: 127.4166 },
        // 울산
        '울산 남구': { lat: 35.5437, lng: 129.3300 },
        '울산 중구': { lat: 35.5690, lng: 129.3327 },
        '울산 북구': { lat: 35.5825, lng: 129.3614 },
        '울산 동구': { lat: 35.5049, lng: 129.4165 },
        // 세종
        '세종 세종시': { lat: 36.4801, lng: 127.2890 },
        // 강원
        '강원 춘천시': { lat: 37.8813, lng: 127.7300 },
        '강원 원주시': { lat: 37.3422, lng: 127.9202 },
        '강원 강릉시': { lat: 37.7519, lng: 128.8761 },
        '강원 동해시': { lat: 37.5247, lng: 129.1144 },
        '강원 속초시': { lat: 38.2070, lng: 128.5918 },
        // 충북
        '충청북 청주시': { lat: 36.6424, lng: 127.4890 },
        '충청북 충주시': { lat: 36.9910, lng: 127.9258 },
        '충청북 제천시': { lat: 37.1326, lng: 128.1910 },
        // 충남
        '충청남 천안시': { lat: 36.8151, lng: 127.1139 },
        '충청남 아산시': { lat: 36.7898, lng: 127.0018 },
        '충청남 서산시': { lat: 36.7848, lng: 126.4504 },
        '충청남 당진시': { lat: 36.8933, lng: 126.6472 },
        // 전북
        '전라북 전주시': { lat: 35.8242, lng: 127.1480 },
        '전라북 익산시': { lat: 35.9483, lng: 126.9575 },
        '전라북 군산시': { lat: 35.9676, lng: 126.7369 },
        '전라북 정읍시': { lat: 35.5699, lng: 126.8560 },
        // 전남
        '전라남 목포시': { lat: 34.8118, lng: 126.3922 },
        '전라남 여수시': { lat: 34.7604, lng: 127.6622 },
        '전라남 순천시': { lat: 34.9507, lng: 127.4872 },
        '전라남 나주시': { lat: 35.0160, lng: 126.7107 },
        // 경북
        '경상북 포항시': { lat: 36.0190, lng: 129.3435 },
        '경상북 구미시': { lat: 36.1195, lng: 128.3445 },
        '경상북 경주시': { lat: 35.8562, lng: 129.2247 },
        '경상북 안동시': { lat: 36.5684, lng: 128.7294 },
        // 경남
        '경상남 창원시': { lat: 35.2279, lng: 128.6815 },
        '경상남 김해시': { lat: 35.2285, lng: 128.8894 },
        '경상남 진주시': { lat: 35.1800, lng: 128.1076 },
        '경상남 양산시': { lat: 35.3350, lng: 129.0374 },
        // 제주
        '제주 제주시': { lat: 33.4996, lng: 126.5312 },
        '제주 서귀포시': { lat: 33.2541, lng: 126.5601 },
      }

      // 3. 지도 데이터 생성 (실제 좌표 우선 사용)
      const mapData: MapData[] = Array.from(regionDataMap.entries())
        .map(([region, data]) => {
          let lat: number
          let lng: number
          
          // 우선순위 1: 실제 데이터의 좌표 평균값 사용
          if (data.latitudes.length > 0 && data.longitudes.length > 0) {
            lat = data.latitudes.reduce((sum, v) => sum + v, 0) / data.latitudes.length
            lng = data.longitudes.reduce((sum, v) => sum + v, 0) / data.longitudes.length
          }
          // 우선순위 2: 하드코딩된 지역 좌표 사용
          else if (regionCoordinates[region]) {
            lat = regionCoordinates[region].lat
            lng = regionCoordinates[region].lng
          }
          // 우선순위 3: 서울 중심 기준 랜덤 (마지막 fallback)
          else {
            lat = 37.5665 + (Math.random() - 0.5) * 0.5
            lng = 126.9780 + (Math.random() - 0.5) * 0.5
          }
          
          return {
            latitude: lat,
            longitude: lng,
            value: data.count,
            h3Index: `h3_${region.replace(/\s/g, '_')}`,
            region,
            patientCount: data.count,
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
          const surgeryCount = rawData.filter((p) => p.surgery_code).length
          
          // 재방문율 계산: 이름+주소 조합으로 동일 환자 판별
          const patientKey = (p: PatientData) => `${p.name}|${p.address}`
          const patientVisitCounts: Record<string, number> = {}
          
          rawData.forEach((patient) => {
            const key = patientKey(patient)
            patientVisitCounts[key] = (patientVisitCounts[key] || 0) + 1
          })
          
          const uniquePatients = Object.keys(patientVisitCounts).length
          const returningPatients = Object.values(patientVisitCounts).filter(count => count > 1).length
          const calculatedRecurrenceRate = uniquePatients > 0 ? (returningPatients / uniquePatients) * 100 : 0
          
          // 총 환자수 = 고유 환자 수 (이름+주소 기준 중복 제거)
          const totalPatients = uniquePatients
          
          // 평균 재방문 간격 계산: 이름+주소 기준으로 환자별 방문 날짜 간격의 평균
          let totalIntervals = 0
          let intervalCount = 0
          
          Object.keys(patientVisitCounts).forEach((key) => {
            const patientVisits = rawData
              .filter(p => patientKey(p) === key)
              .map(p => new Date(p.visit_date).getTime())
              .sort((a, b) => a - b)
            
            // 방문이 2회 이상인 경우만 간격 계산
            if (patientVisits.length > 1) {
              for (let i = 1; i < patientVisits.length; i++) {
                const interval = (patientVisits[i] - patientVisits[i-1]) / (1000 * 60 * 60 * 24) // 일 단위
                totalIntervals += interval
                intervalCount++
              }
            }
          })
          
          const calculatedAvgInterval = intervalCount > 0 ? Math.round(totalIntervals / intervalCount) : 0

          set({
            diseases,
            mapData,
            agePyramid,
            totalPatients,
            recurrenceRate: calculatedRecurrenceRate,
            avgInterval: calculatedAvgInterval,
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
      {
        name: 'patient-data-storage', // localStorage key
        storage: createJSONStorage(() => localStorage),
        // 용량 큰 데이터는 압축하거나 중요한 필드만 저장
        partialize: (state) => ({
          rawData: state.rawData,
          isDataLoaded: state.isDataLoaded,
          diseases: state.diseases,
          mapData: state.mapData,
          agePyramid: state.agePyramid,
          totalPatients: state.totalPatients,
          recurrenceRate: state.recurrenceRate,
          avgInterval: state.avgInterval,
          totalSurgery: state.totalSurgery,
          // isLoading, error는 제외 (휘발성 데이터)
        }),
        // 데이터 복원 후 자동 처리하지 않음 (이미 처리된 상태)
        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log('✅ 저장된 데이터 복원 완료:', {
              환자수: state.rawData.length,
              질병수: state.diseases.length,
              지역수: state.mapData.length,
            })
          }
        },
      }
    ),
    { name: 'DataStore' }
  )
)

