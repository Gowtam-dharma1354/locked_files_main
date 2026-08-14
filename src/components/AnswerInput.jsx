import React, { useEffect, useRef } from "react";

export default function AnswerInput({ userAnswer, onChange, onSubmit, disabled }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isSubmitDisabled = disabled || !userAnswer.trim();

  return (
    <form className="answer-form" onSubmit={onSubmit}>
      <label htmlFor="answer-input">ENTER YOUR ANSWER</label>

      <div className="answer-input-wrapper">
        <input
          ref={inputRef}
          id="answer-input"
          type="text"
          className="answer-input"
          value={userAnswer}
          onChange={(e) => onChange(e.target.value)}
          maxLength={100}
          placeholder="Enter your answer..."
          autoComplete="off"
          spellCheck="false"
          aria-label="Enter your answer"
        />
      </div>

      <button
        className="primary-btn submit-btn"
        type="submit"
        disabled={isSubmitDisabled}
      >
        SUBMIT ANSWER
      </button>
    </form>
  );
}
