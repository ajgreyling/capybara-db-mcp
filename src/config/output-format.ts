import type { ResultFormat } from "./env.js";

let outputFormat: ResultFormat = "csv";

export function setOutputFormat(format: ResultFormat): void {
  outputFormat = format;
}

export function getOutputFormat(): ResultFormat {
  return outputFormat;
}
