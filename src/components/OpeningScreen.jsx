/**
 * OpeningScreen Component
 * Displays the initial welcome screen with NISM branding
 * Provides entry points for TEAM and ADMIN login
 */

import React from "react";
import ClubBrand from "./ClubBrand";
import "./OpeningScreen.css";

export default function OpeningScreen({ onSelectTeam }) {
  return (
    <div className="opening-screen">
      <div className="opening-content">
        <div className="opening-header">
          <ClubBrand className="opening-brand" />
        </div>

        <div className="opening-divider" />

        <div className="opening-login-area">
          <div className="login-options">
            <button
              className="login-btn team-btn"
              onClick={onSelectTeam}
              aria-label="Team Login"
            >
              <div className="login-label">TEAM</div>
              <div className="login-description">Participate in competition</div>
              <span className="login-arrow">→</span>
            </button>
          </div>
        </div>

        <div className="opening-footer">
          <p className="opening-tagline">
            Decode the strategy. Unlock your potential.
          </p>
        </div>
      </div>
    </div>
  );
}
