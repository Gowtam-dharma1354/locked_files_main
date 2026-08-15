/**
 * FileProgress Component
 * Shows visual progress through all files
 * Indicates completed, current, and locked files
 * Dynamically supports 10-15 files (configurable)
 */

import React from "react";
import "./FileProgress.css";

export default function FileProgress({ currentFile, totalFiles, completedFiles }) {
  const renderProgressItems = () => {
    const items = [];
    
    for (let i = 1; i <= totalFiles; i++) {
      let status = "locked";
      let symbol = "🔒";

      if (i < currentFile) {
        status = "completed";
        symbol = "✓";
      } else if (i === currentFile) {
        status = "current";
        symbol = "●";
      }

      items.push(
        <div key={i} className={`progress-item progress-${status}`} title={`File ${i}`}>
          <span className="progress-symbol">{symbol}</span>
          <span className="progress-number">{String(i).padStart(2, "0")}</span>
        </div>
      );
    }

    return items;
  };

  return (
    <div className="file-progress">
      <div className="progress-header">
        <h3 className="progress-title">FILE PROGRESS</h3>
        <div className="progress-counter">
          {currentFile - 1} / {totalFiles} FILES COMPLETED
        </div>
      </div>
      <div className="progress-track">
        {renderProgressItems()}
      </div>
    </div>
  );
}
