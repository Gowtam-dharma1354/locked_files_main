/**
 * FileQuestion Component
 * Displays a single question from the current file
 * Supports unlimited attempts (no 2-attempt limit)
 * Handles answer submission and feedback
 */

import React, { useState, useEffect, useRef } from "react";
import AnswerInput from "./AnswerInput";
import ClubBrand from "./ClubBrand";
import CompetitionTimer from "./CompetitionTimer";
import FileProgress from "./FileProgress";
import "./FileQuestion.css";

const padFileNumber = (num) => String(num).padStart(2, "0");

export default function FileQuestion({
  currentFile,
  totalFiles,
  question,
  onAnswerCorrect,
  timerStartTime,
  fullscreenViolationCount = 0
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // null, 'correct', 'incorrect'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const answerInputRef = useRef(null);

  // Reset form state when file or question changes
  useEffect(() => {
    setUserAnswer("");
    setFeedback(null);
    setIsSubmitting(false);
    setAttemptCount(0);
    // Focus on input field for new question
    setTimeout(() => {
      answerInputRef.current?.focus();
    }, 100);
  }, [currentFile, question]);

  // Normalize answer for comparison
  const normalizeAnswer = (value) => {
    if (value === null || value === undefined) return "";
    let str = String(value).trim().toLowerCase();
    str = str.replace(/\s+/g, " ");
    str = str.replace(/(\d+)\s+%/g, "$1%");
    str = str.replace(/(\d+),(\d+)/g, "$1$2");
    return str;
  };

  // Check if user answer matches the correct answer
  const checkAnswer = (userAnswer) => {
    const normUser = normalizeAnswer(userAnswer);
    if (!normUser) return false;

    const normCanonical = normalizeAnswer(question.answer);
    if (normUser === normCanonical) return true;

    const normAlternatives = (question.acceptedAnswers || []).map(normalizeAnswer);
    if (normAlternatives.includes(normUser)) return true;

    // Try numeric comparison
    const userNum = Number(normUser);
    if (!isNaN(userNum) && normUser.trim() !== "") {
      const isCanonicalNum = !isNaN(Number(normCanonical));
      if (isCanonicalNum && Number(normCanonical) === userNum) return true;
      for (const alt of normAlternatives) {
        if (!isNaN(Number(alt)) && Number(alt) === userNum) return true;
      }
    }

    return false;
  };

  // Handle answer submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userAnswer.trim()) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const isCorrect = checkAnswer(userAnswer);

    if (isCorrect) {
      setFeedback("correct");
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      
      // Show success message and then call callback after 1500ms
      setTimeout(() => {
        onAnswerCorrect(newAttemptCount);
      }, 1500);
    } else {
      setFeedback("incorrect");
      setAttemptCount(attemptCount + 1);
      // Keep the question visible, allow user to try again
      // Clear the answer field after a brief moment
      setTimeout(() => {
        setUserAnswer("");
        setFeedback(null);
        answerInputRef.current?.focus();
        setIsSubmitting(false);
      }, 1500);
    }
  };

  if (!question) {
    return <div className="file-question-placeholder">Loading question...</div>;
  }

  return (
    <div className="file-question">
      <div className="file-question-header">
        <ClubBrand />
        <div className="file-question-nav">
          <div className="file-number">
            FILE {padFileNumber(currentFile)} / {padFileNumber(totalFiles)}
          </div>
          <CompetitionTimer
            timerStartTime={timerStartTime}
            fullscreenViolationCount={fullscreenViolationCount}
          />
        </div>
      </div>

      <FileProgress currentFile={currentFile} totalFiles={totalFiles} />

      <div className="file-question-main">
        <div className="file-question-content">
          <h2 className="question-text">{question.question}</h2>

          <form onSubmit={handleSubmit} className="question-form">
            <div
              ref={answerInputRef}
              className="answer-input-container"
            >
              <label htmlFor="file-answer">ENTER YOUR ANSWER</label>
              <div className="answer-input-wrapper">
                <input
                  id="file-answer"
                  type="text"
                  className="answer-input"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  maxLength={100}
                  placeholder="Type your answer..."
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isSubmitting || feedback === "correct"}
                  aria-label="Enter your answer to decrypt this file"
                />
              </div>

              {/* Feedback Message */}
              {feedback === "incorrect" && (
                <div className="feedback-message incorrect-feedback" role="alert">
                  ❌ INCORRECT ANSWER
                  <br />
                  Try again.
                </div>
              )}

              {feedback === "correct" && (
                <div className="feedback-message correct-feedback" role="status">
                  ✓ FILE UNLOCKED
                  <br />
                  Moving to next file...
                </div>
              )}

              <button
                className="primary-btn submit-btn"
                type="submit"
                disabled={
                  isSubmitting ||
                  !userAnswer.trim() ||
                  feedback === "correct"
                }
                aria-label="Submit answer"
              >
                SUBMIT ANSWER
              </button>
            </div>
          </form>

          <div className="attempt-info">
            Attempt: {attemptCount + 1}
          </div>
        </div>
      </div>
    </div>
  );
}
