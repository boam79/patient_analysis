/**
 * 더미 데이터 생성 스크립트
 * 10,000개의 환자 데이터 생성
 */

import * as fs from 'fs'
import * as path from 'path'

// 더미 데이터 생성 설정
const NUM_RECORDS = 10000
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'dummy-data.csv')

// 질병 코드 및 이름 (ICD-10)
const DISEASES = [
  { code: 'M179', name: '무릎관절증' },
  { code: 'M4806', name: '척추관협착증' },
  { code: 'M545', name: '요통' },
  { code: 'I10', name: '본태성 고혈압' },
  { code: 'E119', name: '제2형 당뇨병' },
  { code: 'J069', name: '급성 상기도 감염' },
  { code: 'K297', name: '위염 및 십이지장염' },
  { code: 'M255', name: '관절통' },
  { code: 'H259', name: '노년백내장' },
  { code: 'K219', name: '위식도 역류질환' },
  { code: 'J459', name: '천식' },
  { code: 'M8198', name: '골다공증' },
  { code: 'K802', name: '담석증' },
  { code: 'I639', name: '뇌경색증' },
  { code: 'F329', name: '우울 에피소드' },
]

// 수술 코드 및 이름 (EDI)
const SURGERIES = [
  { code: 'N0715', name: '슬관절 내시경하 수술' },
  { code: 'N2072', name: '척추 수술' },
  { code: 'S5054', name: '백내장 적출술' },
  { code: 'Q2861', name: '맹장 절제술' },
  { code: 'Q2634', name: '복강경하 담낭절제술' },
  { code: 'N0711', name: '인공관절 치환술' },
  { code: 'N1466', name: '탈장 수술' },
  { code: 'N0080', name: '절개 및 배농술' },
  { code: 'S5671', name: '익상편 절제술' },
  { code: 'N0060', name: '피부이식술' },
]

// 서울/경기 지역 주소 샘플
const ADDRESSES = [
  '서울특별시 강남구 테헤란로',
  '서울특별시 종로구 세종대로',
  '서울특별시 서초구 반포대로',
  '서울특별시 송파구 올림픽로',
  '서울특별시 영등포구 여의대로',
  '서울특별시 마포구 월드컵로',
  '서울특별시 강동구 천호대로',
  '서울특별시 성북구 동소문로',
  '서울특별시 관악구 관악로',
  '서울특별시 은평구 통일로',
  '경기도 성남시 분당구 판교역로',
  '경기도 수원시 영통구 광교중앙로',
  '경기도 고양시 일산동구 중앙로',
  '경기도 용인시 수지구 포은대로',
  '경기도 화성시 동탄중앙로',
  '경기도 부천시 원미구 길주로',
  '경기도 안양시 동안구 평촌대로',
  '경기도 남양주시 다산중앙로',
  '경기도 의정부시 의정부중앙로',
  '경기도 평택시 평택로',
]

// 이름 생성 (성 + 이름)
const LAST_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍']
const FIRST_NAMES_1 = ['민', '서', '지', '예', '하', '도', '은', '수', '현', '준', '정', '시', '우', '주', '연', '성', '재', '채', '태', '원']
const FIRST_NAMES_2 = ['준', '우', '윤', '진', '현', '호', '영', '서', '민', '빈', '수', '아', '연', '지', '혁', '성', '훈', '희', '경', '미']

// 유틸리티 함수
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = <T>(arr: T[]): T => arr[random(0, arr.length - 1)]
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

// 생년월일 생성 (20세 ~ 85세)
const generateBirthDate = () => {
  const today = new Date()
  const age = random(20, 85)
  const year = today.getFullYear() - age
  const month = random(1, 12)
  const day = random(1, 28)
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
}

// 방문일자 생성 (최근 2년)
const generateVisitDate = () => {
  const end = new Date()
  const start = new Date()
  start.setFullYear(start.getFullYear() - 2)
  const date = randomDate(start, end)
  return date.toISOString().split('T')[0]
}

// 이름 생성
const generateName = () => {
  return `${randomChoice(LAST_NAMES)}${randomChoice(FIRST_NAMES_1)}${randomChoice(FIRST_NAMES_2)}`
}

// 주소 생성
const generateAddress = () => {
  const baseAddress = randomChoice(ADDRESSES)
  const detailNumber = random(1, 500)
  return `${baseAddress} ${detailNumber}`
}

// 환자 ID 생성
const generatePatientId = (index: number) => {
  return `P${String(index + 1).padStart(6, '0')}`
}

// 방문 ID 생성
const generateVisitId = (patientId: string, visitNum: number) => {
  return `${patientId}-V${String(visitNum).padStart(3, '0')}`
}

// 더미 데이터 생성
const generateDummyData = () => {
  console.log(`🔄 ${NUM_RECORDS}개의 더미 데이터 생성 중...`)
  
  const records: any[] = []
  const patients = new Map<string, { name: string; birthDate: string; gender: string; address: string; visitCount: number }>()
  
  // 환자 정보 생성 (약 3,000명의 환자)
  const numPatients = Math.floor(NUM_RECORDS / 3)
  for (let i = 0; i < numPatients; i++) {
    const patientId = generatePatientId(i)
    patients.set(patientId, {
      name: generateName(),
      birthDate: generateBirthDate(),
      gender: randomChoice(['M', 'F']),
      address: generateAddress(),
      visitCount: 0,
    })
  }
  
  // 방문 레코드 생성
  const patientIds = Array.from(patients.keys())
  let recordCount = 0
  
  while (recordCount < NUM_RECORDS) {
    const patientId = randomChoice(patientIds)
    const patient = patients.get(patientId)!
    
    patient.visitCount++
    
    const disease = randomChoice(DISEASES)
    const surgery = Math.random() > 0.7 ? randomChoice(SURGERIES) : null // 30% 확률로 수술
    
    const record = {
      환자ID: patientId,
      방문ID: generateVisitId(patientId, patient.visitCount),
      이름: patient.name,
      생년월일: patient.birthDate,
      성별: patient.gender,
      주소: patient.address,
      방문일자: generateVisitDate(),
      질병코드: disease.code,
      질병명: disease.name,
      수술코드: surgery?.code || '',
      수술명: surgery?.name || '',
      진료비: random(10000, 500000),
      입원일수: Math.random() > 0.8 ? random(1, 14) : 0, // 20% 확률로 입원
    }
    
    records.push(record)
    recordCount++
    
    if (recordCount % 1000 === 0) {
      console.log(`  ✓ ${recordCount} / ${NUM_RECORDS} 레코드 생성 완료`)
    }
  }
  
  // 방문일자 기준 정렬
  records.sort((a, b) => a.방문일자.localeCompare(b.방문일자))
  
  console.log(`✅ ${NUM_RECORDS}개 레코드 생성 완료!`)
  console.log(`📊 통계:`)
  console.log(`  - 총 환자 수: ${patients.size}명`)
  console.log(`  - 평균 방문 횟수: ${(NUM_RECORDS / patients.size).toFixed(1)}회`)
  console.log(`  - 질병 종류: ${DISEASES.length}개`)
  console.log(`  - 수술 종류: ${SURGERIES.length}개`)
  
  return records
}

// CSV 파일로 저장
const saveToCsv = (records: any[]) => {
  console.log(`\n💾 CSV 파일 저장 중: ${OUTPUT_FILE}`)
  
  // CSV 헤더
  const headers = Object.keys(records[0])
  const csvContent = [
    headers.join(','),
    ...records.map(record => 
      headers.map(header => {
        const value = record[header]
        // 쉼표나 줄바꿈이 있으면 큰따옴표로 감싸기
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          return `"${value}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  // public 디렉토리 확인 및 생성
  const publicDir = path.join(process.cwd(), 'public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  
  // UTF-8 BOM 추가 (Excel에서 한글 깨짐 방지)
  const BOM = '\uFEFF'
  fs.writeFileSync(OUTPUT_FILE, BOM + csvContent, 'utf-8')
  
  console.log(`✅ CSV 파일 저장 완료!`)
  console.log(`📄 파일 위치: ${OUTPUT_FILE}`)
  console.log(`📦 파일 크기: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`)
}

// 메인 실행
const main = () => {
  console.log('🚀 PDR Dashboard 더미 데이터 생성기\n')
  
  const startTime = Date.now()
  
  try {
    const records = generateDummyData()
    saveToCsv(records)
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    console.log(`\n⏱️  소요 시간: ${duration}초`)
    console.log(`\n🎉 완료! 이제 대시보드에서 파일을 업로드하세요.`)
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    process.exit(1)
  }
}

main()

