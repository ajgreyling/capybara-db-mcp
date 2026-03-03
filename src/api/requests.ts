import { Request as ExpressRequest, Response } from "express";
import { requestStore } from "../requests/index.js";

const REDACTED = "[redacted]";

/**
 * Redact sensitive fields before API response (PII-safe).
 */
function redactRequest(r: { sql?: string; error?: string; [k: string]: unknown }) {
  const out = { ...r };
  if (out.sql !== undefined) out.sql = REDACTED;
  if (out.error !== undefined) out.error = REDACTED;
  return out;
}

/**
 * GET /api/requests
 * GET /api/requests?source_id=prod_pg
 * List tracked requests, optionally filtered by source.
 * SQL and error text are redacted in responses.
 */
export function listRequests(req: ExpressRequest, res: Response): void {
  try {
    const sourceId = req.query.source_id as string | undefined;
    const requests = requestStore.getAll(sourceId).map(redactRequest);

    res.json({
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error("Error listing requests:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
