/**
 * Question Paper Selector
 * Central function for retrieving the common question paper.
 *
 * Every batch receives the same questions from COMMON_FILE_01.
 */

import { PGDM2_PGPISM_HARD_QUESTIONS } from "./questionPapers/common/file01";

/**
 * Get the appropriate question paper for a given batch and file number
 *
 * @param {string} batch - The batch code (kept for API compatibility)
 * @param {number} fileNumber - The common question number
 * @returns {array} Array of questions for this paper
 */
export const getQuestionPaper = (batch, fileNumber) => {
  const normalizedFileNumber = Number(fileNumber);
  return normalizedFileNumber >= 1 && normalizedFileNumber <= PGDM2_PGPISM_HARD_QUESTIONS.length
    ? [PGDM2_PGPISM_HARD_QUESTIONS[normalizedFileNumber - 1]]
    : [];
};

/**
 * Get the batch group for a given batch
 * Used to determine which paper grouping to use
 */
export const getBatchGroup = (batch) => {
  return "COMMON";
};
