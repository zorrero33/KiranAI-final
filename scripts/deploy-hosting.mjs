import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';
import http from 'http';

function getMetadataToken() {
  return new Promise((resolve, reject) => {
    http.get({
      host: 'metadata.google.internal',
      path: '/computeMetadata/v1/instance/service-accounts/default/token',
      headers: { 'Metadata-Flavor': 'Google' }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body).access_token);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function getFiles(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = path.join(base, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, relPath));
    } else {
      results.push({ fullPath, webPath: relPath.replace(/\\/g, '/') });
    }
  }
  return results;
}

async function deploySite(siteId, projectId) {
  console.log(`\n========================================`);
  console.log(`Deploying to Firebase Hosting site: ${siteId} in project: ${projectId}`);
  console.log(`========================================`);

  const token = await getMetadataToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'X-Goog-User-Project': projectId,
    'Content-Type': 'application/json'
  };

  // 1. Create Version
  console.log('1. Creating new version...');
  const createVerRes = await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/versions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      config: {
        rewrites: [{ glob: '**', path: '/index.html' }],
        headers: [
          {
            glob: '**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)',
            headers: { 'Cache-Control': 'max-age=31536000' }
          }
        ]
      }
    })
  });

  const verData = await createVerRes.json();
  if (!createVerRes.ok) {
    throw new Error(`Failed to create version: ${JSON.stringify(verData)}`);
  }
  const versionName = verData.name;
  console.log(`   Version created: ${versionName}`);

  // 2. Gzip & Hash files in dist
  const distDir = path.resolve(process.cwd(), 'dist');
  const allFiles = getFiles(distDir);
  console.log(`2. Gzipping and computing SHA-256 for ${allFiles.length} files...`);

  const fileHashMap = {};
  const hashToGzipBytes = {};

  for (const file of allFiles) {
    const content = fs.readFileSync(file.fullPath);
    const gzipped = zlib.gzipSync(content);
    const hash = crypto.createHash('sha256').update(gzipped).digest('hex');
    fileHashMap[file.webPath] = hash;
    hashToGzipBytes[hash] = gzipped;
  }

  // 3. Populate files
  console.log('3. Populating files with Firebase Hosting API...');
  const populateRes = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${versionName}:populateFiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ files: fileHashMap })
  });

  const popData = await populateRes.json();
  if (!populateRes.ok) {
    throw new Error(`Failed to populate files: ${JSON.stringify(popData)}`);
  }

  const uploadUrl = popData.uploadUrl;
  const requiredHashes = popData.uploadRequiredHashes || [];
  console.log(`   Required uploads: ${requiredHashes.length} files.`);

  // 4. Upload required files (as gzipped octet-stream)
  let uploaded = 0;
  for (const hash of requiredHashes) {
    const gzippedBytes = hashToGzipBytes[hash];
    const uploadRes = await fetch(`${uploadUrl}/${hash}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: gzippedBytes
    });
    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      throw new Error(`Failed to upload hash ${hash}: ${uploadRes.status} ${errBody}`);
    }
    uploaded++;
  }
  console.log(`   Uploaded ${uploaded} files successfully.`);

  // 5. Finalize version
  console.log('5. Finalizing version...');
  const finalizeRes = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${versionName}?update_mask=status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'FINALIZED' })
  });
  const finData = await finalizeRes.json();
  if (!finalizeRes.ok) {
    throw new Error(`Failed to finalize version: ${JSON.stringify(finData)}`);
  }
  console.log(`   Version status: ${finData.status}`);

  // 6. Release version
  console.log('6. Releasing version to production traffic...');
  const releaseRes = await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/releases?versionName=${versionName}`, {
    method: 'POST',
    headers
  });
  const relData = await releaseRes.json();
  if (!releaseRes.ok) {
    throw new Error(`Failed to release version: ${JSON.stringify(relData)}`);
  }
  console.log(`   Release complete! Deployment is LIVE at:`);
  console.log(`   👉 https://${siteId}.web.app`);
  console.log(`   👉 https://${siteId}.firebaseapp.com`);

  return `https://${siteId}.web.app`;
}

async function run() {
  const projectId = 'proven-script-460720-j1';
  try {
    const url1 = await deploySite('kiranai-app', projectId);
    console.log(`\n🎉 Verification for ${url1}:`);
    const check1 = await fetch(url1);
    console.log(`HTTP Status: ${check1.status} - Content-Type: ${check1.headers.get('content-type')}`);
    const html = await check1.text();
    console.log(`HTML Title match:`, html.includes('KiranAI'));

    // Also deploy to default site proven-script-460720-j1
    await deploySite('proven-script-460720-j1', projectId);
  } catch (err) {
    console.error('Deployment error:', err);
    process.exit(1);
  }
}

run();
