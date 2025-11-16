import * as duckdb from '@duckdb/duckdb-wasm'

let db: duckdb.AsyncDuckDB | null = null
let conn: duckdb.AsyncDuckDBConnection | null = null

export async function initDuckDB() {
  if (db) return { db, conn }

  try {
    // CDN에서 DuckDB WASM 파일 로드
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()

    // 브라우저에서 사용할 번들 선택
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    )

    const worker = new Worker(worker_url)
    const logger = new duckdb.ConsoleLogger()

    db = new duckdb.AsyncDuckDB(logger, worker)
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    URL.revokeObjectURL(worker_url)

    // 연결 생성
    conn = await db.connect()

    console.log('DuckDB initialized successfully')
    return { db, conn }
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error)
    throw error
  }
}

export async function getDuckDB() {
  if (!db || !conn) {
    return await initDuckDB()
  }
  return { db, conn }
}

export async function queryDuckDB(sql: string): Promise<any[]> {
  try {
    const { conn } = await getDuckDB()
    if (!conn) throw new Error('DuckDB not initialized')

    const result = await conn.query(sql)
    return result.toArray().map((row: any) => row.toJSON())
  } catch (error) {
    console.error('DuckDB query error:', error)
    throw error
  }
}

export async function insertData(tableName: string, data: any[]) {
  try {
    const { conn } = await getDuckDB()
    if (!conn) throw new Error('DuckDB not initialized')

    // 테이블 삭제 (존재하는 경우)
    await conn.query(`DROP TABLE IF EXISTS ${tableName}`)

    // Arrow 테이블로 변환하여 삽입
    await conn.insertArrowTable(
      await convertToArrowTable(data),
      { name: tableName }
    )

    console.log(`Inserted ${data.length} rows into ${tableName}`)
  } catch (error) {
    console.error('Failed to insert data:', error)
    throw error
  }
}

async function convertToArrowTable(data: any[]): Promise<any> {
  // Apache Arrow 테이블로 변환
  // 간단한 구현: DuckDB가 자동으로 처리하도록 JSON 형식 사용
  const { conn } = await getDuckDB()
  if (!conn) throw new Error('DuckDB not initialized')

  // 임시 테이블 생성
  const tempTableName = `temp_${Date.now()}`
  const jsonStr = JSON.stringify(data)
  
  await conn.query(`
    CREATE TABLE ${tempTableName} AS 
    SELECT * FROM read_json_auto('${jsonStr}')
  `)

  const result = await conn.query(`SELECT * FROM ${tempTableName}`)
  await conn.query(`DROP TABLE ${tempTableName}`)

  return result
}

export async function closeDuckDB() {
  try {
    if (conn) {
      await conn.close()
      conn = null
    }
    if (db) {
      await db.terminate()
      db = null
    }
    console.log('DuckDB closed')
  } catch (error) {
    console.error('Error closing DuckDB:', error)
  }
}

