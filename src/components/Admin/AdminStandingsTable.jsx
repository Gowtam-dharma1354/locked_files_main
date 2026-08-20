/**
 * Live Standings Table Component
 * Primary feature of the Admin Dashboard
 * 
 * Displays all teams with real-time ranking updates
 */

import React, { useState, useMemo } from "react";
import "./AdminStandingsTable.css";
import { getStatusStyle, getCurrentFileDisplay, getFilesUnlockedDisplay, getTabSwitchLevel } from "../../lib/rankingService";

export default function LiveStandingsTable({ teams, totalFiles, onTeamClick, sortBy = "rank", onSortChange }) {
  const [sortColumn, setSortColumn] = useState(sortBy);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    onSortChange?.(column, sortDirection === "asc" ? "desc" : "asc");
  };

  // Apply sorting
  const sortedTeams = useMemo(() => {
    const sorted = [...teams];

    sorted.sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case "rank":
          aVal = a.rank || 0;
          bVal = b.rank || 0;
          break;
        case "team_name":
          aVal = (a.team_name || "").toLowerCase();
          bVal = (b.team_name || "").toLowerCase();
          break;
        case "batch":
          aVal = a.batch || "";
          bVal = b.batch || "";
          break;
        case "score":
          aVal = a.score || 0;
          bVal = b.score || 0;
          break;
        case "files_unlocked":
          aVal = a.files_unlocked || 0;
          bVal = b.files_unlocked || 0;
          break;
        case "last_file_unlocked_at":
          aVal = a.last_file_unlocked_at || "00:00:00";
          bVal = b.last_file_unlocked_at || "00:00:00";
          break;
        case "time_remaining":
          aVal = a.time_remaining || "999:59";
          bVal = b.time_remaining || "999:59";
          break;
        case "tab_switch_count":
          aVal = a.tab_switch_count || 0;
          bVal = b.tab_switch_count || 0;
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [teams, sortColumn, sortDirection]);

  const SortHeader = ({ label, column }) => (
    <th onClick={() => handleSort(column)} className="sortable-header">
      <span>{label}</span>
      {sortColumn === column && (
        <span className="sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>
      )}
    </th>
  );

  return (
    <div className="standings-table-container">
      <div className="standings-header">
        <h2>LIVE STANDINGS TABLE</h2>
        <span className="standings-subtitle">Real-time team rankings and progress</span>
      </div>

      <div className="table-wrapper">
        <table className="standings-table">
          <thead>
            <tr>
              <SortHeader label="#" column="rank" />
              <SortHeader label="TEAM NAME" column="team_name" />
              <SortHeader label="BATCH" column="batch" />
              <SortHeader label="SCORE" column="score" />
              <SortHeader label="FILES UNLOCKED" column="files_unlocked" />
              <SortHeader label="CURRENT FILE" column="current_file" />
              <SortHeader label="TIME" column="time_remaining" />
              <SortHeader label="LAST UNLOCKED" column="last_file_unlocked_at" />
              <SortHeader label="TAB SWITCHES" column="tab_switch_count" />
              <SortHeader label="STATUS" column="status" />
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, idx) => {
              const statusStyle = getStatusStyle(team.status);
              const currentFileDisplay = getCurrentFileDisplay(team, totalFiles);
              const filesDisplay = getFilesUnlockedDisplay(team, totalFiles);
              const tabSwitchLevel = getTabSwitchLevel(team.tab_switch_count || 0);

              return (
                <tr key={team.team_id} className={`team-row status-${team.status.toLowerCase()}`}>
                  <td className="rank-cell">
                    <span className="rank-badge">{team.rank || idx + 1}</span>
                  </td>

                  <td className="team-name-cell">
                    <button
                      onClick={() => onTeamClick?.(team.team_id)}
                      className="team-name-link"
                      title="Click to view team details"
                    >
                      {team.team_name}
                    </button>
                  </td>

                  <td className="batch-cell">
                    <span className="batch-badge">{team.batch}</span>
                  </td>

                  <td className="score-cell">
                    <strong>{team.score || 0}</strong>
                  </td>

                  <td className="files-cell">
                    <span className="files-badge">{filesDisplay}</span>
                  </td>

                  <td className="current-file-cell">
                    <span className="file-display">{currentFileDisplay}</span>
                  </td>

                  <td className="time-cell">
                    <span className="time-display">{team.time_remaining || team.completion_time || "—"}</span>
                  </td>

                  <td className="timestamp-cell">
                    <span className="timestamp">{team.last_file_unlocked_at || "—"}</span>
                  </td>

                  <td className={`tab-switch-cell ${tabSwitchLevel}`}>
                    <span className={`tab-switch-badge ${tabSwitchLevel}`}>{team.tab_switch_count || 0}</span>
                  </td>

                  <td className="status-cell">
                    <span
                      className="status-badge"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="standings-footer">
        <span className="standings-footer-title">STANDINGS</span>
        <span className="standings-footer-meta">{sortedTeams.length} teams shown</span>
        <span className="standings-footer-status">LIVE</span>
      </div>

      {sortedTeams.length === 0 && (
        <div className="no-teams-message">
          <p>No teams match the selected filters</p>
        </div>
      )}
    </div>
  );
}
