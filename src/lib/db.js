const DB_NAME = 'random-selector-db'
const DB_VERSION = 1
const STORE_NAME = 'rosters'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore(mode, callback) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const result = callback(store)

    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

// "홍길동\n임꺽정\n장길산" -> ["홍길동", "임꺽정", "장길산"]
// ;와 ,도 함께 지원해서 세미콜론/콤마로 구분된 기존 명단이나 붙여넣기도 그대로 인식한다.
export function parseMembers(text) {
  return text
    .split(/[\n;,]/)
    .map((name) => name.trim())
    .filter(Boolean)
}

export async function getAllRosters() {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const rows = request.result.sort((a, b) => b.updatedAt - a.updatedAt)
      resolve(rows)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function saveRoster({ id, name, membersText }) {
  const now = Date.now()
  const record = {
    name: name.trim(),
    membersText,
    members: parseMembers(membersText),
    updatedAt: now,
  }

  let resultId = id
  await withStore('readwrite', (store) => {
    if (id) {
      store.get(id).onsuccess = (event) => {
        const existing = event.target.result
        store.put({ ...existing, ...record, id })
      }
    } else {
      record.createdAt = now
      store.add(record).onsuccess = (event) => {
        resultId = event.target.result
      }
    }
  })
  return resultId
}

export async function deleteRoster(id) {
  return withStore('readwrite', (store) => {
    store.delete(id)
  })
}
