/**
 * App Component - Route split between player and admin experiences.
 */

import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
  COMPLETED: "completed"
};

const PLAYER_STORAGE_KEY = "locked-files-player-state";
const PLAYER_COMPLETION_KEY = "locked-files-completed-state";

const readStorageValue = (storage, key) => {
  if (typeof window === "undefined") return null;

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Unable to read saved player state:", error);
    return null;
  }
};

const writeStorageValue = (storage, key, state) => {
  if (typeof window === "undefined") return;

  try {
    if (!state) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save player state:", error);
  }
};

const clearPlayerState = () => {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(PLAYER_STORAGE_KEY);
  localStorage.removeItem(PLAYER_COMPLETION_KEY);
};

const readPlayerState = () => {
  if (typeof window === "undefined") return null;

  const sessionState = readStorageValue(sessionStorage, PLAYER_STORAGE_KEY);
  if (sessionState) {
    return sessionState;
  }

  return readStorageValue(localStorage, PLAYER_COMPLETION_KEY);
};

const writePlayerState = (state) => {
  if (typeof window === "undefined") return;

  const targetStorage = state?.currentScreen === SCREEN_STATES.COMPLETED ? localStorage : sessionStorage;
  const targetKey = state?.currentScreen === SCREEN_STATES.COMPLETED ? PLAYER_COMPLETION_KEY : PLAYER_STORAGE_KEY;

  if (state?.currentScreen === SCREEN_STATES.COMPLETED) {
    writeStorageValue(localStorage, PLAYER_COMPLETION_KEY, state);
    sessionStorage.removeItem(PLAYER_STORAGE_KEY);
    return;
  }

  writeStorageValue(sessionStorage, PLAYER_STORAGE_KEY, state);
  localStorage.removeItem(PLAYER_COMPLETION_KEY);
};

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

const loadQuestion = (batch, fileNumber) => {
  const paper = getQuestionPaper(batch, fileNumber);
  if (paper && paper.length > 0) {
    return paper[0];
  }
  return null;
};

function PlayerExperience() {
  const savedState = readPlayerState();
  const [currentScreen, setCurrentScreen] = useState(savedState?.currentScreen || SCREEN_STATES.OPENING);
  const [teamData, setTeamData] = useState(savedState?.teamData || null);
  const [currentFile, setCurrentFile] = useState(savedState?.currentFile || 1);
  const [timerStartTime, setTimerStartTime] = useState(savedState?.timerStartTime || null);
  const [fullscreenViolationCount, setFullscreenViolationCount] = useState(savedState?.fullscreenViolationCount || 0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const lastFullscreenStateRef = useRef(null);
  const fullscreenEnteredRef = useRef(false);
  const fullscreenViolationInProgressRef = useRef(false);

  const totalFiles = COMPETITION_CONFIG.TOTAL_FILES;

  useEffect(() => {
    writePlayerState({
      currentScreen,
      teamData,
      currentFile,
      timerStartTime,
      fullscreenViolationCount
    });
  }, [currentScreen, teamData, currentFile, timerStartTime, fullscreenViolationCount]);

  useEffect(() => {
    if (teamData?.batch && currentScreen === SCREEN_STATES.COMPETITION && !currentQuestion) {
      setCurrentQuestion(loadQuestion(teamData.batch, currentFile));
    }
  }, [teamData, currentFile, currentQuestion, currentScreen]);

  const logFullscreenEvent = async (eventType, metadata) => {
    if (!teamData?.sessionId || !teamData?.teamId) return;

    try {
      await supabase.from("competition_events").insert({
        session_id: teamData.sessionId,
        team_id: teamData.teamId,
        event_type: eventType,
        metadata
      });
    } catch (error) {
      console.error(`Unable to log fullscreen event ${eventType}:`, error);
    }
  };

  const incrementFullscreenViolationCount = async () => {
    if (!teamData?.sessionId) return;

    try {
      const { data: sessionRow, error: fetchError } = await supabase
        .from("competition_sessions")
        .select("fullscreen_violations")
        .eq("id", teamData.sessionId)
        .maybeSingle();

      if (fetchError) {
        console.error("Unable to fetch fullscreen violation count:", fetchError);
        return;
      }

      const nextCount = (sessionRow?.fullscreen_violations ?? 0) + 1;
      const { error: updateError } = await supabase
        .from("competition_sessions")
        .update({ fullscreen_violations: nextCount })
        .eq("id", teamData.sessionId);

      if (updateError) {
        console.error("Unable to update fullscreen violation count:", updateError);
      }

      setFullscreenViolationCount(nextCount);
    } catch (error) {
      console.error("Unable to increment fullscreen violation count:", error);
    }
  };

  const requestPlayerFullscreen = async () => {
    if (typeof document === "undefined") return;

    const hasFullscreenApi = !!document.documentElement?.requestFullscreen;
    if (!hasFullscreenApi) {
      setFullscreenMessage("Fullscreen mode is required for the competition. Click below to enter fullscreen.");
      setShowFullscreenWarning(true);
      return;
    }

    try {
      if (document.fullscreenElement) {
        setFullscreenMessage("");
        setShowFullscreenWarning(false);
        setIsFullscreenActive(true);
        return;
      }

      await document.documentElement.requestFullscreen();
      fullscreenViolationInProgressRef.current = false;
      setFullscreenMessage("");
      setShowFullscreenWarning(false);
      setIsFullscreenActive(true);
    } catch (error) {
      console.warn("Fullscreen request rejected:", error);
      fullscreenViolationInProgressRef.current = true;
      setFullscreenMessage("Fullscreen mode is required for the competition. Click below to enter fullscreen.");
      setShowFullscreenWarning(true);
    }
  };

  const handleFullscreenViolation = async (reason = "fullscreen_exit") => {
    if (!teamData?.sessionId || !teamData?.teamId || fullscreenViolationInProgressRef.current) {
      return;
    }

    fullscreenViolationInProgressRef.current = true;
    await logFullscreenEvent("FULLSCREEN_EXITED", { reason, level: currentFile });
    await incrementFullscreenViolationCount();

    setShowFullscreenWarning(true);
    setFullscreenMessage("FULLSCREEN VIOLATION\nYou exited fullscreen mode.\nThis action has been recorded.\nPlease return to fullscreen mode to continue.");

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn("Unable to exit fullscreen before restoring:", error);
      }
    }

    setTimeout(() => {
      requestPlayerFullscreen();
    }, 200);

    setTimeout(() => {
      requestPlayerFullscreen();
    }, 900);
  };

  useEffect(() => {
    if (currentScreen !== SCREEN_STATES.COMPETITION || !teamData?.teamId) {
      setShowFullscreenWarning(false);
      setFullscreenMessage("");
      return;
    }

    const handleFullscreenChange = async () => {
      const fullscreenNow = document.fullscreenElement !== null;
      const competitionActive = currentScreen === SCREEN_STATES.COMPETITION && !!teamData?.sessionId && !!teamData?.teamId;

      if (fullscreenNow && competitionActive && !fullscreenEnteredRef.current) {
        fullscreenEnteredRef.current = true;
        await logFullscreenEvent("FULLSCREEN_ENTERED", { level: currentFile });
      }

      if (!fullscreenNow && competitionActive && lastFullscreenStateRef.current === true) {
        await handleFullscreenViolation("fullscreen_exit");
      } else if (fullscreenNow) {
        fullscreenViolationInProgressRef.current = false;
        setShowFullscreenWarning(false);
        setFullscreenMessage("");
      }

      setIsFullscreenActive(fullscreenNow);
      lastFullscreenStateRef.current = fullscreenNow;
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && document.fullscreenElement && currentScreen === SCREEN_STATES.COMPETITION) {
        event.preventDefault();
        event.stopPropagation();
        handleFullscreenViolation("escape_attempt");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    handleFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentScreen, teamData, currentFile]);

  useEffect(() => {
    if (currentScreen !== SCREEN_STATES.COMPETITION || !teamData?.sessionId) return;

    const shouldRequestFullscreen = !document.fullscreenElement;
    if (shouldRequestFullscreen) {
      setTimeout(() => {
        requestPlayerFullscreen();
      }, 200);
    }
  }, [currentScreen, teamData]);

  const createCompetitionSession = async (teamInfo) => {
    const { data: existingSession } = await supabase
      .from("competition_sessions")
      .select("id, team_id, status, current_level, fullscreen_violations")
      .eq("team_id", teamInfo.teamId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      setFullscreenViolationCount(existingSession.fullscreen_violations ?? 0);
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

  const handleTeamEnter = async (teamInfo) => {
    clearPlayerState();

    try {
      const session = await createCompetitionSession(teamInfo);

      const nextTeamData = {
        ...teamInfo,
        sessionId: session.id,
        teamId: teamInfo.teamId
      };

      setTeamData(nextTeamData);
      setCurrentFile(1);
      setTimerStartTime(Date.now());
      setFullscreenViolationCount(0);
      setCurrentQuestion(loadQuestion(teamInfo.batch, 1));
      setCurrentScreen(SCREEN_STATES.COMPETITION);
      setTimeout(() => requestPlayerFullscreen(), 150);
    } catch (error) {
      console.error("Unable to create competition session:", error);
      const fallbackTeamData = { ...teamInfo, sessionId: teamInfo.sessionId, teamId: teamInfo.teamId };
      setTeamData(fallbackTeamData);
      setCurrentFile(1);
      setFullscreenViolationCount(0);
      setCurrentQuestion(loadQuestion(teamInfo.batch, 1));
      setCurrentScreen(SCREEN_STATES.COMPETITION);
      setTimeout(() => requestPlayerFullscreen(), 150);
    }
  };

  const handleAnswerCorrect = (attemptNumber) => {
    if (currentFile >= totalFiles) {
      setCurrentScreen(SCREEN_STATES.COMPLETED);
      setShowFullscreenWarning(false);
      setFullscreenMessage("");
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      const nextFile = currentFile + 1;
      setCurrentFile(nextFile);
      setCurrentQuestion(loadQuestion(teamData.batch, nextFile));
    }
  };

  const handleSelectTeam = () => {
    setCurrentScreen(SCREEN_STATES.TEAM_LOGIN);
  };

  const handleBackFromLogin = () => {
    setCurrentScreen(SCREEN_STATES.OPENING);
    setShowFullscreenWarning(false);
    setFullscreenMessage("");
  };

  const handleRestart = () => {
    setTeamData(null);
    setCurrentFile(1);
    setTimerStartTime(null);
    setFullscreenViolationCount(0);
    setCurrentQuestion(null);
    setCurrentScreen(SCREEN_STATES.OPENING);
    setShowFullscreenWarning(false);
    setFullscreenMessage("");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    clearPlayerState();
  };

  const handleReturnToFullscreen = async () => {
    setShowFullscreenWarning(false);
    setFullscreenMessage("");
    await requestPlayerFullscreen();
  };

  const handleCloseFullscreenWarning = async () => {
    setShowFullscreenWarning(false);
    setFullscreenMessage("");
    await requestPlayerFullscreen();
  };

  if (currentScreen === SCREEN_STATES.OPENING) {
    return (
      <div className="app-shell">
        <div className="scanlines" />
        <OpeningScreen onSelectTeam={handleSelectTeam} />
      </div>
    );
  }

  if (currentScreen === SCREEN_STATES.TEAM_LOGIN) {
    return (
      <div className="app-shell">
        <div className="scanlines" />
        <TeamLogin onEnter={handleTeamEnter} onBack={handleBackFromLogin} />
      </div>
    );
  }

  if (currentScreen === SCREEN_STATES.COMPETITION) {
    return (
      <div className="app-shell">
        <div className="scanlines" />
        <div style={{ position: "relative" }}>
          <FileQuestion
            currentFile={currentFile}
            totalFiles={totalFiles}
            question={currentQuestion}
            onAnswerCorrect={handleAnswerCorrect}
            timerStartTime={timerStartTime}
            fullscreenViolationCount={fullscreenViolationCount}
            sessionId={teamData?.sessionId}
            teamId={teamData?.teamId}
            onSessionStarted={(startedAt) => {
              setTimerStartTime(new Date(startedAt).getTime());
            }}
          />

          {showFullscreenWarning && (
            <div className="fullscreen-warning-overlay" role="dialog" aria-modal="true">
              <div className="fullscreen-warning-modal">
                <button
                  type="button"
                  className="fullscreen-warning-close"
                  aria-label="Close fullscreen warning"
                  onClick={handleCloseFullscreenWarning}
                >
                  ×
                </button>
                <h3>FULLSCREEN VIOLATION</h3>
                <p>You exited fullscreen mode.</p>
                <p>This action has been recorded.</p>
                <p>Please return to fullscreen mode to continue.</p>
                <button type="button" className="primary-btn submit-btn" onClick={handleReturnToFullscreen}>
                  RETURN TO FULLSCREEN
                </button>
              </div>
            </div>
          )}

          {fullscreenMessage && !showFullscreenWarning && (
            <div className="fullscreen-inline-message">
              {fullscreenMessage}
              <button type="button" className="primary-btn submit-btn" onClick={handleReturnToFullscreen}>
                ENTER FULLSCREEN
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentScreen === SCREEN_STATES.COMPLETED) {
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
  }

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerExperience />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
