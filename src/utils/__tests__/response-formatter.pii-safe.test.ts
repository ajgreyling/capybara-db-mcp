import { describe, it, expect } from "vitest";
import { createPiiSafeToolResponse, createGenericToolErrorResponse } from "../response-formatter.js";

describe("createGenericToolErrorResponse", () => {
  it("returns generic message (no DB-derived text) for EXECUTION_ERROR", () => {
    const response = createGenericToolErrorResponse("EXECUTION_ERROR");
    const payload = JSON.parse(response.content[0].text);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Execution failed. See server logs for details.");
    expect(payload.code).toBe("EXECUTION_ERROR");
    expect(payload.error).not.toMatch(/connection refused|syntax error|column/i);
  });

  it("returns generic message for SEARCH_ERROR", () => {
    const response = createGenericToolErrorResponse("SEARCH_ERROR");
    const payload = JSON.parse(response.content[0].text);
    expect(payload.error).toBe("Search failed. See server logs for details.");
    expect(payload.code).toBe("SEARCH_ERROR");
  });
});

describe("createPiiSafeToolResponse", () => {
  it("returns success only (no file_path) to prevent exfiltration via column aliasing", () => {
    const response = createPiiSafeToolResponse();

    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].mimeType).toBe("application/json");

    const payload = JSON.parse(response.content[0].text);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({});
    expect(payload.data.file_path).toBeUndefined();
    expect(payload.data.rows).toBeUndefined();
    expect(payload.data.columns).toBeUndefined();
    expect(payload.data.count).toBeUndefined();
  });
});
