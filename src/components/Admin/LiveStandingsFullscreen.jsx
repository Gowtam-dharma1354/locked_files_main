/**
 * Live Standings Fullscreen Component
 * Standalone view of live standings table with auto-refresh
 * Designed to be opened in a separate tab/window
 */

import React, { useState, useEffect } from "react";
import "./LiveStandingsFullscreen.css";
import LiveStandingsTable from "./AdminStandingsTable";
import ClubBrand from "../ClubBrand";
import { calculateRankings, calculateScore, formatTime } from "../../lib/rankingService";
import { COMPETITION_CONFIG } from "../../data/competitionConfig";
import { supabase } from "../../lib/supabaseClient";

export default function LiveStandingsFullscreen() {
  const [teams, setTeams] = useState([]);
  const totalFiles = COMPETITION_CONFIG.TOTAL_FILES || 12;

  // Load live team data from Supabase with auto-refresh
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const { data: teamRows, error: teamError } = await supabase
          .from("teams")
          .select("id, team_name, team_code, batch, status");

        if (teamError) throw teamError;

        const { data: sessionRows, error: sessionError } = await supabase
          .from("competition_sessions")
          .select(
            "team_id, status, current_level, score, started_at, expires_at, completed_at, failed_attempts_total, fullscreen_violations"
          );

        if (sessionError) throw sessionError;

        const { data: eventRows, error: eventError } = await supabase
          .from("competition_events")
          .select("team_id, metadata, created_at")
          .eq("event_type", "FILE_SOLVED");

        if (eventError) throw eventError;

        const latestSolveByTeam = new Map();
        (eventRows || []).forEach((event) => {
          const teamId = event.team_id;
          const solvedSeconds = Number(event.metadata?.latest_file_time_seconds ?? event.metadata?.solve_time_seconds ?? 0);
          const value = Number.isFinite(solvedSeconds) ? solvedSeconds : 0;
          const currentTime = new Date(event.created_at || 0).getTime();
          const existing = latestSolveByTeam.get(teamId);

          if (!existing || currentTime > new Date(existing.created_at || 0).getTime()) {
            latestSolveByTeam.set(teamId, { value, created_at: event.created_at });
          }
        });

        const sessionMap = new Map((sessionRows || []).map((session) => [session.team_id, session]));

        const liveTeams = (teamRows || []).map((team) => {
          const session = sessionMap.get(team.id);
          const sessionStatus = session?.status ?? "NOT_STARTED";
          const currentLevel = sessionStatus === "COMPLETED"
            ? totalFiles
            : session ? Number(session.current_level ?? 1) : 1;
          const filesUnlocked = sessionStatus === "COMPLETED" ? totalFiles : Math.max(0, currentLevel - 1);
          const latestSolveSeconds = latestSolveByTeam.get(team.id)?.value ?? null;

          return {
            ...team,
            team_id: team.id,
            score: calculateScore({ files_unlocked: filesUnlocked }),
            status: sessionStatus,
            current_file: currentLevel,
            files_unlocked: filesUnlocked,
            attempt_count: session ? Number(session.failed_attempts_total ?? 0) : 0,
            tab_switch_count: session ? Number(session.fullscreen_violations ?? 0) : 0,
            last_file_unlocked_at: session?.completed_at ?? session?.started_at ?? null,
            time_remaining: latestSolveSeconds != null && latestSolveSeconds > 0 ? formatTime(latestSolveSeconds) : null
          };
        });

        const rankedTeams = calculateRankings(liveTeams);
        setTeams(rankedTeams);
      } catch (err) {
        console.error("Failed to load teams from Supabase:", err);
      }
    };

    loadTeams();
    const interval = setInterval(loadTeams, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTeamClick = (teamId) => {
    // Can be extended for team details modal if needed
  };

  return (
    <div className="live-standings-fullscreen">
      {/* Header with Close Button */}
      <div className="fullscreen-header">
        <div className="fullscreen-brand-wrap">
          <ClubBrand className="fullscreen-brand" />
        </div>
        <div className="fullscreen-header-content">
          <h1>LIVE STANDINGS</h1>
        </div>
        <button 
          className="close-button"
          onClick={() => window.close()}
          title="Close this tab"
        >
          ✕
        </button>
      </div>

      {/* Live Standings Table */}
      <LiveStandingsTable
        teams={teams}
        totalFiles={totalFiles}
        onTeamClick={handleTeamClick}
      />
    </div>
  );
}
