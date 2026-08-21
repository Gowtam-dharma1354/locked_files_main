/**
 * Competition Configuration
 * This file centralizes configurable competition settings.
 * Designed to eventually receive these values from Supabase backend.
 */

export const COMPETITION_CONFIG = {
  // Total number of files in the competition
  // Files 01-09 are common, Files 10-19 are department-specific, and File 20 is common.
  TOTAL_FILES: 20,

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

  // Batch grouping for question papers from File 05 onward
  // Files 01-04 are always COMMON for all batches
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
