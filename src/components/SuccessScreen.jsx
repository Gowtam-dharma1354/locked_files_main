import React from "react";
import ClubBrand from "./ClubBrand";

const padLevel = (value) => String(value).padStart(2, "0");

export default function SuccessScreen({
  currentLevel,
  mode,
  onContinue,
  onRestart,
  showFinalContinueMessage
}) {
  const isFinal = mode === "final";
  const nextLevel = currentLevel + 1;

  return (
    <div className="panel success-panel">
      <ClubBrand />
      <div className="access-icon">✓</div>
      <div className="eyebrow">
        {isFinal ? "ALL FILES DECRYPTED" : `FILE ${padLevel(currentLevel)} DECRYPTED`}
      </div>
      <h2>{isFinal ? "MISSION COMPLETE" : "ACCESS GRANTED"}</h2>
      <p>
        {isFinal
          ? "You successfully unlocked all five files."
          : "NEXT FILE UNLOCKED"}
      </p>

      {!isFinal && (
        <div className="unlocked-file">
          <span>{`FILE ${padLevel(nextLevel)}`}</span>
          <strong>UNLOCKED</strong>
          <span className="mini-lock">OPEN</span>
        </div>
      )}

      {isFinal && showFinalContinueMessage && (
        <div className="system-message success-msg final-message">
          VIDEO / REGISTRATION WILL BE CONNECTED HERE.
        </div>
      )}

      <div className="success-actions">
        <button className="primary-btn" type="button" onClick={onContinue}>
          CONTINUE
        </button>
        <button className="secondary-btn" type="button" onClick={onRestart}>
          REPLAY CHALLENGE
        </button>
      </div>

      <p className="muted">
        {isFinal
          ? "The final event integrations are still pending hookup in this frontend prototype."
          : `Proceed to FILE ${padLevel(nextLevel)} when you are ready.`}
      </p>
    </div>
  );
}
