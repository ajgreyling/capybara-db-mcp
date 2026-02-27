import { describe, it, expect } from "vitest";
import { createPiiSafeToolResponse } from "../response-formatter.js";

describe("createPiiSafeToolResponse", () => {
  it("returns metadata-only content for the LLM", () => {
    const response = createPiiSafeToolResponse({
      count: 3,
      columns: ["id", "email"],
      source_id: "default",
      file_path: "/tmp/.safe-sql-results/result.csv",
    });

    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].mimeType).toBe("application/json");

    // Explicitly test that no PII data is present in the response
    const payload = JSON.parse(response.content[0].text);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({
      count: 3,
      columns: ["id", "email"],
      source_id: "default",
      file_path: "/tmp/.safe-sql-results/result.csv",
    });
    expect(payload.data.rows).toBeUndefined();
  });
});
