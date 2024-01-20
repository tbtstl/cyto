export enum ActivityType {
  JOIN_TEAM = "JOIN_TEAM",
  CELLS_PLACED = "CELLS_PLACED",
  ROUND_END = "ROUND_END",
  GAME_END = "GAME_END",
}

export interface ActivityItem {
  _id: string;
  activityType: ActivityType;
  createdAt: number;
}

export interface JoinTeamActivityItem extends ActivityItem {
  activityType: ActivityType.JOIN_TEAM;
  team: "blue" | "red";
  playerAddress: `0x${string}`;
  playerEns: string;
}

export interface CellsPlacedActivityItem extends ActivityItem {
  activityType: ActivityType.CELLS_PLACED;
  playerAddress: `0x${string}`;
  playerEns: string;
  team: "blue" | "red";
  cells: number[][];
}

export interface RoundEndActivityItem extends ActivityItem {
  activityType: ActivityType.ROUND_END;
}

export interface GameEndActivityItem extends ActivityItem {
  activityType: ActivityType.GAME_END;
  blueScore: number;
  redScore: number;
  prizePoolWei: string;
}
