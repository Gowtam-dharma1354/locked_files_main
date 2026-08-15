/**
 * App Component - Complete Redesign
 * Implements the new participant flow:
 * OPENING SCREEN → TEAM LOGIN → FILE 01-15 → TASK COMPLETED
 *
 * Features:
 * - Dynamic 10-15 file support (configurable)
 * - Batch-specific question routing
 * - Continuous timer across all files
 * - Unlimited attempts per question
 * - File progress tracking
 * - Semi-dark/light theme
 */

import React, { useEffect, useState } from "react";
import OpeningScreen from "./components/OpeningScreen";
import TeamLogin from "./components/TeamLogin";
import FileQuestion from "./components/FileQuestion";
import TaskCompletedPage from "./components/TaskCompletedPage";
import Admin from "./components/Admin";
import { COMPETITION_CONFIG } from "./data/competitionConfig";
import { getQuestionPaper } from "./data/questionPaperSelector";
import { supabase } from "./lib/supabaseClient";
import "./styles.css";

const SCREEN_STATES = {
  OPENING: "opening",
  TEAM_LOGIN: "team_login",
  COMPETITION: "competition",
  COMPLETED: "completed",
  ADMIN: "admin"
};

const ALLOWED_CATEGORIES = ["Finance", "Business"];

export const normalizeAnswer = (value) => {
  if (value === null || value === undefined) return "";
  let str = String(value).trim().toLowerCase();
  str = str.replace(/\s+/g, " ");
  str = str.replace(/(\d+)\s+%/g, "$1%");
  str = str.replace(/(\d+),(\d+)/g, "$1$2");
  return str;
};

export const checkAnswer = (userAnswer, canonicalAnswer, acceptedAnswers = []) => {
  const normUser = normalizeAnswer(userAnswer);
  if (!normUser) return false;

  const normCanonical = normalizeAnswer(canonicalAnswer);
  if (normUser === normCanonical) return true;

  const normAlternatives = (acceptedAnswers || []).map(normalizeAnswer);
  if (normAlternatives.includes(normUser)) return true;

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

// Get the current question based on batch and file number
const loadQuestion = (batch, fileNumber) => {
  const paper = getQuestionPaper(batch, fileNumber);
  // For now, return the first question from the paper
  // In the future, this could return a random question or a specific one
  if (paper && paper.length > 0) {
    return paper[0];
  }
  return null;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState(SCREEN_STATES.OPENING);
  const [teamData, setTeamData] = React.useState(null);
  const [currentFile, setCurrentFile] = React.useState(1);
  const [timerStartTime, setTimerStartTime] = React.useState(null);
  const [currentQuestion, setCurrentQuestion] = React.useState(null);

  const totalFiles = COMPETITION_CONFIG.TOTAL_FILES;
  const timerDuration = COMPETITION_CONFIG.TIMER_DURATION_SECONDS;

  const createCompetitionSession = async (teamInfo) => {
    const { data: existingSession } = await supabase
      .from("competition_sessions")
      .select("id, team_id, status, current_level")
      .eq("team_id", teamInfo.teamId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      return existingSession;
    }

    const { data: settingsRow } = await supabase
      .from("competition_settings")
      .select("duration_seconds")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const durationSeconds = settingsRow?.duration_seconds ?? COMPETITION_CONFIG.TIMER_DURATION_SECONDS;
    const now = new Date();
    const startedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();

    const { data: createdSession, error: sessionError } = await supabase
      .from("competition_sessions")
      .insert({
        team_id: teamInfo.teamId,
        status: "NOT_STARTED",
        current_level: 1,
        started_at: startedAt,
        expires_at: expiresAt
      })
      .select("id, team_id, status, current_level, started_at, expires_at")
      .single();

    if (sessionError) {
      throw sessionError;
    }

    await supabase.from("competition_events").insert({
      session_id: createdSession.id,
      team_id: teamInfo.teamId,
      event_type: "SESSION_CREATED",
      metadata: { team_name: teamInfo.teamName, batch: teamInfo.batch, current_level: 1 }
    });

    return createdSession;
  };

  // Handle team login
  const handleTeamEnter = async (teamInfo) => {
    try {
      const session = await createCompetitionSession(teamInfo);

      setTeamData({
        ...teamInfo,
        sessionId: session.id,
        teamId: teamInfo.teamId
      });
      setCurrentFile(1);
      setTimerStartTime(Date.now());
      const question = loadQuestion(teamInfo.batch, 1);
      setCurrentQuestion(question);
      setCurrentScreen(SCREEN_STATES.COMPETITION);
    } catch (error) {
      console.error("Unable to create competition session:", error);
      setTeamData(teamInfo);
      setCurrentFile(1);
      const question = loadQuestion(teamInfo.batch, 1);
      setCurrentQuestion(question);
      setCurrentScreen(SCREEN_STATES.COMPETITION);
    }
  };

  // Handle correct answer - move to next file or complete
  const handleAnswerCorrect = (attemptNumber) => {
    if (currentFile >= totalFiles) {
      // All files completed
      setCurrentScreen(SCREEN_STATES.COMPLETED);
    } else {
      // Move to next file
      const nextFile = currentFile + 1;
      setCurrentFile(nextFile);
      const question = loadQuestion(teamData.batch, nextFile);
      setCurrentQuestion(question);
    }
  };

  // Handle team login button
  const handleSelectTeam = () => {
    setCurrentScreen(SCREEN_STATES.TEAM_LOGIN);
  };

  // Handle admin button
  const handleSelectAdmin = () => {
    setCurrentScreen(SCREEN_STATES.ADMIN);
  };

  // Handle back from team login
  const handleBackFromLogin = () => {
    setCurrentScreen(SCREEN_STATES.OPENING);
  };

  // Handle back from admin
  const handleBackFromAdmin = () => {
    setCurrentScreen(SCREEN_STATES.OPENING);
  };

  // Handle restart from completed screen
  const handleRestart = () => {
    setTeamData(null);
    setCurrentFile(1);
    setTimerStartTime(null);
    setCurrentQuestion(null);
    setCurrentScreen(SCREEN_STATES.OPENING);
  };

  // Render based on current screen
  switch (currentScreen) {
    case SCREEN_STATES.OPENING:
      return (
        <div className="app-shell">
          <div className="scanlines" />
          <OpeningScreen 
            onSelectTeam={handleSelectTeam}
            onSelectAdmin={handleSelectAdmin}
          />
        </div>
      );

    case SCREEN_STATES.TEAM_LOGIN:
      return (
        <div className="app-shell">
          <div className="scanlines" />
          <TeamLogin 
            onEnter={handleTeamEnter}
            onBack={handleBackFromLogin}
          />
        </div>
      );

    case SCREEN_STATES.COMPETITION:
      return (
        <div className="app-shell">
          <div className="scanlines" />
          <FileQuestion
            currentFile={currentFile}
            totalFiles={totalFiles}
            question={currentQuestion}
            onAnswerCorrect={handleAnswerCorrect}
            timerStartTime={timerStartTime}
            timerDuration={timerDuration}
            sessionId={teamData?.sessionId}
            teamId={teamData?.teamId}
            onSessionStarted={(startedAt) => {
              setTimerStartTime(new Date(startedAt).getTime());
            }}
          />
        </div>
      );

    case SCREEN_STATES.COMPLETED:
      return (
        <div className="app-shell">
          <div className="scanlines" />
          <TaskCompletedPage
            totalFiles={totalFiles}
            teamName={teamData?.teamName}
            batch={teamData?.batch}
            onRestart={handleRestart}
          />
        </div>
      );

    case SCREEN_STATES.ADMIN:
      return (
        <div className="app-shell">
          <div className="scanlines" />
          <Admin onBack={handleBackFromAdmin} />
        </div>
      );

    default:
      return <div className="app-shell" />;
  }
}
