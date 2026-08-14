import React, { useEffect, useState } from "react";
import ChallengeScreen from "./components/ChallengeScreen";
import CongratulationsPage from "./components/CongratulationsPage";
import IntroScreen from "./components/IntroScreen";
import IntroVideo from "./components/IntroVideo";
import SuccessScreen from "./components/SuccessScreen";
import ClubBrand from "./components/ClubBrand";
import { TOTAL_LEVELS } from "./data/categories";
import { LEVEL_QUESTION_BANKS } from "./data/levelQuestionBanks";
import "./styles.css";

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

const getQuestionBank = (level) => LEVEL_QUESTION_BANKS[level];

const getPlayableQuestions = (levelBank) =>
  (levelBank || []).filter((q) => ALLOWED_CATEGORIES.includes(q.category));

const getRandomQuestion = (levelBank, previousQuestionId = null, usedQuestionIds = []) => {
  const playable = getPlayableQuestions(levelBank);
  if (!playable || playable.length === 0) return null;
  if (playable.length === 1) return playable[0];

  const exclusions = new Set(
    [previousQuestionId, ...(usedQuestionIds || [])].filter(Boolean)
  );

  const pool = playable.filter((q) => !exclusions.has(q.id));
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const fallbackPool = previousQuestionId
    ? playable.filter((q) => q.id !== previousQuestionId)
    : playable;

  const candidatePool = fallbackPool.length > 0 ? fallbackPool : playable;
  return candidatePool[Math.floor(Math.random() * candidatePool.length)];
};

const getQuestionById = (level, id) => {
  const bank = getQuestionBank(level);
  if (!bank) return null;
  return bank.find((q) => q.id === id) || null;
};

const loadInitialState = () => {
  // 1. Try to restore active session from sessionStorage
  try {
    const rawSession = sessionStorage.getItem("lockedFilesSession");
    if (rawSession !== null) {
      const parsed = JSON.parse(rawSession);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.gameStarted === true &&
        typeof parsed.currentLevel === "number" &&
        parsed.currentLevel >= 1 &&
        parsed.currentLevel <= TOTAL_LEVELS &&
        typeof parsed.currentQuestionId === "string"
      ) {
        const question = getQuestionById(parsed.currentLevel, parsed.currentQuestionId);
        if (question) {
          return {
            gameStarted: true,
            stage: parsed.stage || "challenge",
            currentLevel: parsed.currentLevel,
            currentQuestion: question,
            userAnswer: parsed.userAnswer || "",
            attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
            message: parsed.message || "",
            isResetModalOpen: !!parsed.isResetModalOpen,
            showFinalContinueMessage: !!parsed.showFinalContinueMessage,
            gameComplete: false
          };
        }
      }
      // If parsed but failed validation, remove the invalid session
      sessionStorage.removeItem("lockedFilesSession");
    }
  } catch (err) {
    console.error("Failed to load saved state from sessionStorage:", err);
    try {
      sessionStorage.removeItem("lockedFilesSession");
    } catch (ignore) { }
  }

  // 2. Else check completion in localStorage
  try {
    const rawCompleted = localStorage.getItem("lockedFilesCompleted");
    if (rawCompleted !== null) {
      if (rawCompleted === "true") {
        return {
          gameStarted: false,
          stage: "congratulations",
          currentLevel: 1,
          currentQuestion: getRandomQuestion(getQuestionBank(1)),
          userAnswer: "",
          attempts: 0,
          message: "",
          isResetModalOpen: false,
          showFinalContinueMessage: false,
          gameComplete: true
        };
      } else {
        // Invalid completion value
        localStorage.removeItem("lockedFilesCompleted");
      }
    }
  } catch (err) {
    console.error("Failed to load completion from localStorage:", err);
    try {
      localStorage.removeItem("lockedFilesCompleted");
    } catch (ignore) { }
  }

  // 3. Fallback — intro video (new visit) or intro front page (video already seen)
  let introVideoPlayed = false;
  try {
    introVideoPlayed = sessionStorage.getItem("lockedFilesIntroVideoPlayed") === "true";
  } catch (err) {
    // ignore
  }

  return {
    gameStarted: false,
    stage: introVideoPlayed ? "intro" : "introVideo",
    currentLevel: 1,
    currentQuestion: getRandomQuestion(getQuestionBank(1)),
    userAnswer: "",
    attempts: 0,
    message: "",
    isResetModalOpen: false,
    showFinalContinueMessage: false,
    gameComplete: false
  };
};

export default function App() {
  const [initialState] = useState(() => loadInitialState());

  const [gameStarted, setGameStarted] = useState(initialState.gameStarted);
  const [stage, setStage] = useState(initialState.stage);
  const [currentLevel, setCurrentLevel] = useState(initialState.currentLevel);
  const [currentQuestion, setCurrentQuestion] = useState(initialState.currentQuestion);
  const [userAnswer, setUserAnswer] = useState(initialState.userAnswer);
  const [attempts, setAttempts] = useState(initialState.attempts);
  const [message, setMessage] = useState(initialState.message);
  const [isResetModalOpen, setIsResetModalOpen] = useState(initialState.isResetModalOpen);
  const [showFinalContinueMessage, setShowFinalContinueMessage] = useState(
    initialState.showFinalContinueMessage
  );
  const [usedQuestionIds, setUsedQuestionIds] = useState(initialState.usedQuestionIds || []);
  const [gameComplete, setGameComplete] = useState(initialState.gameComplete);

  useEffect(() => {
    if (stage === "congratulations") {
      try {
        localStorage.setItem("lockedFilesCompleted", "true");
        sessionStorage.removeItem("lockedFilesSession");
      } catch (err) {
        console.error("Failed to write to localStorage / remove from sessionStorage:", err);
      }
    } else if (gameStarted) {
      const stateToSave = {
        gameStarted: true,
        stage,
        currentLevel,
        currentQuestionId: currentQuestion?.id || "",
        usedQuestionIds,
        attempts,
        userAnswer,
        isResetModalOpen,
        message,
        showFinalContinueMessage,
        gameComplete: false
      };
      try {
        sessionStorage.setItem("lockedFilesSession", JSON.stringify(stateToSave));
      } catch (err) {
        console.error("Failed to save session state to sessionStorage:", err);
      }
    } else {
      try {
        sessionStorage.removeItem("lockedFilesSession");
      } catch (err) {
        // ignore
      }
    }
  }, [
    gameStarted,
    stage,
    currentLevel,
    currentQuestion,
    attempts,
    userAnswer,
    isResetModalOpen,
    message,
    showFinalContinueMessage
  ]);

  const prepareLevel = (level, prevQId = null, activeUsedQuestionIds = []) => {
    setCurrentLevel(level);
    const nextQuestion = getRandomQuestion(getQuestionBank(level), prevQId, activeUsedQuestionIds);
    setCurrentQuestion(nextQuestion);
    setUserAnswer("");
    setAttempts(0);
    setMessage("");
    setIsResetModalOpen(false);
    setShowFinalContinueMessage(false);
    if (nextQuestion) {
      setUsedQuestionIds((prevIds) => {
        const ids = prevIds || activeUsedQuestionIds || [];
        return ids.includes(nextQuestion.id) ? ids : [...ids, nextQuestion.id];
      });
    }
  };

  const startChallenge = () => {
    setGameStarted(true);
    setGameComplete(false);
    setUsedQuestionIds([]);
    prepareLevel(1, null, []);
    setStage("challenge");
  };

  const submitAnswer = (event) => {
    event.preventDefault();

    if (isResetModalOpen) {
      return;
    }

    if (!userAnswer || !userAnswer.trim()) {
      return;
    }

    const isCorrect = checkAnswer(
      userAnswer,
      currentQuestion.answer,
      currentQuestion.acceptedAnswers
    );

    if (isCorrect) {
      setMessage("");
      setIsResetModalOpen(false);
      setShowFinalContinueMessage(false);
      if (currentLevel === TOTAL_LEVELS) {
        setStage("congratulations");
        setGameComplete(true);
      } else {
        setStage("levelComplete");
      }
      return;
    }

    const nextAttempt = attempts + 1;
    setAttempts(nextAttempt);

    if (nextAttempt >= 2) {
      setMessage("");
      setIsResetModalOpen(true);
    } else {
      setMessage("ACCESS DENIED — 1 ATTEMPT REMAINING");
    }
  };

  const confirmNewChallenge = () => {
    const newQ = getRandomQuestion(
      getQuestionBank(currentLevel),
      currentQuestion?.id,
      usedQuestionIds
    );
    if (!newQ) return;
    setCurrentQuestion(newQ);
    setUserAnswer("");
    setAttempts(0);
    setMessage("");
    setIsResetModalOpen(false);
    setUsedQuestionIds((prevIds) => {
      const ids = prevIds || [];
      return ids.includes(newQ.id) ? ids : [...ids, newQ.id];
    });
  };

  const continueToNextLevel = () => {
    if (currentLevel >= TOTAL_LEVELS) {
      setStage("congratulations");
      setGameComplete(true);
      return;
    }
    const nextLevel = currentLevel + 1;
    prepareLevel(nextLevel, currentQuestion?.id, usedQuestionIds);
    setStage("challenge");
  };

  const continueMission = () => {
    setStage("congratulations");
    setGameComplete(true);
  };

  const restart = () => {
    try {
      localStorage.removeItem("lockedFilesCompleted");
      sessionStorage.removeItem("lockedFilesSession");
    } catch (err) {
      // ignore
    }
    setGameStarted(true);
    setGameComplete(false);
    setUsedQuestionIds([]);
    prepareLevel(1, null, []);
    setStage("challenge");
  };

  const handleIntroVideoComplete = () => {
    try {
      sessionStorage.setItem("lockedFilesIntroVideoPlayed", "true");
    } catch (err) {
      // ignore
    }
    setStage("intro");
  };

  return (
    <main className="app-shell">
      <div className="scanlines" />
      <header className="topbar">
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="brand-mark">LF</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <ClubBrand className="topbar-club-brand" />
            <span style={{ fontWeight: 700, fontSize: "12px", letterSpacing: "2px" }}>LOCKED FILES</span>
          </div>
        </div>
        <div className="status">
          <span className="status-dot" />
          SECURE SYSTEM
        </div>
      </header>

      {stage === "introVideo" && <IntroVideo onComplete={handleIntroVideoComplete} />}

      <section className={`hero${stage === "intro" ? " hero--intro-enter" : ""}`}>
        {stage === "intro" && <IntroScreen onStart={startChallenge} />}

        {stage === "challenge" && (
          <ChallengeScreen
            attempts={attempts}
            currentLevel={currentLevel}
            currentQuestion={currentQuestion}
            isResetModalOpen={isResetModalOpen}
            userAnswer={userAnswer}
            message={message}
            onConfirmNewChallenge={confirmNewChallenge}
            onUserAnswerChange={setUserAnswer}
            onSubmit={submitAnswer}
            totalLevels={TOTAL_LEVELS}
          />
        )}

        {stage === "levelComplete" && (
          <SuccessScreen
            currentLevel={currentLevel}
            mode="level"
            onContinue={continueToNextLevel}
            onRestart={restart}
            showFinalContinueMessage={false}
            totalLevels={TOTAL_LEVELS}
          />
        )}

        {stage === "congratulations" && (
          <CongratulationsPage onRestart={restart} />
        )}
      </section>

      <footer>
        LOCKED FILES <span>•</span> THINK. DECODE. UNLOCK.
      </footer>
    </main>
  );
}
