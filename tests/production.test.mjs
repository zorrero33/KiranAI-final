import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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

  await t.test('POST /api/billing/checkout creates session or simulation url', async () => {
    const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'pro', userId: 'usr_guest' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.checkoutUrl || data.sessionId, 'Must return a checkout session');
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
