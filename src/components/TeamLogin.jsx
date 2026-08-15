/**
 * TeamLogin Component
 * Allows team to enter name and select their batch
 * Then proceed to the competition
 */

import React, { useState, useRef, useEffect } from "react";
import ClubBrand from "./ClubBrand";
import "./TeamLogin.css";

const BATCHES = [
  { value: "PGDM_1", label: "PGDM 1st Year" },
  { value: "PGDM_2", label: "PGDM 2nd Year" },
  { value: "PGPISM", label: "PGPISM" },
  { value: "LLM", label: "LLM" }
];

export default function TeamLogin({ onEnter, onBack }) {
  const [teamName, setTeamName] = useState("");
  const [batch, setBatch] = useState("");
  const [error, setError] = useState("");
  const teamInputRef = useRef(null);

  useEffect(() => {
    teamInputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    if (!batch) {
      setError("Please select a batch");
      return;
    }

    onEnter({
      teamName: teamName.trim(),
      batch
    });
  };

  const isFormValid = teamName.trim() && batch;

  return (
    <div className="team-login">
      <div className="login-content">
        <div className="login-header">
          <button className="back-btn" onClick={onBack} aria-label="Go back">
            ← BACK
          </button>
          <ClubBrand className="login-brand" />
        </div>

        <div className="login-form-section">
          <h2 className="form-title">TEAM REGISTRATION</h2>
          <p className="form-description">
            Enter your team details to enter LOCKED FILES
          </p>

          <form onSubmit={handleSubmit} className="team-form">
            {/* Team Name Input */}
            <div className="form-group">
              <label htmlFor="team-name">TEAM NAME</label>
              <input
                ref={teamInputRef}
                id="team-name"
                type="text"
                className="form-input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                maxLength={50}
                aria-label="Team name input"
              />
            </div>

            {/* Batch Selection */}
            <div className="form-group">
              <label htmlFor="batch-select">BATCH</label>
              <select
                id="batch-select"
                className="form-select"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                aria-label="Batch selection"
              >
                <option value="">Select your batch</option>
                {BATCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="primary-btn submit-btn"
              disabled={!isFormValid}
              aria-label="Enter locked files"
            >
              ENTER LOCKED FILES <span>→</span>
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p className="footer-note">
            The batch you select determines your question paper from File 02 onward.
          </p>
        </div>
      </div>
    </div>
  );
}
