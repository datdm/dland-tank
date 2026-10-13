export interface PlayerRecordStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalKills: number;
  totalDeaths: number;
  totalScore: number;
  highestStreak: number;
  rankedMatches: number;
  rankedWins: number;
  casualMatches: number;
  casualWins: number;
  lastUpdated: number;
}

const STATS_KEY = 'tank_player_lifetime_stats';

export const getPlayerStats = (): PlayerRecordStats => {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalMatches: Number(parsed.totalMatches) || 0,
        totalWins: Number(parsed.totalWins) || 0,
        totalLosses: Number(parsed.totalLosses) || 0,
        totalKills: Number(parsed.totalKills) || 0,
        totalDeaths: Number(parsed.totalDeaths) || 0,
        totalScore: Number(parsed.totalScore) || 0,
        highestStreak: Number(parsed.highestStreak) || 0,
        rankedMatches: Number(parsed.rankedMatches) || 0,
        rankedWins: Number(parsed.rankedWins) || 0,
        casualMatches: Number(parsed.casualMatches) || 0,
        casualWins: Number(parsed.casualWins) || 0,
        lastUpdated: Number(parsed.lastUpdated) || Date.now(),
      };
    }
  } catch (err) {
    console.warn('Failed to parse player stats:', err);
  }

  return {
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalScore: 0,
    highestStreak: 0,
    rankedMatches: 0,
    rankedWins: 0,
    casualMatches: 0,
    casualWins: 0,
    lastUpdated: Date.now(),
  };
};

export const savePlayerStats = (stats: PlayerRecordStats): void => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Failed to save player stats:', err);
  }
};

export const recordMatchCompletion = (params: {
  isRanked: boolean;
  isWin: boolean;
  kills: number;
  deaths: number;
  score: number;
  streak: number;
}): PlayerRecordStats => {
  const current = getPlayerStats();
  const next: PlayerRecordStats = {
    totalMatches: current.totalMatches + 1,
    totalWins: current.totalWins + (params.isWin ? 1 : 0),
    totalLosses: current.totalLosses + (params.isWin ? 0 : 1),
    totalKills: current.totalKills + Math.max(0, params.kills),
    totalDeaths: current.totalDeaths + Math.max(0, params.deaths),
    totalScore: current.totalScore + Math.max(0, params.score),
    highestStreak: Math.max(current.highestStreak, params.streak),
    rankedMatches: current.rankedMatches + (params.isRanked ? 1 : 0),
    rankedWins: current.rankedWins + (params.isRanked && params.isWin ? 1 : 0),
    casualMatches: current.casualMatches + (!params.isRanked ? 1 : 0),
    casualWins: current.casualWins + (!params.isRanked && params.isWin ? 1 : 0),
    lastUpdated: Date.now(),
  };

  savePlayerStats(next);
  return next;
};
