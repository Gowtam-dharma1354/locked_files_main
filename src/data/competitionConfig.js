/**
 * Competition Configuration
 * This file centralizes configurable competition settings.
 * Designed to eventually receive these values from Supabase backend.
 */

export const COMPETITION_CONFIG = {
  // Total number of common questions in the competition.
  TOTAL_FILES: 10,

  // Event branding
  EVENT_NAME: "LOCKED FILES",
  CLUB_NAME: "NISM",
  CLUB_FULL_NAME: "FinTech & Quant Club",

  // Batches participating
  BATCHES: [
    { value: "PGDM_1", label: "PGDM 1st Year" },
    { value: "PGDM_2", label: "PGDM 2nd Year" },
    { value: "PGPISM", label: "PGPISM" },
    { value: "LLM", label: "LLM" }
  ],

  // All batches use the common question paper.
  BATCH_GROUPS: {
    PGDM_1: "group_a",
    PGDM_2: "group_c",
    PGPISM: "group_c",
    LLM: "group_b"
  },

  // Timer configuration (in seconds)
  // Will eventually come from Supabase with actual start/end times
  TIMER_DURATION_SECONDS: 90 * 60, // 90 minutes

  // Competition rules
  UNLIMITED_ATTEMPTS: true,
  QUESTIONS_PER_FILE: 1
};
