import type { ReplayStore } from '@oesp/sdk';

export class MemoryReplayStore implements ReplayStore {
  private seenSet = new Set<string>();
  async seen(fromDid: string, mid: string): Promise<boolean> {
    return this.seenSet.has(`${fromDid}:${mid}`);
  }
  async markSeen(fromDid: string, mid: string): Promise<void> {
    this.seenSet.add(`${fromDid}:${mid}`);
  }
}
