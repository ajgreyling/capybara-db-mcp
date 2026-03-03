import { describe, it, expect } from "vitest";
import { isReadOnlySQL } from "../allowed-keywords.js";

describe("isReadOnlySQL", () => {
  describe("basic read-only detection", () => {
    it("should identify SELECT as read-only", () => {
      expect(isReadOnlySQL("SELECT * FROM users", "postgres")).toBe(true);
    });

    it("should identify WITH as read-only", () => {
      expect(isReadOnlySQL("WITH cte AS (SELECT 1) SELECT * FROM cte", "postgres")).toBe(true);
    });

    it("should identify EXPLAIN as read-only", () => {
      expect(isReadOnlySQL("EXPLAIN SELECT * FROM users", "postgres")).toBe(true);
    });

    it("should identify INSERT as not read-only", () => {
      expect(isReadOnlySQL("INSERT INTO users VALUES (1)", "postgres")).toBe(false);
    });

    it("should identify UPDATE as not read-only", () => {
      expect(isReadOnlySQL("UPDATE users SET name = 'test'", "postgres")).toBe(false);
    });

    it("should identify DELETE as not read-only", () => {
      expect(isReadOnlySQL("DELETE FROM users", "postgres")).toBe(false);
    });

    it("should identify MERGE as not read-only", () => {
      expect(isReadOnlySQL("MERGE INTO t USING s ON t.id = s.id WHEN MATCHED THEN UPDATE SET t.x = 1", "postgres")).toBe(false);
    });

    it("should identify REPLACE as not read-only for MySQL", () => {
      expect(isReadOnlySQL("REPLACE INTO users (id, name) VALUES (1, 'x')", "mysql")).toBe(false);
    });
  });

  describe("comment handling", () => {
    it("should detect read-only after stripping single-line comment", () => {
      const sql = "-- this is a comment\nSELECT * FROM users";
      expect(isReadOnlySQL(sql, "postgres")).toBe(true);
    });

    it("should detect read-only after stripping multi-line comment", () => {
      const sql = "/* INSERT */ SELECT * FROM users";
      expect(isReadOnlySQL(sql, "postgres")).toBe(true);
    });

    it("should detect non-read-only after stripping comment with SELECT", () => {
      const sql = "/* SELECT */ INSERT INTO users VALUES (1)";
      expect(isReadOnlySQL(sql, "postgres")).toBe(false);
    });

    it("should handle commented-out destructive statement before real read-only", () => {
      const sql = "-- DELETE FROM users\nSELECT * FROM users";
      expect(isReadOnlySQL(sql, "postgres")).toBe(true);
    });
  });

  describe("database-specific keywords", () => {
    it("should recognize SHOW as read-only for MySQL", () => {
      expect(isReadOnlySQL("SHOW TABLES", "mysql")).toBe(true);
    });

    it("should recognize DESCRIBE as read-only for MySQL", () => {
      expect(isReadOnlySQL("DESCRIBE users", "mysql")).toBe(true);
    });

    it("should recognize PRAGMA as read-only for SQLite", () => {
      expect(isReadOnlySQL("PRAGMA table_info(users)", "sqlite")).toBe(true);
    });

    it("should not recognize SHOW as read-only for SQLite", () => {
      expect(isReadOnlySQL("SHOW TABLES", "sqlite")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should treat empty SQL after comment stripping as read-only", () => {
      expect(isReadOnlySQL("-- just a comment", "postgres")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(isReadOnlySQL("select * from users", "postgres")).toBe(true);
      expect(isReadOnlySQL("SELECT * FROM users", "postgres")).toBe(true);
    });
  });

  describe("bypass prevention (CTE/EXPLAIN/INTO OUTFILE)", () => {
    it("should reject WITH CTE containing DELETE", () => {
      expect(isReadOnlySQL("WITH x AS (DELETE FROM users RETURNING id) SELECT * FROM x", "postgres")).toBe(false);
    });

    it("should reject WITH CTE containing INSERT", () => {
      expect(isReadOnlySQL("WITH x AS (INSERT INTO t SELECT 1 RETURNING *) SELECT * FROM x", "postgres")).toBe(false);
    });

    it("should reject EXPLAIN ANALYZE followed by write", () => {
      expect(isReadOnlySQL("EXPLAIN ANALYZE DELETE FROM users WHERE id = 1", "postgres")).toBe(false);
    });

    it("should reject EXPLAIN followed by UPDATE", () => {
      expect(isReadOnlySQL("EXPLAIN UPDATE users SET name = 'x'", "postgres")).toBe(false);
    });

    it("should allow EXPLAIN SELECT", () => {
      expect(isReadOnlySQL("EXPLAIN SELECT * FROM users", "postgres")).toBe(true);
    });

    it("should reject SELECT INTO OUTFILE for MySQL", () => {
      expect(isReadOnlySQL("SELECT * FROM users INTO OUTFILE '/tmp/u.csv'", "mysql")).toBe(false);
    });

    it("should reject SELECT INTO DUMPFILE for MySQL", () => {
      expect(isReadOnlySQL("SELECT * FROM users INTO DUMPFILE '/tmp/u.bin'", "mysql")).toBe(false);
    });

    it("should allow plain SELECT for MySQL", () => {
      expect(isReadOnlySQL("SELECT * FROM users", "mysql")).toBe(true);
    });
  });
});
