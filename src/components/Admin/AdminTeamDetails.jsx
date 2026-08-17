/**
 * Team Details Component
 * Shows complete details of a single team including:
 * - Team metadata
 * - File progression history with timestamps
 * - Activity timeline
 */

import React, { useState, useEffect } from "react";
import "./AdminTeamDetails.css";
import { getCurrentFileDisplay, getFilesUnlockedDisplay, getStatusStyle } from "../../lib/rankingService";
import { COMPETITION_CONFIG } from "../../data/competitionConfig";
import { supabase } from "../../lib/supabaseClient";

export default function TeamDetails({ teamId, onClose }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalFiles = COMPETITION_CONFIG.TOTAL_FILES || 12;

  useEffect(() => {
    const loadTeamDetails = async () => {
      setLoading(true);

      try {
        const { data: teamRow, error: teamError } = await supabase
          .from("teams")
          .select("id, team_name, team_code, batch, status")
          .eq("id", teamId)
          .maybeSingle();

        if (teamError) throw teamError;

        const { data: sessionRows, error: sessionError } = await supabase
          .from("competition_sessions")
          .select(
            "team_id, status, current_level, score, started_at, expires_at, completed_at, failed_attempts_total, fullscreen_violations"
          )
          .eq("team_id", teamId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (sessionError) throw sessionError;

        const session = sessionRows?.[0] || {};
        const currentLevel = Number(session.current_level ?? 1);

        const liveTeam = {
          team_id: teamRow?.id ?? teamId,
          team_name: teamRow?.team_name ?? "Unknown Team",
          team_code: teamRow?.team_code ?? "—",
          batch: teamRow?.batch ?? "—",
          status: session.status ?? teamRow?.status ?? "NOT_STARTED",
          score: Number(session.score ?? 0),
          files_unlocked: currentLevel - 1,
          current_file: currentLevel,
          last_file_unlocked_at: session.completed_at ?? session.started_at ?? "—",
          start_time: session.started_at ?? "—",
          completion_time: session.completed_at ? new Date(session.completed_at).toLocaleTimeString() : null,
          time_remaining: session.expires_at ? new Date(session.expires_at).toLocaleTimeString() : null,
          attempt_count: Number(session.failed_attempts_total ?? 0),
          tab_switch_count: Number(session.fullscreen_violations ?? 0),
          file_history: [],
          activity_timeline: []
        };

        setTeam(liveTeam);
      } catch (err) {
        console.error("Failed to load team details from Supabase:", err);
        setTeam(null);
      } finally {
        setLoading(false);
      }
    };

    loadTeamDetails();
  }, [teamId, totalFiles]);

  if (loading) {
    return (
      <div className="team-details-container">
        <div className="loading-spinner"></div>
        <p>Loading team details...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-details-container">
        <p>Team not found</p>
      </div>
    );
  }

  const statusStyle = getStatusStyle(team.status);
  const filesDisplay = getFilesUnlockedDisplay(team, totalFiles);
  const currentFileDisplay = getCurrentFileDisplay(team, totalFiles);

  return (
    <div className="team-details-container">
      {/* Header with Back Button */}
      <div className="team-details-header">
        <button onClick={onClose} className="back-button" title="Back to standings">
          ← Back to Standings
        </button>
        <h1>{team.team_name}</h1>
      </div>

      {/* Team Metadata Section */}
      <div className="team-info-section">
        <div className="info-card">
          <div className="info-label">Team ID</div>
          <div className="info-value monospace">{team.team_id}</div>
        </div>

        <div className="info-card">
          <div className="info-label">Batch</div>
          <div className="info-value badge">{team.batch}</div>
        </div>

        <div className="info-card">
          <div className="info-label">Status</div>
          <div className="info-value">
            <span
              className="status-badge"
              style={{
                background: statusStyle.bg,
                color: statusStyle.color
              }}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-label">Score</div>
          <div className="info-value score">{team.score || 0}</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="progress-section">
        <div className="progress-card">
          <div className="progress-label">Files Unlocked</div>
          <div className="progress-value">{filesDisplay}</div>
        </div>

        <div className="progress-card">
          <div className="progress-label">Current File</div>
          <div className="progress-value current">{currentFileDisplay}</div>
        </div>

        <div className="progress-card">
          <div className="progress-label">Last File Unlocked</div>
          <div className="progress-value timestamp">{team.last_file_unlocked_at || "—"}</div>
        </div>

        <div className="progress-card">
          <div className="progress-label">Start Time</div>
          <div className="progress-value timestamp">{team.start_time || "—"}</div>
        </div>

        <div className="progress-card">
          <div className="progress-label">
            {team.status === "COMPLETED" ? "Completion Time" : "Time Remaining"}
          </div>
          <div className="progress-value timestamp">
            {team.completion_time || team.time_remaining || "—"}
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-label">Total Attempts</div>
          <div className="progress-value">{team.attempt_count || 0}</div>
        </div>

        <div className="progress-card">
          <div className="progress-label">Tab Switches</div>
          <div className="progress-value">{team.tab_switch_count || 0}</div>
        </div>
      </div>

      {/* File Progression */}
      <div className="file-progression-section">
        <h2>File Progression History</h2>
        <div className="file-list">
          {Array.from({ length: totalFiles }, (_, i) => {
            const fileNum = i + 1;
            const paddedFile = String(fileNum).padStart(2, "0");
            const fileDisplay = `FILE ${paddedFile}`;
            const fileHistory = team.file_history?.find((fh) => fh.file_number === fileNum);

            const isUnlocked = fileNum <= team.files_unlocked;
            const isCurrent = fileNum === team.current_file;

            return (
              <div key={fileNum} className={`file-item ${isUnlocked ? "unlocked" : "locked"} ${isCurrent ? "current" : ""}`}>
                <div className="file-indicator">
                  {isUnlocked ? "✓" : isCurrent ? "●" : "○"}
                </div>
                <div className="file-info">
                  <span className="file-name">{fileDisplay}</span>
                  {fileHistory && (
                    <div className="file-details">
                      <span className="unlock-time">Unlocked: {fileHistory.unlocked_at}</span>
                      <span className="attempts-used">Attempts: {fileHistory.attempts_used}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="activity-timeline-section">
        <h2>Activity Timeline</h2>
        <div className="timeline">
          {team.activity_timeline?.map((event, idx) => (
            <div key={idx} className={`timeline-item event-${event.event_type.toLowerCase()}`}>
              <div className="timeline-time">{event.timestamp}</div>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="event-label">{event.event_label}</div>
                {event.metadata?.file_number && (
                  <div className="event-meta">File: {String(event.metadata.file_number).padStart(2, "0")}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
