export interface Storage {
  hasMid(mid: string): Promise<boolean>
  storeMid(mid: string): Promise<void>
}

