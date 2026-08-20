/**
 * Ranking Service
 * Centralized ranking calculation for the competition.
 * 
 * Ranking priority:
 * 1. Files unlocked (descending)
 * 2. Score (descending)
 * 3. Elapsed time (ascending)
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
    // Primary: Files unlocked (descending)
    if (b.files_unlocked !== a.files_unlocked) {
      return b.files_unlocked - a.files_unlocked;
    }

    // Secondary: Score (descending)
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Tertiary: Elapsed time (ascending - faster is better)
    const aTime = a.time_remaining || a.completion_time
      ? parseTimeToSeconds(a.time_remaining || a.completion_time)
      : Number.POSITIVE_INFINITY;
    const bTime = b.time_remaining || b.completion_time
      ? parseTimeToSeconds(b.time_remaining || b.completion_time)
      : Number.POSITIVE_INFINITY;
    if (aTime !== bTime) {
      return aTime - bTime;
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
 * Return the points awarded for a solved file.
 */
export const getFileScore = (fileNumber) => {
  const normalizedFileNumber = Number(fileNumber);
  if (normalizedFileNumber >= 1 && normalizedFileNumber <= 4) return 5;
  if (normalizedFileNumber >= 5 && normalizedFileNumber <= 11) return 10;
  if (normalizedFileNumber >= 12 && normalizedFileNumber <= 15) return 15;
  return 0;
};

export const calculateScore = (team) => {
  const filesUnlocked = Math.max(0, Number(team.files_unlocked) || 0);
  let score = 0;
  for (let fileNumber = 1; fileNumber <= filesUnlocked; fileNumber += 1) {
    score += getFileScore(fileNumber);
  }
  return score;
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
  const unlocked = team.status === "COMPLETED" ? totalFiles : team.files_unlocked || 0;
  return `${unlocked} / ${totalFiles}`;
};
