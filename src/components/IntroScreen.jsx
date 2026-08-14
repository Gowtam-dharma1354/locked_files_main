import React from "react";
import ClubBrand from "./ClubBrand";

export default function IntroScreen({ onStart }) {
  return (
    <div className="panel intro-panel">
      <ClubBrand />
      <div className="eyebrow">CLASSIFIED // PROMOTIONAL CHALLENGE</div>
      <h1>THINK.<br />DECODE.<br /><span>UNLOCK.</span></h1>
      <p className="lead">
        Five classified files. One question per file. Your complete answer unlocks access.
      </p>

      <div className="mission-box">
        <div className="mission-title">MISSION PROTOCOL</div>
        <ol>
          <li>Read the locked question for the current file.</li>
          <li>Type your complete answer in the input field.</li>
          <li>You have two attempts for each question.</li>
          <li>Two failed attempts will generate a new question for the same level.</li>
          <li>Decrypt all 5 files to complete the mission.</li>
        </ol>
      </div>

      <button className="primary-btn" onClick={onStart}>
        ACCEPT MISSION <span>→</span>
      </button>
    </div>
  );
}
