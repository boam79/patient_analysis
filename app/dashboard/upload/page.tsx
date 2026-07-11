'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUpload } from '@/components/upload/file-upload'
import { Button } from '@/components/ui/button'
import { useDataStore, PatientData } from '@/stores/data-store'
import { useFilterStore } from '@/stores/filter-store'
import { CheckCircle2, Database, TrendingUp, MapPin } from 'lucide-react'
import { geocodeBatch } from '@/lib/geocoding-batch'

export default function UploadPage() {
  const router = useRouter()
  const { setRawData, processData, setLoading, isDataLoaded, totalPatients, resetData } = useDataStore()
  const { resetFilters, setDateRange } = useFilterStore()
  
  const [uploadedData, setUploadedData] = useState<any[] | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [useGeocoding, setUseGeocoding] = useState(false)
  const [geocodingProgress, setGeocodingProgress] = useState<{ completed: number; total: number } | null>(null)

  const handleClearData = () => {
    if (confirm('저장된 데이터를 삭제하시겠습니까?')) {
      resetData()
      setUploadedData(null)
      setFileName('')
      setSuccess(false)
    }
  }

  const handleDataLoaded = async (data: any[], name: string) => {
    setUploadedData(data)
    setFileName(name)
    setSuccess(false)
  }

  const handleProcess = async () => {
    if (!uploadedData) return

    setProcessing(true)
    setLoading(true)

    try {
      // 새 데이터 업로드 시 기존 캐시 초기화
      resetData()
      resetFilters()
      
      // 데이터 변환 (CSV 컬럼명 → PatientData 형식)
      const patientData: PatientData[] = uploadedData.map((row: any) => {
        // 나이 계산 (생년월일 또는 나이 컬럼 사용)
        let age = 0
        if (row.age || row['나이']) {
          age = Number(row.age || row['나이'])
        } else if (row.birth_date || row['생년월일']) {
          const birthDateStr = (row.birth_date || row['생년월일']).toString()
          // YYYYMMDD 형식 파싱
          if (birthDateStr.length === 8) {
            const birthYear = parseInt(birthDateStr.substring(0, 4))
            age = new Date().getFullYear() - birthYear
          } else {
            // YYYY-MM-DD 형식
            const birthYear = new Date(birthDateStr).getFullYear()
            age = new Date().getFullYear() - birthYear
          }
        }

        // 성별 정규화 (data-store.ts와 동일한 로직 사용)
        const genderRaw = (row.gender || row['성별'] || '').toString().trim()
        let gender = '알 수 없음'
        if (genderRaw === 'M' || genderRaw === '남' || genderRaw === '남성' || genderRaw === '1') {
          gender = '남성'
        } else if (genderRaw === 'F' || genderRaw === '여' || genderRaw === '여성' || genderRaw === '2') {
          gender = '여성'
        }

        // 주소에서 지역 추출 (BOM 문자 처리)
        const address = (row.address || row['주소'] || '').toString().trim()
        let region = (row.region || row['지역'] || '').toString().trim()
        
        if (!region && address) {
          // "서울특별시 종로구 세종대로" → "서울 종로구"
          // "경기도 수원시 영통구" → "경기 수원시"
          // "세종특별자치시 한누리대로" → "세종 세종시"
          const addressParts = address.split(' ')
          if (addressParts.length >= 2) {
            const sido = addressParts[0]
              .replace('특별시', '')
              .replace('광역시', '')
              .replace('특별자치시', '')
              .replace('특별자치도', '')
              .replace('도', '')
            const sigungu = addressParts[1]
            
            // 세종시 특별 처리
            if (sido === '세종') {
              region = '세종 세종시'
            } else {
              region = `${sido} ${sigungu}`
            }
          } else {
            region = addressParts[0] || '미분류'
          }
        }

        // patient_id 생성: CSV에 patient_id가 있으면 사용, 없으면 이름+주소 기반으로 생성
        // 같은 환자(이름+주소 동일)는 같은 patient_id를 가지도록 함
        // BOM 문자가 포함된 경우를 처리 ('\ufeffname' 지원)
        const name = (row.name || row['\ufeffname'] || row['이름'] || '미상').toString().trim()
        let patientId: string
        
        if (row.patient_id || row['환자ID'] || row.id) {
          // CSV에 patient_id가 있으면 사용
          patientId = (row.patient_id || row['환자ID'] || row.id).toString()
        } else {
          // 이름+주소 기반으로 patient_id 생성 (같은 환자는 같은 ID)
          // 간단한 해시 함수 사용 (문자열을 숫자로 변환)
          const patientKey = `${name}|${address}`
          let hash = 0
          for (let i = 0; i < patientKey.length; i++) {
            const char = patientKey.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32bit integer
          }
          patientId = `patient_${Math.abs(hash)}`
        }

        return {
          patient_id: patientId,
          name,
          visit_date: row.visit_date || row['방문일자'] || new Date().toISOString().split('T')[0],
          age,
          gender,
          disease_code: row.disease_code || row['질병코드'] || '',
          disease_name: row.disease_name || row['질병명'] || '미분류 질병',
          surgery_code: row.surgery_code || row['수술코드'] || undefined,
          surgery_name: row.surgery_name || row['수술명'] || undefined,
          address,
          region,
          latitude: row.latitude ? Number(row.latitude) : undefined,
          longitude: row.longitude ? Number(row.longitude) : undefined,
          h3_index: row.h3_index || row.h3Index || undefined,
        }
      })

      // 업로드된 데이터의 기간에 맞춰 기본 날짜 필터를 자동으로 설정
      if (patientData.length > 0) {
        let minDate = patientData[0].visit_date
        let maxDate = patientData[0].visit_date
        for (const p of patientData) {
          if (p.visit_date < minDate) minDate = p.visit_date
          if (p.visit_date > maxDate) maxDate = p.visit_date
        }
        setDateRange(minDate, maxDate)
      }

      // 실주소 정밀 지오코딩 (선택 사항)
      // CSV에 좌표가 없고 주소만 있는 레코드를 대상으로 Nominatim API를 통해
      // 위도/경도/H3 인덱스를 조회. 결과는 IndexedDB에 캐싱되어 재업로드 시 재사용됨.
      if (useGeocoding) {
        const addressesToGeocode = Array.from(
          new Set(
            patientData
              .filter((p) => !p.latitude && !p.longitude && p.address)
              .map((p) => p.address)
          )
        )

        if (addressesToGeocode.length > 0) {
          setGeocodingProgress({ completed: 0, total: addressesToGeocode.length })

          const geocodeResults = await geocodeBatch(addressesToGeocode, {
            onProgress: (completed, total) => setGeocodingProgress({ completed, total }),
          })

          const geocodeMap = new Map(
            geocodeResults
              .filter((r) => r.latitude !== null && r.longitude !== null && r.h3Index !== null)
              .map((r) => [r.address, r])
          )

          patientData.forEach((p) => {
            const geocoded = geocodeMap.get(p.address)
            if (geocoded) {
              p.latitude = geocoded.latitude!
              p.longitude = geocoded.longitude!
              p.h3_index = geocoded.h3Index!
            }
          })

          setGeocodingProgress(null)
        }
      }

      // Store에 데이터 저장
      setRawData(patientData)
      
      // 데이터 처리 (통계 계산)
      // 실제 데이터 처리가 누락되지 않도록 즉시 실행
      await processData()

      setSuccess(true)
      // 메모리 사용량을 줄이기 위해 업로드 원본 데이터는 해제
      setUploadedData(null)
      setLoading(false)
      
      // 2초 후 대시보드로 자동 이동
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Processing error:', error)
      alert(`데이터 처리 중 오류가 발생했습니다: ${error.message}`)
      setLoading(false)
    } finally {
      setProcessing(false)
    }
  }

  const step = success ? 3 : uploadedData ? 2 : 1

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-ink mb-2">
            데이터 업로드
          </h1>
          <p className="text-muted-foreground">
            파일을 올리면 브라우저에서 바로 전처리합니다
          </p>
        </div>
        {isDataLoaded && (
          <Button variant="outline" onClick={handleClearData}>
            <Database className="mr-2 h-4 w-4" />
            저장된 데이터 삭제
          </Button>
        )}
      </div>

      <ol className="flex items-center gap-2 text-sm">
        {[
          { n: 1, label: '파일 선택' },
          { n: 2, label: '처리' },
          { n: 3, label: '완료' },
        ].map((s, i) => (
          <li key={s.n} className="flex items-center gap-2">
            {i > 0 && <span className="mx-1 h-px w-6 bg-border" />}
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                step >= s.n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.n}
            </span>
            <span className={step >= s.n ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      {isDataLoaded && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-primary">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">
              저장된 데이터: {totalPatients.toLocaleString()}명
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              새 파일을 업로드하면 기존 데이터를 덮어씁니다
            </p>
          </div>
        </div>
      )}

      <FileUpload onDataLoaded={handleDataLoaded} />

      {uploadedData && (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">총 레코드</p>
              <p className="font-numeric text-2xl font-bold tabular-nums">
                {uploadedData.length.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="h-5 w-5 text-positive shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">파일명</p>
              <p className="truncate text-sm font-semibold">{fileName}</p>
            </div>
          </div>
        </div>
      )}

      {uploadedData && !success && (
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={useGeocoding}
            onChange={(e) => setUseGeocoding(e.target.checked)}
            disabled={processing}
            className="mt-1 h-4 w-4 rounded border-muted-foreground/50 accent-primary"
          />
          <span className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="block font-medium">실주소 정밀 지오코딩 (선택)</span>
              <span className="text-xs text-muted-foreground">
                좌표 없는 주소만 Nominatim으로 조회합니다. 고유 주소당 약 1초,
                결과는 브라우저에 캐시됩니다. 미선택 시 시·군·구 대표 좌표를 씁니다.
              </span>
            </span>
          </span>
        </label>
      )}

      {geocodingProgress && (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4" />
            지오코딩 중… ({geocodingProgress.completed.toLocaleString()} /{' '}
            {geocodingProgress.total.toLocaleString()})
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${
                  geocodingProgress.total > 0
                    ? (geocodingProgress.completed / geocodingProgress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {uploadedData && !success && (
        <div className="flex justify-end">
          <Button onClick={handleProcess} disabled={processing} size="lg">
            {processing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {geocodingProgress ? '지오코딩 중...' : '처리 중...'}
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                분석 시작
              </>
            )}
          </Button>
        </div>
      )}

      {success && (
        <div className="animate-fade-up rounded-xl border border-positive/40 bg-positive/5 px-5 py-5">
          <div className="flex items-center gap-2 text-positive">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">데이터 처리가 완료되었습니다</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            대시보드로 이동합니다…
          </p>
          <div className="mt-4">
            <Button asChild>
              <a href="/dashboard">대시보드로 이동</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

