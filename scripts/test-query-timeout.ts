#!/usr/bin/env tsx
/**
 * Test that the MCP server times out long-running queries after 60 seconds.
 *
 * Usage:
 *   DSN="postgres://user:pass@localhost:5432/dbname?sslmode=disable" pnpm run test:query-timeout
 *   pnpm run test:query-timeout "postgres://user:pass@localhost:5432/dbname?sslmode=disable"
 *
 * Requires a PostgreSQL instance (local or remote). The query SELECT pg_sleep(120) will
 * run for up to 60 seconds before the default timeout cancels it.
 *
 * Prerequisites: pnpm install, PostgreSQL must be reachable.
 */
import { spawn, ChildProcess } from 'child_process';

const PORT = 3013;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetch(`${BASE_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'ping', method: 'notifications/initialized' }),
      });
      if (res.status < 500) return true;
    } catch {
      /* not ready */
    }
  }
  return false;
}

async function callExecuteSql(sql: string): Promise<{ response: any; durationMs: number }> {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'timeout-test',
      method: 'tools/call',
      params: { name: 'execute_sql', arguments: { sql } },
    }),
  });
  const body = await res.json();
  const durationMs = Date.now() - start;
  return { response: body, durationMs };
}

async function main(): Promise<void> {
  const dsn = process.argv[2] || process.env.DSN;
  if (!dsn) {
    console.error('Usage: DSN="postgres://..." pnpm run test:query-timeout');
    console.error('   or: pnpm run test:query-timeout "postgres://user:pass@host:5432/db?sslmode=disable"');
    process.exit(1);
  }

  if (!dsn.startsWith('postgres://') && !dsn.startsWith('postgresql://')) {
    console.error('This test requires PostgreSQL (SQLite has no query timeout).');
    process.exit(1);
  }

  const dsnWithSsl = dsn.includes('sslmode=')
    ? dsn
    : dsn.includes('?')
      ? `${dsn}&sslmode=disable`
      : `${dsn}?sslmode=disable`;

  console.log('Starting MCP server with 60s default query timeout...');
  const serverProcess: ChildProcess = spawn('pnpm', [
    'run',
    'dev:backend',
    '--',
    `--dsn=${dsnWithSsl}`,
    '--transport',
    'http',
    '--port',
    String(PORT),
  ], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'pipe',
  });

  serverProcess.stdout?.on('data', (d) => process.stdout.write(d));
  serverProcess.stderr?.on('data', (d) => process.stderr.write(d));

  const ready = await waitForServer();
  if (!ready) {
    console.error('Server did not start within expected time');
    serverProcess.kill('SIGTERM');
    process.exit(1);
  }

  console.log('Server ready. Running SELECT pg_sleep(120) (expect ~60s timeout)...');
  const { response, durationMs } = await callExecuteSql('SELECT pg_sleep(120)');

  serverProcess.kill('SIGTERM');
  await new Promise<void>((r) => {
    serverProcess.on('exit', () => r());
    setTimeout(() => r(), 3000);
  });

  const content = response?.result?.content?.[0]?.text
    ? JSON.parse(response.result.content[0].text)
    : null;

  if (!content) {
    console.error('Unexpected response:', JSON.stringify(response, null, 2));
    process.exit(1);
  }

  const ok =
    content.success === false &&
    content.error_code === 'EXECUTION_ERROR' &&
    durationMs >= 55000 &&
    durationMs < 90000;

  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`Query failed as expected: ${content.success === false}`);
  console.log(`Error: ${content.error ?? 'N/A'}`);
  if (ok) {
    console.log('\n✓ Query timed out after ~60s as expected. MCP server behaves correctly.');
    process.exit(0);
  }
  console.error('\n✗ Test failed: expected timeout after ~60s');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
