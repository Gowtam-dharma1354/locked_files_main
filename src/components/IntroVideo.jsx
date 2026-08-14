import React, { useCallback, useEffect, useRef, useState } from "react";
import { INTRO_VIDEO } from "../config";

const FALLBACK_TIMEOUT_MS = 15000;
const TRANSITION_MS = 1200;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export default function IntroVideo({ onComplete }) {
  const videoRef = useRef(null);
  const finishCalledRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [exiting, setExiting] = useState(false);
  // "idle" = waiting for click, "playing" = playing
  const [playState, setPlayState] = useState("idle");

  const transitionMs = prefersReducedMotion ? 0 : TRANSITION_MS;

  const finishIntro = useCallback(() => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    setExiting(true);
    window.setTimeout(onComplete, transitionMs);
  }, [onComplete, transitionMs]);

  const handleEnded = useCallback(() => {
    finishIntro();
  }, [finishIntro]);

  const handleError = useCallback(() => {
    window.setTimeout(finishIntro, 1500);
  }, [finishIntro]);

  // Attempt autoplay (muted) as soon as the video is ready.
  // If the browser allows it (muted autoplay is always permitted),
  // the video plays silently. On user click we unmute and restart from current position.
  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // Muted autoplay is universally allowed — gives us a "loaded + playing" base
    video.muted = true;
    video.play().catch(() => {
      // Even muted autoplay blocked (rare) — wait for user click
    });
  }, []);

  // Clicking anywhere on the overlay unmutes and/or starts the video with sound
  const handleOverlayClick = useCallback(() => {
    const video = videoRef.current;
    if (!video || playState === "playing") return;

    video.muted = false;

    const doPlay = () => {
      video.play()
        .then(() => setPlayState("playing"))
        .catch(() => {
          // Fallback: just proceed
          finishIntro();
        });
    };

    if (video.paused) {
      doPlay();
    } else {
      // Already playing muted — unmute in place
      setPlayState("playing");
    }
  }, [playState, finishIntro]);

  // Fallback: advance automatically if nothing happens
  useEffect(() => {
    const id = window.setTimeout(finishIntro, FALLBACK_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [finishIntro]);

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events */
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    <div
      className={`intro-video-overlay${exiting ? " intro-video-overlay--exiting" : ""}`}
      style={{ "--intro-transition-ms": `${transitionMs}ms`, cursor: playState === "idle" ? "pointer" : "default" }}
      aria-label="Event intro video — click to begin"
      role="button"
      tabIndex={0}
      onClick={handleOverlayClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOverlayClick(); }}
    >
      <video
        ref={videoRef}
        className="intro-video-player"
        src={INTRO_VIDEO}
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
      />
    </div>
  );
}
