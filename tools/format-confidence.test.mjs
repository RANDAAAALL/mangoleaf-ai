import { expect, test } from "bun:test";
import { formatConfidence } from "../src/lib/format-confidence";

test("confidence rounds down to at most one decimal and omits trailing zeros", () => {
  for (const [score, percentage] of [
    [0, "0%"],
    [0.62, "62%"],
    [0.621, "62.1%"],
    [0.695, "69.5%"],
    [0.698, "69.8%"],
    [0.69999, "69.9%"],
    [Math.fround(0.7), "69.9%"],
    [0.7, "70%"],
    [0.700001, "70%"],
    [0.7189, "71.8%"],
    [1, "100%"],
  ]) {
    expect(formatConfidence(score)).toBe(percentage);
  }
});
