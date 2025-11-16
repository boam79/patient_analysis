const DB_NAME = 'PDR_Dashboard'
const DB_VERSION = 1
const STORES = {
  ICD_MAPPING: 'icd_mapping',
  EDI_MAPPING: 'edi_mapping',
  ADDRESS_CACHE: 'address_cache',
  DATASETS: 'datasets',
}

let db: IDBDatabase | null = null

export async function initIndexedDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event: any) => {
      const database = event.target.result as IDBDatabase

      // ICD-10 매핑 테이블
      if (!database.objectStoreNames.contains(STORES.ICD_MAPPING)) {
        const icdStore = database.createObjectStore(STORES.ICD_MAPPING, { keyPath: 'code' })
        icdStore.createIndex('name', 'name', { unique: false })
        icdStore.createIndex('category', 'category', { unique: false })
      }

      // EDI 수술 코드 매핑 테이블
      if (!database.objectStoreNames.contains(STORES.EDI_MAPPING)) {
        const ediStore = database.createObjectStore(STORES.EDI_MAPPING, { keyPath: 'code' })
        ediStore.createIndex('name', 'name', { unique: false })
        ediStore.createIndex('category', 'category', { unique: false })
      }

      // 주소 지오코딩 캐시
      if (!database.objectStoreNames.contains(STORES.ADDRESS_CACHE)) {
        const addressStore = database.createObjectStore(STORES.ADDRESS_CACHE, { keyPath: 'address' })
        addressStore.createIndex('h3Index', 'h3Index', { unique: false })
        addressStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // 데이터셋 메타데이터
      if (!database.objectStoreNames.contains(STORES.DATASETS)) {
        const datasetStore = database.createObjectStore(STORES.DATASETS, { keyPath: 'id', autoIncrement: true })
        datasetStore.createIndex('name', 'name', { unique: false })
        datasetStore.createIndex('uploadedAt', 'uploadedAt', { unique: false })
      }
    }
  })
}

export async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    return await initIndexedDB()
  }
  return db
}

// ICD-10 코드 매핑 조회
export async function getICDMapping(code: string): Promise<any> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.ICD_MAPPING], 'readonly')
    const store = transaction.objectStore(STORES.ICD_MAPPING)
    const request = store.get(code)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ICD-10 코드 매핑 저장
export async function saveICDMapping(data: { code: string; name: string; category: string }) {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.ICD_MAPPING], 'readwrite')
    const store = transaction.objectStore(STORES.ICD_MAPPING)
    const request = store.put(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// EDI 수술 코드 매핑 조회
export async function getEDIMapping(code: string): Promise<any> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.EDI_MAPPING], 'readonly')
    const store = transaction.objectStore(STORES.EDI_MAPPING)
    const request = store.get(code)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// EDI 수술 코드 매핑 저장
export async function saveEDIMapping(data: { code: string; name: string; category: string }) {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.EDI_MAPPING], 'readwrite')
    const store = transaction.objectStore(STORES.EDI_MAPPING)
    const request = store.put(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 주소 캐시 조회
export async function getAddressCache(address: string): Promise<any> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.ADDRESS_CACHE], 'readonly')
    const store = transaction.objectStore(STORES.ADDRESS_CACHE)
    const request = store.get(address)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 주소 캐시 저장
export async function saveAddressCache(data: {
  address: string
  latitude: number
  longitude: number
  h3Index: string
  timestamp: number
}) {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.ADDRESS_CACHE], 'readwrite')
    const store = transaction.objectStore(STORES.ADDRESS_CACHE)
    const request = store.put(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 데이터셋 메타데이터 저장
export async function saveDataset(data: {
  name: string
  rowCount: number
  columnCount: number
  uploadedAt: number
}) {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.DATASETS], 'readwrite')
    const store = transaction.objectStore(STORES.DATASETS)
    const request = store.add(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 모든 데이터셋 조회
export async function getAllDatasets(): Promise<any[]> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.DATASETS], 'readonly')
    const store = transaction.objectStore(STORES.DATASETS)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// IndexedDB 초기화 (개발용)
export async function clearAllData() {
  const database = await getDB()
  const stores = Object.values(STORES)

  for (const storeName of stores) {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  console.log('All IndexedDB data cleared')
}

