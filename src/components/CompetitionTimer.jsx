/**
 * CompetitionTimer Component
 * Displays elapsed time stopwatch during competition
 * Counts up from 00:00 infinitely
 */

import React, { useState, useEffect } from "react";
import "./CompetitionTimer.css";

export default function CompetitionTimer({ timerStartTime, fullscreenViolationCount = 0 }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!timerStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - timerStartTime) / 1000;
      setElapsedTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [timerStartTime]);

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = Math.floor(elapsedTime % 60);
  const displayMinutes = String(minutes).padStart(2, "0");
  const displaySeconds = String(seconds).padStart(2, "0");

  return (
    <div className="competition-timer">
      <div className="timer-block">
        <div className="timer-label">TIME ELAPSED</div>
        <div className="timer-display">
          {displayMinutes}:{displaySeconds}
        </div>
      </div>

      <div className="violation-block" aria-live="polite">
        <div className="timer-label">FULLSCREEN VIOLATIONS</div>
        <div className="violation-count">{fullscreenViolationCount}</div>
      </div>
    </div>
  );
}
