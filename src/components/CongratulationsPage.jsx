import React, { useState } from "react";
import { HANDBOOK_FILENAME, HANDBOOK_URL, REGISTRATION_FORM_URL } from "../config";
import ClubBrand from "./ClubBrand";

export default function CongratulationsPage({ onRestart }) {
  const [noticeMessage, setNoticeMessage] = useState("");

  const handleRegisterClick = () => {
    if (
      !REGISTRATION_FORM_URL ||
      REGISTRATION_FORM_URL === "YOUR_GOOGLE_FORM_URL_HERE"
    ) {
      setNoticeMessage("REGISTRATION FORM LINK WILL BE CONNECTED HERE WHEN THE EVENT GOES LIVE.");
      return;
    }

    window.open(REGISTRATION_FORM_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="panel congrats-panel" aria-labelledby="congrats-heading">
      <div className="congrats-ambient" aria-hidden="true" />
      <div className="congrats-particles" aria-hidden="true">
        <i className="particle particle-one" />
        <i className="particle particle-two" />
        <i className="particle particle-three" />
        <i className="particle particle-four" />
        <i className="particle particle-five" />
      </div>

      <div className="congrats-content">
        <ClubBrand />
        <div className="congrats-sigil" aria-hidden="true">
          <span />
        </div>
        <p className="eyebrow congrats-eyebrow">MISSION COMPLETE // CLASSIFIED ACCESS</p>

        <h1 id="congrats-heading" className="congrats-headline">
          YOU UNLOCKED <span>THE WAY TO SUCCESS</span>
        </h1>

        <div className="completion-block" aria-label="Five out of five files unlocked">
          <div className="completion-marks" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((mark) => (
              <span key={mark}>{"\u2713"}</span>
            ))}
          </div>
          <p>5 / 5 FILES UNLOCKED</p>
        </div>

        <blockquote className="congrats-quote">
          Every challenge you solve unlocks a new possibility.
        </blockquote>

        <div className="congrats-actions">
          <p className="congrats-prompt">Ready for what comes next?</p>
          <button className="primary-btn register-btn" type="button" onClick={handleRegisterClick}>
            REGISTER NOW <span aria-hidden="true">{"\u2192"}</span>
          </button>
          <a
            className="secondary-btn handbook-btn"
            href="/Locked_Files_Official_Rules_and_Participant_Handbook.pdf"
            download="Locked_Files_Official_Rules_and_Participant_Handbook.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOWNLOAD HANDBOOK
          </a>
          {noticeMessage && <div className="system-message success-msg cta-notice">{noticeMessage}</div>}
          <button className="replay-subtle-btn" type="button" onClick={onRestart}>
            REPLAY CHALLENGE
          </button>
        </div>
      </div>
    </section>
  );
}
