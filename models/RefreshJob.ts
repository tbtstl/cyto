export interface RefreshJob {
  latestFetchedBlockHeight: number;
  jobRunning: boolean;
  jobStartedAt: number;
}
