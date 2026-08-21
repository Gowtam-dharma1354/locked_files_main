/**
 * Question Paper Selector
 * Central function for determining the correct question paper based on batch and file number
 * This implements the critical batch-specific question logic
 *
 * Rules:
 * - Files 01-04: ALL batches receive the four questions from COMMON_FILE_01
 * - Files 01-09: ALL batches receive the common questions from COMMON_FILE_01
 * - Files 10-19: Batch-specific papers with group-based sharing
 * - File 20: ALL batches receive the common final question
 *   - PGDM 1st Year: GROUP A (own paper)
 *   - LLM: GROUP B (own paper)
 *   - PGDM 2nd Year + PGPISM: GROUP C (SHARED paper)
 */

import { COMMON_FILE_01 } from "./questionPapers/common/file01";
import { COMMON_FILE_20 } from "./questionPapers/common/file20";
import { PGDM1_FILE05 } from "./questionPapers/pgdm1/file10";
import { PGDM1_FILE06 } from "./questionPapers/pgdm1/file11";
import { PGDM1_FILE07 } from "./questionPapers/pgdm1/file12";
import { PGDM1_FILE08 } from "./questionPapers/pgdm1/file13";
import { PGDM1_FILE09 } from "./questionPapers/pgdm1/file14";
import { PGDM1_FILE10 } from "./questionPapers/pgdm1/file15";
import { PGDM1_FILE11 } from "./questionPapers/pgdm1/file16";
import { PGDM1_FILE12 } from "./questionPapers/pgdm1/file17";
import { PGDM1_FILE13 } from "./questionPapers/pgdm1/file18";
import { PGDM1_FILE14 } from "./questionPapers/pgdm1/file19";
import { LLM_FILE05 } from "./questionPapers/llm/file10";
import { LLM_FILE06 } from "./questionPapers/llm/file11";
import { LLM_FILE07 } from "./questionPapers/llm/file12";
import { LLM_FILE08 } from "./questionPapers/llm/file13";
import { LLM_FILE09 } from "./questionPapers/llm/file14";
import { LLM_FILE10 } from "./questionPapers/llm/file15";
import { LLM_FILE11 } from "./questionPapers/llm/file16";
import { LLM_FILE12 } from "./questionPapers/llm/file17";
import { LLM_FILE13 } from "./questionPapers/llm/file18";
import { LLM_FILE14 } from "./questionPapers/llm/file19";
import { PGDM2_PGPISM_FILE05 } from "./questionPapers/pgdm2_pgpism/file10";
import { PGDM2_PGPISM_FILE06 } from "./questionPapers/pgdm2_pgpism/file11";
import { PGDM2_PGPISM_FILE07 } from "./questionPapers/pgdm2_pgpism/file12";
import { PGDM2_PGPISM_FILE08 } from "./questionPapers/pgdm2_pgpism/file13";
import { PGDM2_PGPISM_FILE09 } from "./questionPapers/pgdm2_pgpism/file14";
import { PGDM2_PGPISM_FILE10 } from "./questionPapers/pgdm2_pgpism/file15";
import { PGDM2_PGPISM_FILE11 } from "./questionPapers/pgdm2_pgpism/file16";
import { PGDM2_PGPISM_FILE12 } from "./questionPapers/pgdm2_pgpism/file17";
import { PGDM2_PGPISM_FILE13 } from "./questionPapers/pgdm2_pgpism/file18";
import { PGDM2_PGPISM_FILE14 } from "./questionPapers/pgdm2_pgpism/file19";

/**
 * Get the appropriate question paper for a given batch and file number
 *
 * @param {string} batch - The batch code (PGDM_1, PGDM_2, PGPISM, or LLM)
 * @param {number} fileNumber - The file number (1-20)
 * @returns {array} Array of questions for this paper
 */
export const getQuestionPaper = (batch, fileNumber) => {
  // Files 01-09 are common for all batches, one question per file.
  const normalizedFileNumber = Number(fileNumber);
  if (normalizedFileNumber === 20) {
    return COMMON_FILE_20;
  }
  if (normalizedFileNumber >= 1 && normalizedFileNumber <= 9) {
    return COMMON_FILE_01[normalizedFileNumber - 1]
      ? [COMMON_FILE_01[normalizedFileNumber - 1]]
      : [];
  }

  // Files 10-19 use the batch-specific paper group.
  switch (normalizeBatch(batch)) {
    case "PGDM1":
      return getPGDM1Paper(normalizedFileNumber);
    case "PGDM2":
      return getPGDM2_PGPISMPaper(normalizedFileNumber);
    case "PGPISM":
      return getPGDM2_PGPISMPaper(normalizedFileNumber);
    case "LLM":
      return getLLMPaper(normalizedFileNumber);
    default:
      return [];
  }
};

const normalizeBatch = (batch) => String(batch || "")
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "");

/**
 * Get PGDM 1st Year (Group A) question paper
 */
const getPGDM1Paper = (fileNumber) => {
  const pgdm1Papers = {
    10: PGDM1_FILE05,
    11: PGDM1_FILE06,
    12: PGDM1_FILE07,
    13: PGDM1_FILE08,
    14: PGDM1_FILE09,
    15: PGDM1_FILE10,
    16: PGDM1_FILE11,
    17: PGDM1_FILE12,
    18: PGDM1_FILE13,
    19: PGDM1_FILE14
  };
  return pgdm1Papers[fileNumber] || [];
};

/**
 * Get LLM (Group B) question paper
 */
const getLLMPaper = (fileNumber) => {
  const llmPapers = {
    10: LLM_FILE05,
    11: LLM_FILE06,
    12: LLM_FILE07,
    13: LLM_FILE08,
    14: LLM_FILE09,
    15: LLM_FILE10,
    16: LLM_FILE11,
    17: LLM_FILE12,
    18: LLM_FILE13,
    19: LLM_FILE14
  };
  return llmPapers[fileNumber] || [];
};

/**
 * Get PGDM 2nd Year + PGPISM (Group C) question paper
 * SHARED by both PGDM_2 and PGPISM
 */
const getPGDM2_PGPISMPaper = (fileNumber) => {
  const groupCPapers = {
    10: PGDM2_PGPISM_FILE05,
    11: PGDM2_PGPISM_FILE06,
    12: PGDM2_PGPISM_FILE07,
    13: PGDM2_PGPISM_FILE08,
    14: PGDM2_PGPISM_FILE09,
    15: PGDM2_PGPISM_FILE10,
    16: PGDM2_PGPISM_FILE11,
    17: PGDM2_PGPISM_FILE12,
    18: PGDM2_PGPISM_FILE13,
    19: PGDM2_PGPISM_FILE14
  };
  return groupCPapers[fileNumber] || [];
};

/**
 * Get the batch group for a given batch
 * Used to determine which paper grouping to use
 */
export const getBatchGroup = (batch) => {
  const groupMap = {
    PGDM1: "GROUP_A",
    PGDM2: "GROUP_C",
    PGPISM: "GROUP_C",
    LLM: "GROUP_B"
  };
  return groupMap[normalizeBatch(batch)] || "COMMON";
};
