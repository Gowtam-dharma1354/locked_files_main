/**
 * CompetitionTimer Component
 * Displays countdown timer during competition
 * Designed to receive startTime/endTime from backend later
 * For now, accepts duration in seconds
 */

import React, { useState, useEffect } from "react";
import "./CompetitionTimer.css";

export default function CompetitionTimer({ timerStartTime, duration }) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!timerStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - timerStartTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timerStartTime, duration]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const displayMinutes = String(minutes).padStart(2, "0");
  const displaySeconds = String(seconds).padStart(2, "0");

  const isLowTime = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className={`competition-timer ${isLowTime ? "low-time" : ""} ${isExpired ? "expired" : ""}`}>
      <div className="timer-label">TIME REMAINING</div>
      <div className="timer-display">
        {displayMinutes}:{displaySeconds}
      </div>
      {isExpired && <div className="timer-status">Time's up!</div>}
    </div>
  );
}
