# safe-sql-mcp Documentation

Documentation for **safe-sql-mcp** (fork of [DBHub](https://github.com/bytebase/dbhub)). For upstream docs see [dbhub.ai](https://dbhub.ai).

**safe-sql-mcp is unconditionally read-only.** Only read-only SQL (SELECT, WITH, EXPLAIN, SHOW, etc.) is allowed. Write operations (UPDATE, DELETE, INSERT, MERGE, etc.) are never permitted. SQL queries use a safe default timeout of 60 seconds (overridable per source via `query_timeout` in TOML configuration).

**safe-sql-mcp is PII-safe.** Query results are never sent to the LLM. Actual data is written to `.safe-sql-results/`; the LLM receives only success/failure and the file path (no row count or column names to prevent exfiltration). This prevents personally identifiable information from ever reaching the model.

Install the [Mintlify CLI](https://www.npmjs.com/package/mint) to preview documentation locally:

```bash
npm i -g mint
```

Run the following command at the root of your documentation (where `docs.json` is located):

```bash
cd docs
mint dev
```
