import React from "react";

export default function ClubBrand({ className = "" }) {
  return (
    <div className={`club-brand ${className}`}>
      <div className="club-brand-top">NISM</div>
      <div className="club-brand-sub">FinTech & Quant Club</div>
      <div className="club-brand-lock">LOCKED FILES</div>
    </div>
  );
}
