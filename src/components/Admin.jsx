/**
 * Admin Component
 * Main admin interface wrapper
 * Handles dashboard and team details views
 */

import React, { useState } from "react";
import AdminDashboard from "./Admin/AdminDashboard";
import AdminTeamDetails from "./Admin/AdminTeamDetails";

export default function Admin() {
  const [view, setView] = useState("dashboard"); // 'dashboard' or 'team-details'
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const handleTeamClick = (teamId) => {
    setSelectedTeamId(teamId);
    setView("team-details");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedTeamId(null);
  };

  if (view === "team-details" && selectedTeamId) {
    return <AdminTeamDetails teamId={selectedTeamId} onClose={handleBackToDashboard} />;
  }

  return <AdminDashboard onTeamClick={handleTeamClick} />;
}
