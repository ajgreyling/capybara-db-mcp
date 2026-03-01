# capybara-db-mcp Documentation

## ⚠️ Production & Governance Notice

This project is intended for development, sandbox, or formally reviewed environments. Before connecting to any production system:

- Conduct a security review
- Validate data classification and handling requirements
- Ensure compliance with internal AI and data governance policies
- Confirm logging, auditing, and DLP controls are in place

This project is designed to reduce the likelihood of exposing query results to LLMs, but it does not replace enterprise security controls and should not be used to bypass governance processes.

Documentation for **capybara-db-mcp** (fork of [DBHub](https://github.com/bytebase/dbhub)). For upstream docs see [dbhub.ai](https://dbhub.ai).

## Security Model Overview

- **LLM generates SQL** via the MCP client.
- **Server validates SQL** using read-only SQL validation intended to restrict execution to statements such as SELECT, WITH, EXPLAIN, and SHOW.
- **Query executes** against the configured database.
- **Results are written locally** to `.safe-sql-results/` and opened in the editor (configurable).
- **Tool response is metadata-oriented** and is formatted to avoid returning raw query results in the response payload.

This design reduces the likelihood of transmitting result data to an LLM, but it does not eliminate operational, environment, or governance risks. Database-level RBAC, auditing, and approved operating procedures remain required.

## Controls (risk-reduction)

- **Read-only enforcement**: SQL validation is intended to restrict execution to read-only statements; it reduces the risk of accidental writes but does not replace database-level permissions or RBAC.
- **Output isolation**: Query results are written to `.safe-sql-results/` and opened in the editor; tool responses are formatted to avoid including result sets (including file paths, row data, row counts, and column names).
- **Error response hardening**: Tool error payloads are formatted to avoid including SQL statements and parameter values; diagnostic details are logged locally and database error messages are truncated.

Install the [Mintlify CLI](https://www.npmjs.com/package/mint) to preview documentation locally:

```bash
npm i -g mint
```

Run the following command at the root of your documentation (where `docs.json` is located):

```bash
cd docs
mint dev
```
