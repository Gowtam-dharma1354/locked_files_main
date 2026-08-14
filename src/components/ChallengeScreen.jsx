import React, { useEffect, useRef } from "react";
import AnswerInput from "./AnswerInput";
import ClubBrand from "./ClubBrand";

const padLevel = (value) => String(value).padStart(2, "0");

export default function ChallengeScreen({
  attempts,
  currentLevel,
  currentQuestion,
  isResetModalOpen,
  userAnswer,
  message,
  onConfirmNewChallenge,
  onUserAnswerChange,
  onSubmit,
  totalLevels
}) {
  const okBtnRef = useRef(null);

  useEffect(() => {
    if (isResetModalOpen) {
      okBtnRef.current?.focus();
    }
  }, [isResetModalOpen]);

  return (
    <>
      <div className="panel challenge-panel">
        <ClubBrand />
        <div className="challenge-head">
          <div>
            <div className="eyebrow">
              FILE {padLevel(currentLevel)} / {padLevel(totalLevels)}
            </div>
            <h2>LOCKED FILE {padLevel(currentLevel)}</h2>
          </div>
          <div className="attempt-counter">
            ATTEMPTS<br />
            <strong>{attempts}/2</strong>
          </div>
        </div>

        <p className="instruction">
          Read the question carefully and enter your complete answer to decrypt the file.
        </p>

        <div className="progress-block">
          <div className="progress-label">FILE PROGRESS</div>
          <div className="progress-track" aria-label={`File ${currentLevel} of ${totalLevels}`}>
            {Array.from({ length: totalLevels }, (_, index) => {
              const levelNumber = index + 1;
              const isComplete = index < currentLevel - 1;
              const isCurrent = index === currentLevel - 1;

              return (
                <span
                  className={`progress-node ${
                    isComplete ? "is-complete" : isCurrent ? "is-current" : "is-pending"
                  }`}
                  key={index}
                >
                  {isComplete ? "✓" : padLevel(levelNumber)}
                </span>
              );
            })}
          </div>
        </div>

        {currentQuestion && (
          <article className="question-card single-question-card">
            <p className="question-text">{currentQuestion.question}</p>
          </article>
        )}

        <AnswerInput
          userAnswer={userAnswer}
          onChange={onUserAnswerChange}
          onSubmit={onSubmit}
          disabled={isResetModalOpen}
        />

        {message && (
          <div className={`system-message ${message.includes("GRANTED") ? "success-msg" : "error-msg"}`}>
            {message}
          </div>
        )}
      </div>

      {isResetModalOpen && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
            <ClubBrand />
            <div className="eyebrow">SECURITY NOTICE</div>
            <h2 id="reset-modal-title">ACCESS DENIED</h2>
            <p className="modal-copy">TWO ATTEMPTS EXHAUSTED.</p>
            <p className="modal-copy">A NEW QUESTION WILL BE GENERATED.</p>
            <button
              ref={okBtnRef}
              className="primary-btn modal-btn"
              type="button"
              onClick={onConfirmNewChallenge}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
