import { ConnectorType } from "../connectors/interface.js";
import { stripCommentsAndStrings } from "./sql-parser.js";

/**
 * List of allowed leading keywords for SQL queries
 * Not only SELECT queries are allowed,
 * but also other queries that are not destructive
 */
export const allowedKeywords: Record<ConnectorType, string[]> = {
  postgres: ["select", "with", "explain", "analyze", "show"],
  mysql: ["select", "with", "explain", "analyze", "show", "describe", "desc"],
  mariadb: ["select", "with", "explain", "analyze", "show", "describe", "desc"],
  sqlite: ["select", "with", "explain", "analyze", "pragma"],
  sqlserver: ["select", "with", "explain", "showplan"],
};

/** Forbidden keywords anywhere in statement (e.g. inside CTE, after EXPLAIN) */
const FORBIDDEN_KEYWORDS =
  /\b(insert|update|delete|merge|replace|drop|create|alter|truncate)\b/;

/** MySQL/MariaDB: SELECT INTO OUTFILE/DUMPFILE writes to file */
const FORBIDDEN_PHRASES_MYSQL = /\binto\s+(outfile|dumpfile)\b/;

/**
 * Check if a SQL query is read-only.
 * - First keyword must be in allowed list
 * - Full statement must not contain write keywords (blocks CTE/EXPLAIN bypasses)
 * - MySQL/MariaDB: must not contain INTO OUTFILE/DUMPFILE
 * @param sql The SQL query to check
 * @param connectorType The database type to check against
 * @returns True if the query is read-only
 */
export function isReadOnlySQL(sql: string, connectorType: ConnectorType | string): boolean {
  const cleanedSQL = stripCommentsAndStrings(sql).trim().toLowerCase();

  if (!cleanedSQL) {
    return true;
  }

  const firstWord = cleanedSQL.split(/\s+/)[0];
  const keywordList = allowedKeywords[connectorType as ConnectorType] || [];

  if (!keywordList.includes(firstWord)) {
    return false;
  }

  if (FORBIDDEN_KEYWORDS.test(cleanedSQL)) {
    return false;
  }

  if ((connectorType === "mysql" || connectorType === "mariadb") && FORBIDDEN_PHRASES_MYSQL.test(cleanedSQL)) {
    return false;
  }

  return true;
}
