/**
 * Auth Flow Automation Test
 * Tests: Register → Login for a PASSENGER user under "test" organisation
 *
 * Usage:
 *   node tests/auth-flow.test.mjs
 *   node tests/auth-flow.test.mjs --base-url http://localhost:8081/api
 *
 * Requirements:
 *   - Backend running at BASE_URL
 *   - An organisation named "test" (case-insensitive) must exist in the DB
 *
 * Outputs:
 *   - Console logs (coloured)
 *   - tests/auth-flow-results-<timestamp>.json  (full log dump)
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const baseUrlFlag = args.indexOf('--base-url');
const BASE_URL = baseUrlFlag !== -1 ? args[baseUrlFlag + 1] : 'http://localhost:8081/api';
const TIMEOUT_MS = 10_000;

const RUN_ID = Date.now();
const TEST_EMAIL = `testuser_${RUN_ID}@test.com`;
const TEST_PASSWORD = 'TestPass@123';
const TEST_PHONE = '+15550000000';
const TEST_NAME = `AutoTest ${RUN_ID}`;

// ─── Logger ───────────────────────────────────────────────────────────────────

const ANSI = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  info:    '\x1b[36m',   // cyan
  success: '\x1b[32m',   // green
  warn:    '\x1b[33m',   // yellow
  error:   '\x1b[31m',   // red
  dim:     '\x1b[2m',
};

const logs = [];

function ts() {
  return new Date().toISOString();
}

function log(level, step, message, data = null) {
  const entry = { timestamp: ts(), level, step, message, data };
  logs.push(entry);

  const colour = { INFO: ANSI.info, SUCCESS: ANSI.success, WARN: ANSI.warn, ERROR: ANSI.error }[level] ?? ANSI.reset;
  const prefix = `${ANSI.dim}[${entry.timestamp}]${ANSI.reset} ${colour}${ANSI.bold}[${level}]${ANSI.reset} ${ANSI.bold}${step}${ANSI.reset}`;

  console.log(`${prefix} — ${message}`);
  if (data !== null) {
    const pretty = JSON.stringify(data, null, 2);
    console.log(`${ANSI.dim}${pretty}${ANSI.reset}`);
  }
}

function logInfo(step, msg, data)    { log('INFO',    step, msg, data); }
function logSuccess(step, msg, data) { log('SUCCESS', step, msg, data); }
function logWarn(step, msg, data)    { log('WARN',    step, msg, data); }
function logError(step, msg, data)   { log('ERROR',   step, msg, data); }

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

async function request(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  logInfo('HTTP', `${method} ${url}`, body ?? undefined);

  let response;
  let responseBody;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new RequestError(`Request timed out after ${TIMEOUT_MS}ms`, { url, method, timeout: TIMEOUT_MS });
    }
    throw new RequestError(`Network error: ${err.message}`, { url, method, cause: err.message });
  }

  clearTimeout(timer);

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    responseBody = await response.json();
  } else {
    responseBody = await response.text();
  }

  logInfo('HTTP', `← ${response.status} ${response.statusText}`, responseBody);

  if (!response.ok) {
    throw new RequestError(
      `HTTP ${response.status}: ${response.statusText}`,
      { url, method, status: response.status, responseBody }
    );
  }

  return { status: response.status, body: responseBody };
}

class RequestError extends Error {
  constructor(message, meta) {
    super(message);
    this.name = 'RequestError';
    this.meta = meta;
  }
}

// ─── Test Steps ───────────────────────────────────────────────────────────────

async function step_fetchOrganisations() {
  logInfo('STEP-1', 'Fetching organisations list');
  const { body } = await request('GET', '/organisations');

  const orgs = body?.data ?? body ?? [];
  if (!Array.isArray(orgs) || orgs.length === 0) {
    throw new Error('No organisations returned from API. Ensure the DB has at least one org named "test".');
  }

  logSuccess('STEP-1', `Retrieved ${orgs.length} organisation(s)`, orgs.map(o => ({ id: o.id, name: o.name })));

  const testOrg = orgs.find(o => o.name?.toLowerCase() === 'test');
  if (!testOrg) {
    logWarn('STEP-1', 'No org named exactly "test" found — using first available org as fallback', {
      available: orgs.map(o => o.name),
    });
    return orgs[0];
  }

  logSuccess('STEP-1', `Found "test" org`, { id: testOrg.id, name: testOrg.name });
  return testOrg;
}

async function step_register(organisationId) {
  logInfo('STEP-2', 'Registering test user', { email: TEST_EMAIL, organisationId });

  const payload = {
    name: TEST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    phone: TEST_PHONE,
    role: 'PASSENGER',
    organisationId,
  };

  const { status, body } = await request('POST', '/auth/register', payload);

  // Validate response shape
  const token   = body?.token   ?? body?.data?.token;
  const userId  = body?.userId  ?? body?.data?.userId;
  const email   = body?.email   ?? body?.data?.email;
  const role    = body?.role    ?? body?.data?.role;

  if (!token) {
    throw new Error('Register response missing "token" field. Full response logged above.');
  }
  if (!userId) {
    logWarn('STEP-2', '"userId" missing in register response — may still be OK if login returns it');
  }

  logSuccess('STEP-2', 'Registration succeeded', { status, userId, email, role, tokenPreview: `${token.slice(0, 20)}…` });

  return { token, userId, email, role };
}

async function step_login() {
  logInfo('STEP-3', 'Logging in with registered credentials', { email: TEST_EMAIL });

  const { status, body } = await request('POST', '/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const token  = body?.token  ?? body?.data?.token;
  const userId = body?.userId ?? body?.data?.userId;
  const email  = body?.email  ?? body?.data?.email;
  const role   = body?.role   ?? body?.data?.role;

  if (!token) {
    throw new Error('Login response missing "token" field. Full response logged above.');
  }
  if (!userId) {
    logWarn('STEP-3', '"userId" missing in login response');
  }
  if (!email) {
    logWarn('STEP-3', '"email" missing in login response');
  }
  if (!role) {
    logWarn('STEP-3', '"role" missing in login response');
  }

  logSuccess('STEP-3', 'Login succeeded', { status, userId, email, role, tokenPreview: `${token.slice(0, 20)}…` });

  return { token, userId, email, role };
}

async function step_verifyToken(token) {
  logInfo('STEP-4', 'Verifying JWT token structure');

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT — expected 3 parts, got ${parts.length}`);
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (e) {
    throw new Error(`Failed to decode JWT payload: ${e.message}`);
  }

  const exp = payload.exp;
  const now = Math.floor(Date.now() / 1000);

  if (exp && exp < now) {
    logWarn('STEP-4', 'JWT is already expired!', { exp, now, diff: now - exp });
  } else {
    logSuccess('STEP-4', 'JWT valid and not expired', {
      subject: payload.sub,
      userId: payload.userId,
      role: payload.role,
      expiresAt: exp ? new Date(exp * 1000).toISOString() : 'no exp claim',
    });
  }

  return payload;
}

// ─── Results ──────────────────────────────────────────────────────────────────

import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function saveResults(summary) {
  const outPath = `${__dirname}/auth-flow-results-${RUN_ID}.json`;
  writeFileSync(outPath, JSON.stringify({ summary, logs }, null, 2), 'utf8');
  logInfo('RESULTS', `Full log saved → ${outPath}`);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

const passed = [];
const failed = [];

async function runStep(name, fn) {
  try {
    const result = await fn();
    passed.push(name);
    return result;
  } catch (err) {
    logError(name, err.message, err instanceof RequestError ? err.meta : { stack: err.stack });
    failed.push({ step: name, error: err.message, meta: err instanceof RequestError ? err.meta : undefined });
    return null;
  }
}

async function main() {
  console.log(`\n${ANSI.bold}${'═'.repeat(60)}${ANSI.reset}`);
  console.log(`${ANSI.bold}  Carpooling Auth Flow — Automation Test${ANSI.reset}`);
  console.log(`${ANSI.bold}  Run ID  : ${RUN_ID}${ANSI.reset}`);
  console.log(`${ANSI.bold}  Base URL: ${BASE_URL}${ANSI.reset}`);
  console.log(`${ANSI.bold}  Email   : ${TEST_EMAIL}${ANSI.reset}`);
  console.log(`${ANSI.bold}${'═'.repeat(60)}${ANSI.reset}\n`);

  // Step 1 — fetch org
  const org = await runStep('STEP-1: Fetch Organisations', step_fetchOrganisations);
  if (!org) {
    logError('RUNNER', 'Cannot proceed without an organisation. Aborting.');
    saveResults({ status: 'ABORTED', passed, failed });
    process.exit(1);
  }

  // Step 2 — register
  const registerResult = await runStep('STEP-2: Register', () => step_register(org.id));

  // Step 3 — login (runs regardless of register outcome — login may work even if register had partial issues)
  const loginResult = await runStep('STEP-3: Login', step_login);

  // Step 4 — verify token from login (preferred) or register
  const tokenToVerify = loginResult?.token ?? registerResult?.token;
  if (tokenToVerify) {
    await runStep('STEP-4: Verify JWT', () => step_verifyToken(tokenToVerify));
  } else {
    logWarn('RUNNER', 'No token available to verify — both register and login failed');
    failed.push({ step: 'STEP-4: Verify JWT', error: 'Skipped — no token available' });
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${ANSI.bold}${'═'.repeat(60)}${ANSI.reset}`);
  console.log(`${ANSI.bold}  TEST SUMMARY${ANSI.reset}`);
  console.log(`${ANSI.bold}${'─'.repeat(60)}${ANSI.reset}`);
  console.log(`  ${ANSI.success}PASSED${ANSI.reset} (${passed.length})`);
  passed.forEach(s => console.log(`    ${ANSI.success}✔${ANSI.reset} ${s}`));
  console.log(`  ${ANSI.error}FAILED${ANSI.reset} (${failed.length})`);
  failed.forEach(f => console.log(`    ${ANSI.error}✖${ANSI.reset} ${f.step} — ${f.error}`));

  const allPassed = failed.length === 0;
  const statusLine = allPassed
    ? `${ANSI.success}${ANSI.bold}  RESULT: ALL TESTS PASSED${ANSI.reset}`
    : `${ANSI.error}${ANSI.bold}  RESULT: ${failed.length} TEST(S) FAILED${ANSI.reset}`;
  console.log(`\n${statusLine}`);
  console.log(`${ANSI.bold}${'═'.repeat(60)}${ANSI.reset}\n`);

  const summary = {
    status: allPassed ? 'PASSED' : 'FAILED',
    runId: RUN_ID,
    baseUrl: BASE_URL,
    testEmail: TEST_EMAIL,
    organisation: org ? { id: org.id, name: org.name } : null,
    passed,
    failed,
    registeredUserId: registerResult?.userId ?? loginResult?.userId ?? null,
  };

  saveResults(summary);

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  logError('RUNNER', `Unexpected fatal error: ${err.message}`, { stack: err.stack });
  saveResults({ status: 'FATAL', error: err.message, passed, failed });
  process.exit(1);
});
