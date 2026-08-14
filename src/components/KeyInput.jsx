import React, { useRef } from "react";

export default function KeyInput({ keyInput, onChange, onSubmit }) {
  const keyInputRef = useRef(null);

  return (
    <form className="key-form" onSubmit={onSubmit}>
      <label>ENTER UNLOCKING KEY</label>

      <div
        className="key-slots"
        onClick={() => keyInputRef.current?.focus()}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            className={`key-slot ${
              keyInput.length === index ? "active-slot" : ""
            }`}
            key={index}
          >
            {keyInput[index] || ""}
          </div>
        ))}
      </div>

      <input
        ref={keyInputRef}
        id="key"
        className="hidden-key-input"
        value={keyInput}
        onChange={(event) =>
          onChange(
            event.target.value
              .toUpperCase()
              .replace(/[^A-Z]/g, "")
              .slice(0, 5)
          )
        }
        maxLength={5}
        minLength={5}
        pattern="[A-Z]{5}"
        inputMode="text"
        autoComplete="off"
        spellCheck="false"
        aria-label="Enter five character unlocking key"
      />

      <div className="key-example">
        Example: <strong>ABCDE</strong>
      </div>

      <button className="primary-btn unlock-btn" type="submit">
        UNLOCK
      </button>
    </form>
  );
}
