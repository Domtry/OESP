import type { Storage } from './storage'

export interface SqlDriver {
  execute(sql: string, params?: any[]): Promise<void>
  queryOne(sql: string, params?: any[]): Promise<any | null>
}

export class StorageSQLite implements Storage {
  private driver: SqlDriver
  constructor(driver: SqlDriver) {
    this.driver = driver
  }
  async init(): Promise<void> {
    await this.driver.execute('CREATE TABLE IF NOT EXISTS processed_mid (mid TEXT PRIMARY KEY)')
  }
  async hasMid(mid: string): Promise<boolean> {
    const row = await this.driver.queryOne('SELECT mid FROM processed_mid WHERE mid = ?', [mid])
    return !!row
  }
  async storeMid(mid: string): Promise<void> {
    await this.driver.execute('INSERT OR IGNORE INTO processed_mid(mid) VALUES (?)', [mid])
  }
}

export class StorageMemory implements Storage {
  private set = new Set<string>()
  async hasMid(mid: string): Promise<boolean> { return this.set.has(mid) }
  async storeMid(mid: string): Promise<void> { this.set.add(mid) }
}

