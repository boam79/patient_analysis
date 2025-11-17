/**
 * 더미 데이터 생성 스크립트
 * 10,000개의 환자 데이터 생성
 */

import * as fs from 'fs'
import * as path from 'path'

// 더미 데이터 생성 설정
const NUM_RECORDS = 10000
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'dummy-data.csv')

// 질병과 연관된 수술 매핑
const DISEASE_SURGERY_MAP: Record<string, { code: string; name: string; surgeries: { code: string; name: string }[] }> = {
  '무릎관절증': {
    code: 'M179',
    name: '무릎관절증',
    surgeries: [
      { code: 'N0715', name: '슬관절 내시경하 수술' },
      { code: 'N0711', name: '인공관절 치환술' },
    ]
  },
  '척추관협착증': {
    code: 'M4806',
    name: '척추관협착증',
    surgeries: [
      { code: 'N2072', name: '척추 수술' },
      { code: 'N2073', name: '척추 감압술' },
    ]
  },
  '요통': {
    code: 'M545',
    name: '요통',
    surgeries: [
      { code: 'N2072', name: '척추 수술' },
    ]
  },
  '백내장': {
    code: 'H259',
    name: '노년백내장',
    surgeries: [
      { code: 'S5054', name: '백내장 적출술' },
    ]
  },
  '충수염': {
    code: 'K359',
    name: '급성 충수염',
    surgeries: [
      { code: 'Q2861', name: '맹장 절제술' },
    ]
  },
  '담석증': {
    code: 'K802',
    name: '담석증',
    surgeries: [
      { code: 'Q2634', name: '복강경하 담낭절제술' },
    ]
  },
  '탈장': {
    code: 'K409',
    name: '서혜 탈장',
    surgeries: [
      { code: 'N1466', name: '탈장 수술' },
    ]
  },
  '골절': {
    code: 'S729',
    name: '대퇴골 골절',
    surgeries: [
      { code: 'N0080', name: '골절 관혈적 정복술' },
    ]
  },
  '피부질환': {
    code: 'L989',
    name: '피부 질환',
    surgeries: [
      { code: 'N0060', name: '피부이식술' },
    ]
  },
  '본태성고혈압': {
    code: 'I10',
    name: '본태성 고혈압',
    surgeries: []  // 수술 없음
  },
  '제2형당뇨병': {
    code: 'E119',
    name: '제2형 당뇨병',
    surgeries: []  // 수술 없음
  },
  '급성상기도감염': {
    code: 'J069',
    name: '급성 상기도 감염',
    surgeries: []  // 수술 없음
  },
  '위염': {
    code: 'K297',
    name: '위염 및 십이지장염',
    surgeries: []  // 수술 없음
  },
  '관절통': {
    code: 'M255',
    name: '관절통',
    surgeries: []  // 수술 없음
  },
  '위식도역류': {
    code: 'K219',
    name: '위식도 역류질환',
    surgeries: []  // 수술 없음
  },
  '천식': {
    code: 'J459',
    name: '천식',
    surgeries: []  // 수술 없음
  },
  '골다공증': {
    code: 'M8198',
    name: '골다공증',
    surgeries: []  // 수술 없음
  },
  '뇌경색증': {
    code: 'I639',
    name: '뇌경색증',
    surgeries: []  // 수술 없음
  },
  '우울증': {
    code: 'F329',
    name: '우울 에피소드',
    surgeries: []  // 수술 없음
  },
}

// 전국 지역 주소 샘플 (17개 시도)
const ADDRESSES_BY_REGION: Record<string, string[]> = {
  '서울': [
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
    '서울특별시 강북구 도봉로',
    '서울특별시 동작구 사당로',
    '서울특별시 구로구 디지털로',
    '서울특별시 노원구 동일로',
    '서울특별시 양천구 목동서로',
  ],
  '경기': [
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
    '경기도 시흥시 시청로',
    '경기도 파주시 중앙로',
    '경기도 김포시 김포대로',
    '경기도 광명시 광명로',
    '경기도 하남시 미사대로',
  ],
  '인천': [
    '인천광역시 남동구 구월로',
    '인천광역시 연수구 송도과학로',
    '인천광역시 부평구 부평대로',
    '인천광역시 계양구 계산새로',
    '인천광역시 서구 석남로',
  ],
  '부산': [
    '부산광역시 해운대구 해운대로',
    '부산광역시 부산진구 중앙대로',
    '부산광역시 동래구 충렬대로',
    '부산광역시 남구 유엔평화로',
    '부산광역시 북구 낙동대로',
    '부산광역시 사상구 사상로',
  ],
  '대구': [
    '대구광역시 중구 동성로',
    '대구광역시 수성구 달구벌대로',
    '대구광역시 달서구 월배로',
    '대구광역시 북구 칠성동로',
    '대구광역시 동구 동대구로',
  ],
  '광주': [
    '광주광역시 서구 상무대로',
    '광주광역시 북구 용봉로',
    '광주광역시 남구 봉선로',
    '광주광역시 광산구 무진대로',
  ],
  '대전': [
    '대전광역시 유성구 대학로',
    '대전광역시 서구 둔산로',
    '대전광역시 중구 중앙로',
    '대전광역시 동구 대전로',
  ],
  '울산': [
    '울산광역시 남구 삼산로',
    '울산광역시 중구 태화로',
    '울산광역시 북구 산업로',
  ],
  '세종': [
    '세종특별자치시 한누리대로',
    '세종특별자치시 나성로',
    '세종특별자치시 새롬로',
  ],
  '강원': [
    '강원도 춘천시 중앙로',
    '강원도 원주시 서원대로',
    '강원도 강릉시 경강로',
    '강원도 동해시 중앙로',
    '강원도 속초시 중앙로',
  ],
  '충북': [
    '충청북도 청주시 상당구 상당로',
    '충청북도 청주시 흥덕구 직지대로',
    '충청북도 충주시 중앙로',
    '충청북도 제천시 의림대로',
  ],
  '충남': [
    '충청남도 천안시 동남구 만남로',
    '충청남도 아산시 번영로',
    '충청남도 서산시 중앙로',
    '충청남도 당진시 시청로',
  ],
  '전북': [
    '전라북도 전주시 완산구 효자로',
    '전라북도 익산시 중앙로',
    '전라북도 군산시 나운로',
    '전라북도 정읍시 수성로',
  ],
  '전남': [
    '전라남도 목포시 평화로',
    '전라남도 여수시 둔덕로',
    '전라남도 순천시 연향로',
    '전라남도 나주시 시청길',
  ],
  '경북': [
    '경상북도 포항시 남구 중앙로',
    '경상북도 구미시 인동중앙로',
    '경상북도 경주시 동천로',
    '경상북도 안동시 경동로',
  ],
  '경남': [
    '경상남도 창원시 성산구 중앙대로',
    '경상남도 김해시 김해대로',
    '경상남도 진주시 진주대로',
    '경상남도 양산시 중앙로',
  ],
  '제주': [
    '제주특별자치도 제주시 중앙로',
    '제주특별자치도 서귀포시 서귀중앙로',
    '제주특별자치도 제주시 이도이동',
  ],
}

// 이름 생성 (성 + 이름)
const LAST_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍']
const FIRST_NAMES_1 = ['민', '서', '지', '예', '하', '도', '은', '수', '현', '준', '정', '시', '우', '주', '연', '성', '재', '채', '태', '원']
const FIRST_NAMES_2 = ['준', '우', '윤', '진', '현', '호', '영', '서', '민', '빈', '수', '아', '연', '지', '혁', '성', '훈', '희', '경', '미']

// 유틸리티 함수
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = <T>(arr: T[]): T => arr[random(0, arr.length - 1)]
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

// 나이 생성 (20세 ~ 85세)
const generateAge = () => random(20, 85)

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

// 주소 생성 (지역 가중치 적용)
const generateAddress = () => {
  // 지역별 가중치 (인구 비율 반영)
  const regionWeights: Record<string, number> = {
    '서울': 25,
    '경기': 30,
    '인천': 8,
    '부산': 9,
    '대구': 6,
    '광주': 4,
    '대전': 4,
    '울산': 3,
    '세종': 1,
    '강원': 4,
    '충북': 3,
    '충남': 5,
    '전북': 4,
    '전남': 4,
    '경북': 6,
    '경남': 8,
    '제주': 1,
  }
  
  const regions = Object.keys(regionWeights)
  const totalWeight = Object.values(regionWeights).reduce((sum, w) => sum + w, 0)
  const rand = Math.random() * totalWeight
  
  let cumWeight = 0
  let selectedRegion = regions[0]
  
  for (const region of regions) {
    cumWeight += regionWeights[region]
    if (rand <= cumWeight) {
      selectedRegion = region
      break
    }
  }
  
  const addresses = ADDRESSES_BY_REGION[selectedRegion]
  const baseAddress = randomChoice(addresses)
  const detailNumber = random(1, 500)
  
  return `${baseAddress} ${detailNumber}`
}

// 질병 선택 및 연관 수술 결정
const selectDiseaseAndSurgery = () => {
  const diseaseKeys = Object.keys(DISEASE_SURGERY_MAP)
  const diseaseKey = randomChoice(diseaseKeys)
  const disease = DISEASE_SURGERY_MAP[diseaseKey]
  
  let surgery: { code: string; name: string } | null = null
  
  // 수술이 가능한 질병인 경우
  if (disease.surgeries.length > 0) {
    // 30% 확률로 수술 진행
    if (Math.random() < 0.3) {
      surgery = randomChoice(disease.surgeries)
    }
  }
  
  return { disease, surgery }
}

// 더미 데이터 생성
const generateDummyData = () => {
  console.log(`🔄 ${NUM_RECORDS}개의 더미 데이터 생성 중...`)
  
  const records: any[] = []
  const patients = new Map<string, { 
    name: string
    age: number
    gender: string
    address: string
    visitCount: number 
  }>()
  
  // 환자 정보 생성 (약 3,166명의 환자 - 실제 더미 데이터와 동일)
  const numPatients = 3166
  
  for (let i = 0; i < numPatients; i++) {
    const name = generateName()
    const address = generateAddress()
    const key = `${name}|${address}` // 이름+주소를 키로 사용
    
    patients.set(key, {
      name,
      age: generateAge(),
      gender: randomChoice(['M', 'F']),
      address,
      visitCount: 0,
    })
  }
  
  // 방문 레코드 생성
  const patientKeys = Array.from(patients.keys())
  let recordCount = 0
  
  while (recordCount < NUM_RECORDS) {
    const patientKey = randomChoice(patientKeys)
    const patient = patients.get(patientKey)!
    
    patient.visitCount++
    
    // 질병과 연관된 수술 선택
    const { disease, surgery } = selectDiseaseAndSurgery()
    
    const record = {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      address: patient.address,
      visit_date: generateVisitDate(),
      disease_code: disease.code,
      disease_name: disease.name,
      surgery_code: surgery?.code || '',
      surgery_name: surgery?.name || '',
    }
    
    records.push(record)
    recordCount++
    
    if (recordCount % 1000 === 0) {
      console.log(`  ✓ ${recordCount} / ${NUM_RECORDS} 레코드 생성 완료`)
    }
  }
  
  // 방문일자 기준 정렬
  records.sort((a, b) => a.visit_date.localeCompare(b.visit_date))
  
  // 통계 계산
  const surgeryCount = records.filter(r => r.surgery_name).length
  const regionCount = new Set(records.map(r => {
    const parts = r.address.split(' ')
    return parts[0].replace('특별시', '').replace('광역시', '').replace('도', '').replace('특별자치도', '').replace('특별자치시', '')
  })).size
  
  console.log(`✅ ${NUM_RECORDS}개 레코드 생성 완료!`)
  console.log(`📊 통계:`)
  console.log(`  - 총 환자 수 (이름+주소 기준): ${patients.size}명`)
  console.log(`  - 평균 방문 횟수: ${(NUM_RECORDS / patients.size).toFixed(1)}회`)
  console.log(`  - 질병 종류: ${Object.keys(DISEASE_SURGERY_MAP).length}개`)
  console.log(`  - 수술 포함 건수: ${surgeryCount}건 (${((surgeryCount / NUM_RECORDS) * 100).toFixed(1)}%)`)
  console.log(`  - 지역 분포: ${regionCount}개 시도`)
  
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
  console.log('📋 생성 옵션:')
  console.log('  - 환자ID, 방문ID, 진료비 제외')
  console.log('  - 전국 17개 시도 분포')
  console.log('  - 질병과 수술 연관성 반영\n')
  
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
