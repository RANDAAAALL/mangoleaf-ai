/** Round the percentage down to at most one decimal without changing the score. */
export function formatConfidence(confidence: number): string {
  return `${Math.floor(confidence * 1000) / 10}%`;
}
