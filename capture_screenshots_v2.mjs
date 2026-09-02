import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\6384ccd6-fa7e-40d3-9b70-e1f70c1645c5';

async function capture() {
  console.log('1. Fetching Admin token from backend...');
  const res = await fetch('http://127.0.0.1:8000/api/auth/demo-login/Admin', { method: 'POST' });
  const authData = await res.json();
  console.log('   Authenticated as:', authData.user_name, authData.role);

  console.log('2. Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Pre-seed localStorage with admin token so user is immediately logged in
  await page.evaluateOnNewDocument((token, user) => {
    localStorage.setItem('pmrg_token', token);
    localStorage.setItem('pmrg_user', JSON.stringify(user));
  }, authData.access_token, {
    id: authData.user_id,
    email: authData.email,
    full_name: authData.user_name,
    role: authData.role
  });

  // Helper to capture a route
  async function captureRoute(route, filename, waitMs = 2500) {
    console.log(`\nNavigating to http://127.0.0.1:5173/${route}...`);
    await page.goto(`http://127.0.0.1:5173/${route}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, waitMs));
    const outPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`[SAVED SCREENSHOT] ${filename} -> ${outPath}`);
  }

  // 1. Journeys Page
  await captureRoute('journeys', 'journeys_page.png', 3000);

  // 2. Governance Approval Queue Page
  await captureRoute('governance', 'governance_queue_page.png', 3000);

  // 3. Governance Audit Trail Tab
  console.log('\nSwitching to Audit Trail tab in /governance...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const auditBtn = buttons.find(b => b.textContent.includes('Audit trail'));
    if (auditBtn) auditBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  // Expand first row to show receipt
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    if (rows.length > 0) rows[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const govAuditPath = path.join(ARTIFACT_DIR, 'governance_audit_page.png');
  await page.screenshot({ path: govAuditPath, fullPage: false });
  console.log(`[SAVED SCREENSHOT] governance_audit_page.png -> ${govAuditPath}`);

  // 4. Pilot Bundle View
  await captureRoute('pilot-bundle', 'pilot_bundle_page.png', 3000);

  await browser.close();
  console.log('\nAll 4 high-resolution screenshots generated successfully!');
}

capture().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
