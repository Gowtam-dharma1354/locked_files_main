/**
 * FilterBar Component
 * Provides filtering options for the standings table
 */

import React, { useState } from "react";
import "./AdminFilterBar.css";

export default function FilterBar({ onFilterChange, totalTeams, totalFiles }) {
  const [searchTeam, setSearchTeam] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedFile, setSelectedFile] = useState("All");

  const handleSearchChange = (value) => {
    setSearchTeam(value);
    onFilterChange({ searchTeam: value, batch: selectedBatch, status: selectedStatus, file: selectedFile });
  };

  const handleBatchChange = (value) => {
    setSelectedBatch(value);
    onFilterChange({ searchTeam, batch: value, status: selectedStatus, file: selectedFile });
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    onFilterChange({ searchTeam, batch: selectedBatch, status: value, file: selectedFile });
  };

  const handleFileChange = (value) => {
    setSelectedFile(value);
    onFilterChange({ searchTeam, batch: selectedBatch, status: selectedStatus, file: value });
  };

  const handleClearFilters = () => {
    setSearchTeam("");
    setSelectedBatch("All");
    setSelectedStatus("All");
    setSelectedFile("All");
    onFilterChange({ searchTeam: "", batch: "All", status: "All", file: "All" });
  };

  return (
    <div className="filter-bar-container">
      <div className="filter-row">
        <div className="filter-group">
          <label htmlFor="search-team">Search Team</label>
          <input
            id="search-team"
            type="text"
            placeholder="Enter team name..."
            value={searchTeam}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="batch-select">Batch</label>
          <select value={selectedBatch} onChange={(e) => handleBatchChange(e.target.value)} className="filter-select">
            <option value="All">All</option>
            <option value="PGDM 1st Year">PGDM 1st Year</option>
            <option value="PGDM 2nd Year">PGDM 2nd Year</option>
            <option value="PGPISM">PGPISM</option>
            <option value="LLM">LLM</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-select">Status</label>
          <select value={selectedStatus} onChange={(e) => handleStatusChange(e.target.value)} className="filter-select">
            <option value="All">All</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="TIME_EXPIRED">Time Expired</option>
            <option value="DISQUALIFIED">Disqualified</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="file-select">Current File</label>
          <select value={selectedFile} onChange={(e) => handleFileChange(e.target.value)} className="filter-select">
            <option value="All">All</option>
            {Array.from({ length: totalFiles }, (_, i) => {
              const fileNum = i + 1;
              const paddedFile = String(fileNum).padStart(2, "0");
              return (
                <option key={fileNum} value={`FILE ${paddedFile}`}>
                  FILE {paddedFile}
                </option>
              );
            })}
          </select>
        </div>

        <button className="filter-clear-btn" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="filter-summary">
        <span>Showing teams matching filters • Total teams: {totalTeams}</span>
      </div>
    </div>
  );
}
