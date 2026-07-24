import { useCitizen } from '../contexts/CitizenContext';

export function useLeaderboard() {
  const { leaderboard, fetchLeaderboard } = useCitizen();
  return { leaderboard, fetchLeaderboard };
}
