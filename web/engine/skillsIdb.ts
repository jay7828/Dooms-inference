/** IndexedDB persistence for the browser skill library: one store, one record per (robot, skill). */
import type { Skill, SkillStorage } from './skills'

const DB = 'motion-dooms'
const STORE = 'skills'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'))
  })
}

const done = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })

interface Row {
  key: string
  robot: string
  skill: Skill
}

/** Skills of one arm live under their own key prefix, like the server's library-<robot> directories. */
export class IdbSkillStorage implements SkillStorage {
  constructor(private robot: string) {}

  async list(): Promise<Skill[]> {
    const db = await open()
    try {
      const rows = (await done(db.transaction(STORE).objectStore(STORE).getAll())) as Row[]
      return rows.filter((r) => r.robot === this.robot).map((r) => r.skill)
    } finally {
      db.close()
    }
  }

  async put(skill: Skill): Promise<void> {
    const db = await open()
    try {
      const row: Row = { key: `${this.robot}/${skill.name}`, robot: this.robot, skill }
      await done(db.transaction(STORE, 'readwrite').objectStore(STORE).put(row))
    } finally {
      db.close()
    }
  }

  async clear(): Promise<void> {
    const db = await open()
    try {
      const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
      const rows = (await done(store.getAll())) as Row[]
      await Promise.all(rows.filter((r) => r.robot === this.robot).map((r) => done(store.delete(r.key))))
    } finally {
      db.close()
    }
  }
}
