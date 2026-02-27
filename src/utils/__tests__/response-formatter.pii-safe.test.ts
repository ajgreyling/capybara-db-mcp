import { describe, it, expect } from "vitest";
import { createPiiSafeToolResponse } from "../response-formatter.js";

describe("createPiiSafeToolResponse", () => {
  it("returns only file_path to prevent exfiltration via column aliasing", () => {
    const response = createPiiSafeToolResponse({
      file_path: "/tmp/.safe-sql-results/result.csv",
    });

    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].mimeType).toBe("application/json");

    const payload = JSON.parse(response.content[0].text);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({ file_path: "/tmp/.safe-sql-results/result.csv" });
    expect(payload.data.rows).toBeUndefined();
    expect(payload.data.columns).toBeUndefined();
    expect(payload.data.count).toBeUndefined();
  });
});
