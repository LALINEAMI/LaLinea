// LALINEA_LEADERBOARD_V1
export type LeaderboardEntry = { position: number; alias: string; highestLevel: number; completedLevels: number; totalCoins: number };
export type LeaderboardResponse = { totalPlayers: number; entries: LeaderboardEntry[]; authenticated: boolean; viewer: { alias: string; result: LeaderboardEntry | null } | null; updatedAt: string; rules: string };
export function publicAlias(customerId: string, secret: string): string;
export function projectLeaderboard(data: unknown, options: { secret: string; viewerId?: string | null; updatedAt?: string }): LeaderboardResponse;
