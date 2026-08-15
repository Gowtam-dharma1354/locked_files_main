/**
 * TaskCompletedPage Component
 * Displayed when participant successfully completes all files
 * Shows completion message and motivational text
 */

import React, { useState } from "react";
import ClubBrand from "./ClubBrand";
import "./TaskCompletedPage.css";

export default function TaskCompletedPage({ totalFiles, teamName, batch, onRestart }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section className="task-completed-page">
      <div className="completed-ambient" aria-hidden="true" />
      <div className="completed-particles" aria-hidden="true">
        <i className="particle particle-one" />
        <i className="particle particle-two" />
        <i className="particle particle-three" />
        <i className="particle particle-four" />
        <i className="particle particle-five" />
      </div>

      <div className="completed-content">
        <div className="completed-header">
          <ClubBrand />
          <p className="eyebrow completed-eyebrow">MISSION COMPLETE // CLASSIFIED ACCESS</p>
        </div>

        <div className="completed-sigil" aria-hidden="true">
          <span />
        </div>

        <h1 className="completed-headline">
          TASK<br />COMPLETED
        </h1>

        <p className="completed-message">
          You unlocked the way to success.
        </p>

        {/* Completion Status */}
        <div className="completion-status">
          <div className="completion-marks">
            {Array.from({ length: totalFiles }, (_, i) => (
              <span key={i} className="completion-mark">✓</span>
            ))}
          </div>
          <p className="completion-text">
            {totalFiles} / {totalFiles} FILES UNLOCKED
          </p>
        </div>

        {/* Team Details */}
        <button
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
        >
          {showDetails ? "Hide Details ▼" : "Show Team Details ▶"}
        </button>

        {showDetails && (
          <div className="team-details">
            <div className="detail-item">
              <span className="detail-label">TEAM:</span>
              <span className="detail-value">{teamName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">BATCH:</span>
              <span className="detail-value">{batch}</span>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="completed-actions">
          <button className="primary-btn restart-btn" onClick={onRestart}>
            RETURN TO HOME
          </button>
        </div>

        <div className="completed-footer">
          <p className="footer-tagline">
            Congratulations on completing LOCKED FILES!
            <br />
            Your performance has been recorded.
          </p>
        </div>
      </div>
    </section>
  );
}
