import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('1. Static Branding & SEO Assets Integrity', async (t) => {
  await t.test('kiran-logo.jpg exists and has positive size', () => {
    const stats = fs.statSync(path.join(process.cwd(), 'public', 'kiran-logo.jpg'));
    assert.ok(stats.size > 10000, 'Logo JPG must be greater than 10KB');
  });

  await t.test('kiran-logo.png exists and has positive size', () => {
    const stats = fs.statSync(path.join(process.cwd(), 'public', 'kiran-logo.png'));
    assert.ok(stats.size > 10000, 'Logo PNG must be greater than 10KB');
  });

  await t.test('robots.txt includes sitemap reference', () => {
    const content = fs.readFileSync(path.join(process.cwd(), 'public', 'robots.txt'), 'utf8');
    assert.match(content, /Sitemap:\s*https:\/\/kiranai(\-app)?\.web\.app\/sitemap\.xml/);
  });

  await t.test('sitemap.xml contains canonical production URL', () => {
    const content = fs.readFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');
    assert.match(content, /<loc>https:\/\/kiranai(\-app)?\.web\.app\/<\/loc>/);
  });

  await t.test('manifest.webmanifest has KiranAI identity and icons', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'manifest.webmanifest'), 'utf8'));
    assert.ok(manifest.name.includes('KiranAI'));
    assert.ok(manifest.icons.length >= 2);
  });
});

test('2. Live Server Endpoints', async (t) => {
  await t.test('GET /api/health responds with 200 and healthy status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.ok(data.productionUrl);
  });

  await t.test('GET /api/status responds with 200 and system details', async () => {
    const res = await fetch(`${BASE_URL}/api/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.status === 'ONLINE' || data.status === 'operational');
    assert.ok(Array.isArray(data.supportedModels || data.models));
  });

  await t.test('GET /api/models returns available LLM list', async () => {
    const res = await fetch(`${BASE_URL}/api/models`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.models && data.models.length > 0);
  });

  await t.test('POST /api/billing/checkout creates session or reports Stripe as unconfigured', async () => {
    const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'pro', userId: 'usr_guest' })
    });
    // A configured deployment returns a real Stripe Checkout session (200).
    // When Stripe keys are absent the API must fail honestly (503) rather than
    // fabricating a fake subscription — never simulate a successful payment.
    if (res.status === 200) {
      const data = await res.json();
      assert.ok(data.checkoutUrl || data.sessionId, 'Must return a checkout session');
    } else {
      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.stripeConfigured, false);
      assert.ok(data.error, 'Unconfigured billing must explain itself');
    }
  });

  await t.test('GET / serves the SPA index HTML', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /<title>KiranAI/);
  });
});

test('3. Real Firestore Persistence Integration', async (t) => {
  await t.test('Firestore configuration and health check', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.ok(data.firestore, 'Firestore status must be reported');
  });
});

test('4. Real Android Native Capacitor Packaging', async (t) => {
  await t.test('GET /api/android/info returns valid Android metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/android/info`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.packageId, 'ai.kiranai.app');
    assert.equal(data.appName, 'KiranAI');
    assert.equal(data.androidReady, true);
  });

  await t.test('GET /api/android/project.zip returns valid zip buffer with Android source', async () => {
    const res = await fetch(`${BASE_URL}/api/android/project.zip`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/zip');
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 100000, 'Zip file must contain project files');
  });
});

test('5. Authentication & Access Control', async (t) => {
  const unique = `qa_${Date.now()}@kiranai.example`;
  let token = '';

  await t.test('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@nowhere.example', password: 'wrongpassword' }),
    });
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/auth/register issues a verifiable session token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unique, password: 'secret123', name: 'QA Runner' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token, 'Registration must return a session token');
    assert.ok(data.user && data.user.id, 'Registration must return a user record');
    token = data.token;
  });

  await t.test('GET /api/auth/me resolves identity from the bearer token (not the body)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, unique);
    assert.equal(data.user.role, 'user');
  });

  await t.test('GET /api/admin/metrics is forbidden without admin auth', async () => {
    const anonymous = await fetch(`${BASE_URL}/api/admin/metrics`);
    assert.equal(anonymous.status, 401);

    const asUser = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(asUser.status, 403, 'A regular user must not read admin metrics');
  });

  await t.test('POST /api/credits/grant cannot be invoked by an unauthenticated caller', async () => {
    const res = await fetch(`${BASE_URL}/api/credits/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'usr_guest', amount: 999999 }),
    });
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/usage/record requires authentication', async () => {
    const res = await fetch(`${BASE_URL}/api/usage/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-main', tokens: 10 }),
    });
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/auth/google rejects an unverifiable token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'spoofed@attacker.example', name: 'Attacker' }),
    });
    // A raw profile body without a verifiable id_token must never authenticate.
    assert.equal(res.status, 400);
  });
});

test('6. Model Catalog Honesty (no fabricated availability)', async (t) => {
  await t.test('POST /api/models/discover returns structured metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/models/discover`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.models), 'models must be an array');
    assert.ok(data.models.length > 0, 'at least one model must be discovered');
    for (const m of data.models) {
      assert.ok(typeof m.id === 'string' && m.id.length > 0, 'each model needs an id');
      assert.ok(
        ['active', 'configured', 'key_required', 'unavailable', 'deprecated'].includes(m.status),
        `unexpected status "${m.status}" for ${m.id}`,
      );
    }
  });

  await t.test('no Google model registry entry keeps a retired 2.5 identifier', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src', 'server', 'aiRouter.ts'), 'utf8');
    assert.doesNotMatch(src, /gemini-2\.5/, 'retired gemini-2.5 ids must not remain in the registry');
  });

  await t.test('provider health is never pre-seeded with assumed failures', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src', 'server', 'litellmManager.ts'), 'utf8');
    assert.doesNotMatch(
      src,
      /433 quota|429 quota exhausted \(credits balance 0\)/,
      'health must be populated from real responses, not hardcoded at import time',
    );
    assert.doesNotMatch(
      src,
      /if \(process\.env\.OPENAI_API_KEY\) \{\s*providerHealthMap\.set/,
      'a key being present must not be treated as a known quota failure',
    );
  });
});


test('7. Privileged Data & Server-Side Authorization', async (t) => {
  // Register a throwaway user and obtain a real session token.
  const email = `probe_${Date.now()}@example.test`;
  const reg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123', name: 'Probe' }),
  });
  const regBody = await reg.json();
  const token = regBody.token;
  const userId = regBody.user?.id;

  await t.test('registration returns a session token and a non-admin role', () => {
    assert.equal(reg.status, 200);
    assert.ok(typeof token === 'string' && token.length > 10, 'must issue a session token');
    assert.equal(regBody.user.role, 'user', 'a self-registered user must not be an admin');
    assert.equal(regBody.user.passwordHash, undefined, 'password hash must never be returned');
  });

  await t.test('a user can read their own credits when authenticated', async () => {
    const res = await fetch(`${BASE_URL}/api/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.userId, userId, 'must return the authenticated user, not a body value');
    assert.ok(typeof data.balance === 'number');
  });

  await t.test('a user cannot grant credits to themselves', async () => {
    const res = await fetch(`${BASE_URL}/api/credits/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, amount: 999999, notes: 'self-service' }),
    });
    assert.equal(res.status, 403, 'credit grants must be admin-only');
  });

  await t.test('an unauthenticated caller cannot grant credits', async () => {
    const res = await fetch(`${BASE_URL}/api/credits/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: 1000 }),
    });
    assert.equal(res.status, 401);
  });

  await t.test('a user cannot change their own plan via the admin route', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: 'business' }),
    });
    assert.equal(res.status, 403, 'plan changes must be admin-only');
  });

  await t.test('a user cannot read the admin user list or metrics', async () => {
    const users = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(users.status, 403);
    const metrics = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(metrics.status, 403);
  });

  await t.test('the client userId in a body is ignored in favour of the token', async () => {
    // Ask for another user's credits while authenticated as ourselves.
    const res = await fetch(`${BASE_URL}/api/credits?userId=usr_guest`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.userId, userId, 'a query userId must not override the authenticated identity');
  });
});

test('8. Persistence Mode Reporting', async (t) => {
  await t.test('/api/status reports the persistence mode and how to enable it', async () => {
    const res = await fetch(`${BASE_URL}/api/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.persistence, 'status must report persistence');
    assert.ok(['admin', 'local'].includes(data.persistence.mode));
    if (data.persistence.mode === 'local') {
      assert.match(data.persistence.detail, /FIREBASE_SERVICE_ACCOUNT_JSON|GOOGLE_APPLICATION_CREDENTIALS/);
    }
  });

  await t.test('server never uses the Firebase client SDK for writes', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src', 'server', 'db', 'firestore.ts'), 'utf8');
    assert.doesNotMatch(src, /from 'firebase\/firestore'/, 'server writes must use firebase-admin, not the client SDK');
    assert.match(src, /firebase-admin/, 'the admin SDK must be the persistence path');
  });
});

test('9. Stripe Webhook Security (no browser-trust)', async (t) => {
  await t.test('an unsigned webhook payload is rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'evt_forged',
        type: 'checkout.session.completed',
        data: { object: { metadata: { userId: 'usr_attacker', planId: 'business' } } },
      }),
    });
    assert.notEqual(res.status, 200, 'a forged webhook must never be accepted');
    assert.ok(res.status >= 400, `expected 4xx, got ${res.status}`);
  });

  await t.test('a webhook with a bogus signature is rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=deadbeef' },
      body: JSON.stringify({ id: 'evt_forged2', type: 'checkout.session.completed' }),
    });
    assert.ok(res.status >= 400, 'an invalid signature must be rejected');
  });

  await t.test('the webhook handler verifies the signature before acting', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src', 'server', 'stripeManager.ts'), 'utf8');
    const verifyIdx = src.indexOf('constructEvent');
    assert.ok(verifyIdx > -1, 'must call constructEvent to verify the signature');
    const idemIdx = src.indexOf('recordAndCheckWebhookEvent');
    assert.ok(idemIdx > verifyIdx, 'idempotency check must run after signature verification');
  });

  await t.test('an unconfigured Stripe returns 503 instead of faking a subscription', async () => {
    const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'pro' }),
    });
    // Either a real session is created (200) or the server reports 503 honestly.
    assert.ok([200, 503].includes(res.status), `unexpected status ${res.status}`);
    const data = await res.json();
    if (res.status === 503) {
      assert.equal(data.stripeConfigured, false);
      assert.match(data.error, /STRIPE|facturaci/i);
    } else {
      assert.ok(data.checkoutUrl, 'a real session must include a checkout URL');
    }
  });
});

test('10. Provider Independence & Cache Refresh', async (t) => {
  await t.test('POST /api/models/discover forces a fresh read (clearCache present)', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const routeIdx = src.indexOf("'/api/models/discover'");
    assert.ok(routeIdx > -1, 'discover route must exist');
    const slice = src.slice(routeIdx, routeIdx + 500);
    assert.match(slice, /clearCache\(\)/, 'the refresh endpoint must clear the discovery cache before reading');
  });

  await t.test('discovery reports a per-provider status without disabling others', async () => {
    const res = await fetch(`${BASE_URL}/api/models/discover`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.refreshed, true);
    const statuses = new Set(data.models.map((m) => m.status));
    // Status vocabulary must be exactly these honest values.
    for (const s of statuses) {
      assert.ok(['active', 'unavailable', 'key_required'].includes(s), `unexpected status ${s}`);
    }
    // Providers are independent: a provider's own status must not leak to another.
    const byProvider = {};
    for (const m of data.models) {
      byProvider[m.provider] = byProvider[m.provider] || new Set();
      byProvider[m.provider].add(m.status);
    }
    assert.ok(Object.keys(byProvider).length > 1, 'expected multiple providers in the catalog');
  });
});

test('11. Authentication Hardening (no default admin, no missing-password bypass)', async (t) => {
  const unique = `auth-harden-${Date.now()}@example.com`;

  await t.test('login with a missing password field never issues a token', async () => {
    // Regression: previously loginWithPassword skipped the hash check when the
    // password was absent, so POSTing only an email minted a session token — and
    // the seeded admin address returned an admin token to anyone.
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'muhammaddris.dd@gmail.com' }),
    });
    const body = await res.json().catch(() => ({}));
    assert.notEqual(res.status, 200, 'a passwordless login must not succeed');
    assert.equal(body.token, undefined, 'no token may be issued without a password');
  });

  await t.test('registration without a password is rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unique, name: 'No Password' }),
    });
    assert.equal(res.status, 400, 'registration must require a password');
  });

  await t.test('a fresh account cannot log in with the wrong password', async () => {
    const reg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unique, password: 'secret123', name: 'Hardened' }),
    });
    const regBody = await reg.json();
    assert.equal(regBody.user.role, 'user', 'a self-registered user must not be an admin');
    const bad = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unique, password: 'not-the-password' }),
    });
    assert.equal(bad.status, 401, 'wrong password must be rejected');
    const good = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unique, password: 'secret123' }),
    });
    assert.equal(good.status, 200, 'the correct password must authenticate');
  });

  await t.test('admin requires ADMIN_EMAILS, not a hardcoded address', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/server/userStore.ts'), 'utf8');
    const db = fs.readFileSync(path.join(process.cwd(), 'src/server/db/database.ts'), 'utf8');
    assert.doesNotMatch(src, /muhammaddris\.dd@gmail\.com/, 'no personal admin address may be hardcoded');
    assert.doesNotMatch(db, /hashPassword\('admin123'\)/, 'no default admin password may be seeded');
    assert.match(src, /ADMIN_EMAILS/, 'admin must be driven by the ADMIN_EMAILS env var');
  });

  await t.test('the runtime data/ store is not tracked or committed', () => {
    const gi = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
    assert.match(gi, /^data\/$/m, 'data/ must be gitignored');
    const usersPath = path.join(process.cwd(), 'data/users.json');
    if (fs.existsSync(usersPath)) {
      const tracked = spawnSync('git', ['ls-files', '--error-unmatch', 'data/users.json'], { cwd: process.cwd() });
      assert.notEqual(tracked.status, 0, 'data/users.json must not be tracked by git');
    }
  });

  await t.test('invalid and tampered session tokens are rejected', async () => {
    const me = await fetch(`${BASE_URL}/api/auth/me`);
    assert.equal(me.status, 401, 'no token must be unauthorized');
    for (const bad of ['kir_deadbeef', 'garbage-token', 'Bearer-not-a-token']) {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${bad}` },
      });
      assert.equal(res.status, 401, `token ${bad} must be rejected`);
    }
    const reg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `tamper-${Date.now()}@example.com`, password: 'secret123' }),
    });
    const { token } = await reg.json();
    const good = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(good.status, 200, 'the real token must work');
    const tampered = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}xx` },
    });
    assert.equal(tampered.status, 401, 'a mutated token must not authenticate');
  });

  await t.test('error responses never leak hashes, tokens or keys', async () => {
    // Wrong password: the error must be a message, never a stack or a secret.
    const bad = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'legit@example.com', password: 'definitely-wrong' }),
    });
    const raw = await bad.text();
    assert.doesNotMatch(raw, /passwordHash|kiran_salt_|sk-|api[_-]?key|at .*\.ts:\d+/i,
      'auth errors must not expose internals');
  });
});

test('12. Gateway Status Honesty', async (t) => {
  await t.test('litellm.online reflects a real probe, not key presence', async () => {
    // Probe the proxy directly; if it is unreachable the reported status must agree.
    let reachable = false;
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 1500);
      const r = await fetch('http://127.0.0.1:4000/health', { signal: ctrl.signal });
      clearTimeout(to);
      reachable = r.ok;
    } catch {
      reachable = false;
    }
    const d = await (await fetch(`${BASE_URL}/api/status`)).json();
    if (!reachable) {
      assert.equal(d.litellm.online, false,
        'the gateway must not be reported online when the proxy is unreachable');
      assert.equal(d.gatewayOnline, false);
    }
  });

  await t.test('source never ORs key presence into the online flag', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/server/litellmManager.ts'), 'utf8');
    assert.doesNotMatch(src, /online:\s*isHealthy\s*\|\|/,
      'online must not be OR-ed with a key check; it must reflect the probe only');
  });
});




test('8. Password Hashing is Salted and Constant-Time', async (t) => {
  const usersPath = path.join(process.cwd(), 'data/users.json');

  await t.test('source derives passwords with scrypt and compares in constant time', () => {
    const db = fs.readFileSync(path.join(process.cwd(), 'src/server/db/database.ts'), 'utf8');
    assert.match(db, /scryptSync/, 'passwords must be derived with scrypt');
    assert.match(db, /timingSafeEqual/, 'password comparison must be constant-time');
  });

  await t.test('two users with the same password get different salted hashes', async () => {
    const stamp = Date.now();
    const emailA = `salt_a_${stamp}@example.test`;
    const emailB = `salt_b_${stamp}@example.test`;
    for (const email of [emailA, emailB]) {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'identical-pw', name: 'S' }),
      });
      assert.equal(res.status, 200, `register ${email}`);
    }
    const all = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const list = Array.isArray(all) ? all : Object.values(all);
    const a = list.find((u) => u.email === emailA);
    const b = list.find((u) => u.email === emailB);
    assert.ok(a?.passwordHash && b?.passwordHash, 'both accounts must persist a hash');
    assert.match(a.passwordHash, /^scrypt\$/, 'new hashes must use the scrypt format');
    assert.notEqual(a.passwordHash, b.passwordHash, 'same password must not produce the same hash');
    assert.notEqual(a.passwordSalt, b.passwordSalt, 'each account must have a distinct salt');
  });

  await t.test('passwordHash and passwordSalt are never returned by the API', async () => {
    const email = `nosalt_${Date.now()}@example.test`;
    const reg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123', name: 'NoSalt' }),
    });
    const body = await reg.json();
    assert.equal(body.user.passwordHash, undefined, 'passwordHash must never be returned');
    assert.equal(body.user.passwordSalt, undefined, 'passwordSalt must never be returned');
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123' }),
    });
    const lb = await login.json();
    assert.equal(lb.user.passwordSalt, undefined, 'passwordSalt must never be returned at login');
  });
});

test('9. Hardening Headers and Rate Limiting on Expensive Routes', async (t) => {
  await t.test('baseline security headers are present', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(res.headers.get('referrer-policy') || '', /strict-origin/);
    assert.ok(res.headers.get('permissions-policy'), 'Permissions-Policy must be set');
  });

  await t.test('every expensive AI route is rate-limited in source', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    for (const [route, key] of [
      ['/api/chat', 'chat'],
      ['/api/chat/compare', 'compare'],
      ['/api/generate-project', 'generate'],
      ['/api/analyze-file', 'analyze'],
      ['/api/vision/generate', 'vision'],
    ]) {
      const re = new RegExp(`'${route.replace(/\//g, '\\/')}'[^\\n]*rateLimit\\(`);
      assert.match(src, re, `${route} must be rate-limited`);
    }
  });

  await t.test('exceeding the compare limit returns 429', async () => {
    // Empty prompt → the handler rejects with 400 before any provider call, so
    // the burst is cheap. The rate limiter runs as middleware, ahead of the
    // handler, so it still throttles and returns 429 once the cap is reached.
    let saw429 = false;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${BASE_URL}/api/chat/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '', models: ['ministral-8b-latest'] }),
      });
      if (res.status === 429) { saw429 = true; break; }
    }
    assert.equal(saw429, true, 'the compare endpoint must throttle bursts');
  });
});

test('10. Header Accessibility Names', async (t) => {
  await t.test('icon-only header controls carry accessible names', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');
    assert.match(src, /aria-label=\{isDark \? 'Cambiar a modo claro'/, 'theme toggle needs an aria-label');
    assert.match(src, /aria-label="Activar o desactivar la búsqueda web"/, 'web-search toggle needs an aria-label');
    assert.match(src, /aria-label=\{`Seleccionar modelo/, 'model selector needs an aria-label');
    assert.match(src, /aria-label="Abrir cuenta de usuario y preferencias"/, 'account button needs an aria-label');
  });

  await t.test('toggles expose state and nav marks the current tab', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');
    assert.match(src, /aria-pressed=\{webSearchActive\}/, 'web-search toggle must expose aria-pressed');
    assert.match(src, /aria-expanded=\{modelDropdownOpen\}/, 'model dropdown must expose aria-expanded');
    assert.match(src, /aria-current=\{currentView === 'home' \? 'page' : undefined\}/,
      'active nav tab must be marked with aria-current');
  });
});
