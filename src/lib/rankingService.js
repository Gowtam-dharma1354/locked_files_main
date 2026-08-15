/**
 * Ranking Service
 * Centralized ranking calculation for the competition.
 * 
 * The final scoring formula is NOT YET FINALIZED.
 * This service is structured to accept various ranking criteria.
 * 
 * Future customization points:
 * - score weight
 * - files_unlocked weight
 * - completion_time weight
 * - attempts penalty
 * - other event-defined criteria
 */

/**
 * Calculate rankings for all teams
 * @param {Array} teams - Array of team objects
 * @param {Object} config - Configuration for ranking (future use)
 * @returns {Array} Teams sorted by ranking with rank numbers
 */
export const calculateRankings = (teams, config = {}) => {
  // Create a working copy
  const teamsWithRank = teams.map((team, idx) => ({
    ...team,
    rank: idx + 1
  }));

  // Sort by ranking criteria
  // TODO: These criteria can be customized via config
  teamsWithRank.sort((a, b) => {
    // Primary: Score (descending - higher is better)
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Secondary: Files unlocked (descending)
    if (b.files_unlocked !== a.files_unlocked) {
      return b.files_unlocked - a.files_unlocked;
    }

    // Tertiary: Completion time (ascending - faster is better)
    // Only applies to completed teams
    if (a.status === "COMPLETED" && b.status === "COMPLETED") {
      const aTime = parseTimeToSeconds(a.time_remaining || "0:00");
      const bTime = parseTimeToSeconds(b.time_remaining || "0:00");
      if (aTime !== bTime) {
        return aTime - bTime;
      }
    }

    // Quaternary: Fewest attempts (ascending)
    if (b.attempt_count !== a.attempt_count) {
      return a.attempt_count - b.attempt_count;
    }

    // Fallback: By team ID or name (consistent ordering)
    return (a.team_name || "").localeCompare(b.team_name || "");
  });

  // Reassign rank numbers after sorting
  return teamsWithRank.map((team, idx) => ({
    ...team,
    rank: idx + 1
  }));
};

/**
 * Get rank for a specific team
 * @param {Object} team - Team object
 * @param {Array} allTeams - All teams for ranking context
 * @returns {number} Team's current rank
 */
export const getTeamRank = (team, allTeams = []) => {
  const ranked = calculateRankings(allTeams);
  const found = ranked.find(t => t.team_id === team.team_id);
  return found ? found.rank : allTeams.length;
};

/**
 * Helper: Parse time string MM:SS to seconds
 */
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const minutes = parseInt(parts[0]) || 0;
  const seconds = parseInt(parts[1]) || 0;
  return minutes * 60 + seconds;
};

/**
 * Helper: Format seconds to MM:SS
 */
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Calculate score for a team (MOCK - can be customized)
 * TODO: Replace with actual scoring logic once finalized
 * 
 * Current mock logic:
 * - Base: files_unlocked * 100
 * - Bonus for completion: +500
 * - Penalty for attempts: -5 per attempt (capped)
 * - Bonus for speed: based on time remaining
 */
export const calculateScore = (team, totalFiles = 12, totalTimeSeconds = 7200) => {
  let score = 0;

  // Base score: 100 points per file
  score += (team.files_unlocked || 0) * 100;

  // Completion bonus
  if (team.status === "COMPLETED") {
    score += 500;
  }

  // Attempt penalty (light - max -100)
  const attemptPenalty = Math.min(100, (team.attempt_count || 0) * 5);
  score -= attemptPenalty;

  // Speed bonus (if not completed, based on time remaining)
  // If completed, use completion time
  if (team.status === "COMPLETED" && team.completion_time) {
    const completionSeconds = parseTimeToSeconds(team.completion_time);
    const speedBonus = Math.max(0, Math.floor((totalTimeSeconds - completionSeconds) / 10));
    score += Math.min(300, speedBonus);
  }

  return Math.max(0, Math.floor(score));
};

/**
 * Get status badge style/color
 */
export const getStatusStyle = (status) => {
  const styles = {
    NOT_STARTED: { bg: "#E5E7EB", color: "#6B7280", label: "NOT STARTED" },
    ACTIVE: { bg: "#DBEAFE", color: "#1E40AF", label: "ACTIVE" },
    COMPLETED: { bg: "#D1FAE5", color: "#065F46", label: "COMPLETED" },
    TIME_EXPIRED: { bg: "#FED7AA", color: "#92400E", label: "TIME EXPIRED" },
    DISQUALIFIED: { bg: "#FECACA", color: "#991B1B", label: "DISQUALIFIED" }
  };
  return styles[status] || styles.NOT_STARTED;
};

/**
 * Get tab switch warning level
 */
export const getTabSwitchLevel = (tabSwitches) => {
  if (tabSwitches === 0) return "normal";
  if (tabSwitches <= 2) return "warning";
  return "strong-warning";
};

/**
 * Calculate current file display
 */
export const getCurrentFileDisplay = (team, totalFiles) => {
  if (team.status === "COMPLETED") {
    return "COMPLETED";
  }
  if (team.current_file && team.current_file > 0) {
    const paddedFile = String(team.current_file).padStart(2, "0");
    return `FILE ${paddedFile}`;
  }
  return "FILE 01";
};

/**
 * Calculate files unlocked display
 */
export const getFilesUnlockedDisplay = (team, totalFiles) => {
  const unlocked = team.files_unlocked || 0;
  return `${unlocked} / ${totalFiles}`;
};
