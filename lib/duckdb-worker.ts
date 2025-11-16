/**
 * DuckDB Web Worker
 * DuckDB WASM을 백그라운드에서 실행하여 메인 스레드 블로킹 방지
 */

import * as duckdb from '@duckdb/duckdb-wasm'

let db: duckdb.AsyncDuckDB | null = null
let conn: duckdb.AsyncDuckDBConnection | null = null

// Worker 메시지 타입
interface WorkerMessage {
  type: 'init' | 'query' | 'register' | 'close'
  payload?: any
}

interface WorkerResponse {
  type: 'success' | 'error'
  data?: any
  error?: string
}

// DuckDB 초기화
async function initializeDuckDB(): Promise<void> {
  if (db && conn) {
    console.log('[DuckDB Worker] Already initialized')
    return
  }

  try {
    const DUCKDB_BUNDLES: duckdb.DuckDBBundles = {
      mvp: {
        mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm', import.meta.url).href,
        mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', import.meta.url).href,
      },
      eh: {
        mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm', import.meta.url).href,
        mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).href,
      },
    }

    const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES)
    const worker = new Worker(bundle.mainWorker!)
    const logger = new duckdb.ConsoleLogger()
    
    db = new duckdb.AsyncDuckDB(logger, worker)
    await db.instantiate(bundle.mainModule)
    conn = await db.connect()
    
    console.log('[DuckDB Worker] Initialized successfully')
  } catch (error) {
    console.error('[DuckDB Worker] Initialization failed:', error)
    throw error
  }
}

// SQL 쿼리 실행
async function executeQuery(query: string): Promise<any[]> {
  if (!conn) {
    throw new Error('DuckDB connection not established')
  }

  try {
    const result = await conn.query(query)
    return result.toArray()
  } catch (error) {
    console.error('[DuckDB Worker] Query execution failed:', error)
    throw error
  }
}

// 데이터 테이블 등록
async function registerData(name: string, data: any[]): Promise<void> {
  if (!conn) {
    throw new Error('DuckDB connection not established')
  }

  try {
    // DuckDB에 JSON 데이터를 테이블로 등록
    const jsonString = JSON.stringify(data)
    await conn.query(`CREATE OR REPLACE TABLE ${name} AS SELECT * FROM read_json_auto('${jsonString}')`)
    console.log(`[DuckDB Worker] Table '${name}' registered with ${data.length} rows`)
  } catch (error) {
    console.error(`[DuckDB Worker] Failed to register table '${name}':`, error)
    throw error
  }
}

// Worker 메시지 핸들러
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data
  
  try {
    let response: WorkerResponse

    switch (type) {
      case 'init':
        await initializeDuckDB()
        response = { type: 'success', data: 'DuckDB initialized' }
        break

      case 'query':
        const queryResult = await executeQuery(payload.query)
        response = { type: 'success', data: queryResult }
        break

      case 'register':
        await registerData(payload.name, payload.data)
        response = { type: 'success', data: `Table '${payload.name}' registered` }
        break

      case 'close':
        if (conn) await conn.close()
        if (db) await db.terminate()
        conn = null
        db = null
        response = { type: 'success', data: 'DuckDB closed' }
        break

      default:
        response = { type: 'error', error: `Unknown message type: ${type}` }
    }

    self.postMessage(response)
  } catch (error: any) {
    self.postMessage({
      type: 'error',
      error: error.message || 'Unknown error occurred',
    })
  }
}

export {}

