/**
 * Admin Dashboard Component
 * Main admin interface with live standings table
 */

import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import AdminFilterBar from "./AdminFilterBar";
import LiveStandingsTable from "./AdminStandingsTable";
import { calculateRankings, calculateScore, formatTime } from "../../lib/rankingService";
import { COMPETITION_CONFIG } from "../../data/competitionConfig";
import { supabase } from "../../lib/supabaseClient";

export default function AdminDashboard({ onTeamClick }) {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [filters, setFilters] = useState({
    searchTeam: "",
    batch: "All",
    status: "All",
    file: "All"
  });

  const totalFiles = COMPETITION_CONFIG.TOTAL_FILES || 12;

  const handleOpenLiveStandingsTab = () => {
    window.open("/live-standings", "LiveStandings", "width=1400,height=800");
  };

  // Load live team data from Supabase
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
          // If no session, team hasn't started. If session exists, use session data
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
        setFilteredTeams(rankedTeams);
      } catch (err) {
        console.error("Failed to load teams from Supabase:", err);
        setTeams([]);
        setFilteredTeams([]);
      }
    };

    // Load immediately and then set up polling every 2 seconds
    loadTeams();
    const interval = setInterval(loadTeams, 2000);
    
    return () => clearInterval(interval);
  }, [totalFiles]);

  // Apply filters when teams or filter state changes
  useEffect(() => {
    let filtered = teams;

    // Search filter
    if (filters.searchTeam.trim()) {
      const searchLower = filters.searchTeam.toLowerCase();
      filtered = filtered.filter((team) => team.team_name?.toLowerCase().includes(searchLower));
    }

    // Batch filter
    if (filters.batch !== "All") {
      filtered = filtered.filter((team) => team.batch === filters.batch);
    }

    // Status filter
    if (filters.status !== "All") {
      filtered = filtered.filter((team) => team.status === filters.status);
    }

    // Current file filter
    if (filters.file !== "All") {
      filtered = filtered.filter((team) => {
        const paddedFile = String(team.current_file).padStart(2, "0");
        return `FILE ${paddedFile}` === filters.file;
      });
    }

    setFilteredTeams(filtered);
  }, [teams, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Calculate summary statistics
  const summaryStats = {
    totalTeams: teams.length,
    activeTeams: teams.filter((t) => t.status === "ACTIVE").length,
    completedTeams: teams.filter((t) => t.status === "COMPLETED").length,
    disqualifiedTeams: teams.filter((t) => t.status === "DISQUALIFIED").length
  };

  const handleTeamClick = (teamId) => {
    onTeamClick?.(teamId);
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>ADMIN DASHBOARD</h1>
          <p>Live competition monitoring and team standings</p>
        </div>
        <div className="admin-header-actions">
          <button 
            className="btn-open-fullscreen"
            onClick={handleOpenLiveStandingsTab}
            title="Open live standings in new tab"
          >
            📊 Open Fullscreen
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-row">
        <div className="summary-card">
          <div className="summary-card-value">{summaryStats.totalTeams}</div>
          <div className="summary-card-label">Total Teams</div>
        </div>

        <div className="summary-card active">
          <div className="summary-card-value">{summaryStats.activeTeams}</div>
          <div className="summary-card-label">Active</div>
        </div>

        <div className="summary-card completed">
          <div className="summary-card-value">{summaryStats.completedTeams}</div>
          <div className="summary-card-label">Completed</div>
        </div>

        <div className="summary-card disqualified">
          <div className="summary-card-value">{summaryStats.disqualifiedTeams}</div>
          <div className="summary-card-label">Disqualified</div>
        </div>
      </div>

      {/* Filters */}
      <AdminFilterBar
        onFilterChange={handleFilterChange}
        totalTeams={filteredTeams.length}
        totalFiles={totalFiles}
      />

      {/* Live Standings Table */}
      <LiveStandingsTable
        teams={filteredTeams}
        totalFiles={totalFiles}
        onTeamClick={handleTeamClick}
      />
    </div>
  );
}
