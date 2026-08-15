/**
 * TeamLogin Component
 * Participant-only login screen. Teams enter their team code to continue into the competition.
 */

import React, { useState, useRef, useEffect } from "react";
import ClubBrand from "./ClubBrand";
import { supabase } from "../lib/supabaseClient";
import "./TeamLogin.css";

export default function TeamLogin({ onEnter, onBack }) {
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedCode = teamCode.trim();
    if (!trimmedCode) {
      setError("Please enter your team code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, team_name, team_code, batch, status")
        .eq("team_code", trimmedCode)
        .maybeSingle();

      if (teamError) {
        throw teamError;
      }

      if (!team) {
        setError("Team code not found. Please contact the admin or check the code again.");
        setIsSubmitting(false);
        return;
      }

      if (team.status === "DISQUALIFIED") {
        setError("This team is not eligible to continue.");
        setIsSubmitting(false);
        return;
      }

      onEnter({
        teamId: team.id,
        teamName: team.team_name,
        teamCode: team.team_code,
        batch: team.batch,
        status: team.status
      });
    } catch (submitError) {
      console.error("Team login failed:", submitError);
      setError("Unable to find that team code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="form-title">TEAM LOGIN</h2>
          <p className="form-description">
            Enter your team code to continue to the competition.
          </p>

          <form onSubmit={handleSubmit} className="team-form">
            <div className="form-group">
              <label htmlFor="team-code">TEAM CODE</label>
              <input
                ref={inputRef}
                id="team-code"
                type="text"
                className="form-input"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="LF-XXXXXX"
                maxLength={32}
                aria-label="Team code"
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-btn submit-btn"
              disabled={isSubmitting || !teamCode.trim()}
            >
              {isSubmitting ? "VERIFYING..." : "ENTER COMPETITION"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
