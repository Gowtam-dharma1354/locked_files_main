/**
 * Admin Dashboard Component
 * Main admin interface with live standings table
 */

import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import AdminFilterBar from "./AdminFilterBar";
import LiveStandingsTable from "./AdminStandingsTable";
import { calculateRankings } from "../../lib/rankingService";
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
  const [loading, setLoading] = useState(true);

  const totalFiles = COMPETITION_CONFIG.TOTAL_FILES || 12;

  // Load live team data from Supabase
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);

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

        const sessionMap = new Map((sessionRows || []).map((session) => [session.team_id, session]));

        const liveTeams = (teamRows || []).map((team) => {
          const session = sessionMap.get(team.id) || {};
          const currentLevel = Number(session.current_level ?? 1);

          return {
            ...team,
            team_id: team.id,
            score: Number(session.score ?? 0),
            status: session.status ?? team.status ?? "NOT_STARTED",
            current_file: currentLevel,
            files_unlocked: Math.max(0, currentLevel - 1),
            attempt_count: Number(session.failed_attempts_total ?? 0),
            tab_switch_count: Number(session.fullscreen_violations ?? 0),
            last_file_unlocked_at: session.completed_at ?? session.started_at ?? null,
            time_remaining: session.expires_at ? new Date(session.expires_at).toLocaleTimeString() : null
          };
        });

        const rankedTeams = calculateRankings(liveTeams);
        setTeams(rankedTeams);
        setFilteredTeams(rankedTeams);
      } catch (err) {
        console.error("Failed to load teams from Supabase:", err);
        setTeams([]);
        setFilteredTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
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
        <div className="admin-last-updated">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
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
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading standings...</p>
        </div>
      ) : (
        <LiveStandingsTable
          teams={filteredTeams}
          totalFiles={totalFiles}
          onTeamClick={handleTeamClick}
        />
      )}
    </div>
  );
}
