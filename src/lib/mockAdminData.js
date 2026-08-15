/**
 * Mock Admin Data
 * For development and testing before Supabase integration
 */

import { calculateScore, calculateRankings } from "./rankingService";

export const generateMockTeams = (count = 15, totalFiles = 12) => {
  const batches = ["PGDM 1st Year", "PGDM 2nd Year", "PGPISM", "LLM"];
  const statuses = ["NOT_STARTED", "ACTIVE", "COMPLETED"];

  const teams = [];

  for (let i = 1; i <= count; i++) {
    const batch = batches[Math.floor(Math.random() * batches.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    let filesUnlocked, currentFile, attempts, tabSwitches, timeRemaining, completionTime;

    if (status === "NOT_STARTED") {
      filesUnlocked = 0;
      currentFile = 0;
      attempts = 0;
      tabSwitches = 0;
      timeRemaining = "120:00";
      completionTime = null;
    } else if (status === "COMPLETED") {
      filesUnlocked = totalFiles;
      currentFile = totalFiles;
      attempts = Math.floor(Math.random() * 10) + 5;
      tabSwitches = Math.floor(Math.random() * 3);
      timeRemaining = null;
      completionTime = `${Math.floor(Math.random() * 90) + 30}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`;
    } else {
      // ACTIVE
      filesUnlocked = Math.floor(Math.random() * (totalFiles - 1)) + 1;
      currentFile = filesUnlocked + 1;
      attempts = Math.floor(Math.random() * 15) + 3;
      tabSwitches = Math.floor(Math.random() * 5);
      const minutesUsed = Math.floor(Math.random() * 60) + 10;
      timeRemaining = `${120 - minutesUsed}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`;
      completionTime = null;
    }

    const lastUnlockedTime = (() => {
      if (filesUnlocked === 0) return null;
      const hours = 10;
      const minutes = Math.floor(Math.random() * 30);
      const seconds = Math.floor(Math.random() * 60);
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    })();

    const team = {
      team_id: `team-${i}`,
      team_name: `Team ${String.fromCharCode(64 + (i % 26))}${Math.floor(i / 26) + 1}`,
      batch,
      status,
      files_unlocked: filesUnlocked,
      current_file: currentFile,
      attempt_count: attempts,
      tab_switch_count: tabSwitches,
      time_remaining: timeRemaining,
      completion_time: completionTime,
      last_file_unlocked_at: lastUnlockedTime,
      start_time: "10:00:00",
      score: 0 // Will be calculated
    };

    // Calculate score
    team.score = calculateScore(team, totalFiles, 120 * 60);

    teams.push(team);
  }

  // Return ranked teams
  return calculateRankings(teams);
};

export const generateMockTeamDetails = (teamId, totalFiles = 12) => {
  const teams = generateMockTeams(1, totalFiles);
  const team = teams[0];

  // Add detailed file history
  team.file_history = [];
  for (let i = 1; i <= team.files_unlocked; i++) {
    const paddedFile = String(i).padStart(2, "0");
    team.file_history.push({
      file_number: i,
      display: `FILE ${paddedFile}`,
      unlocked_at: `10:0${i}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`,
      attempts_used: Math.floor(Math.random() * 3) + 1,
      question_id: `q-${i}`
    });
  }

  // Add activity timeline
  team.activity_timeline = [];

  // Start event
  team.activity_timeline.push({
    timestamp: "10:00:12",
    event_type: "COMPETITION_STARTED",
    event_label: "Competition started",
    metadata: {}
  });

  // File unlock and attempt events
  let currentTime = 300; // Start at 5 minutes
  for (let i = 0; i < team.files_unlocked; i++) {
    // Add some incorrect attempts
    const incorrectAttempts = Math.floor(Math.random() * 2);
    for (let j = 0; j < incorrectAttempts; j++) {
      currentTime += Math.floor(Math.random() * 60) + 10;
      team.activity_timeline.push({
        timestamp: formatSecondsToTime(currentTime),
        event_type: "INCORRECT_ANSWER",
        event_label: "Incorrect answer",
        metadata: { file_number: i + 1 }
      });
    }

    // Add file unlock
    currentTime += Math.floor(Math.random() * 60) + 30;
    team.activity_timeline.push({
      timestamp: formatSecondsToTime(currentTime),
      event_type: "FILE_COMPLETED",
      event_label: `FILE ${String(i + 1).padStart(2, "0")} unlocked`,
      metadata: { file_number: i + 1 }
    });

    // Occasional tab switch
    if (Math.random() > 0.7) {
      currentTime += Math.floor(Math.random() * 120);
      team.activity_timeline.push({
        timestamp: formatSecondsToTime(currentTime),
        event_type: "TAB_SWITCH_DETECTED",
        event_label: "Tab switch detected",
        metadata: {}
      });

      currentTime += Math.floor(Math.random() * 30);
      team.activity_timeline.push({
        timestamp: formatSecondsToTime(currentTime),
        event_type: "PARTICIPANT_RETURNED",
        event_label: "Participant returned",
        metadata: {}
      });
    }
  }

  return team;
};

const formatSecondsToTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${(10 + hours).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const getMockFilters = () => {
  return {
    batches: ["All", "PGDM 1st Year", "PGDM 2nd Year", "PGPISM", "LLM"],
    statuses: ["All", "NOT STARTED", "ACTIVE", "COMPLETED", "TIME EXPIRED", "DISQUALIFIED"],
    files: ["All", "FILE 01", "FILE 02", "FILE 03", "FILE 04", "FILE 05"]
  };
};
