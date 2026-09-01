import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\6384ccd6-fa7e-40d3-9b70-e1f70c1645c5';

async function capture() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  // 1. Visit Login page and click Admin demo login
  console.log('Navigating to http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Finding and clicking Admin demo login button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find(b => b.textContent.includes('Admin') || b.textContent.includes('PMRG AI Administrator'));
    if (adminBtn) adminBtn.click();
  });
  await new Promise((r) => setTimeout(r, 2500));

  // 2. Click Customer Journeys in sidebar
  console.log('Clicking Customer Journeys in sidebar...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Customer Journeys'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 3000));
  const journeysPath = path.join(ARTIFACT_DIR, 'journeys_page.png');
  await page.screenshot({ path: journeysPath, fullPage: false });
  console.log(`[SAVED] Journeys page -> ${journeysPath}`);

  // 3. Click Governance & Audit in sidebar
  console.log('Clicking Governance & Audit in sidebar...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Governance & Audit'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 3000));
  const govQueuePath = path.join(ARTIFACT_DIR, 'governance_queue_page.png');
  await page.screenshot({ path: govQueuePath, fullPage: false });
  console.log(`[SAVED] Governance queue page -> ${govQueuePath}`);

  // 4. Click Audit Trail tab in Governance
  console.log('Clicking Audit Trail tab in /governance...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const auditBtn = buttons.find(b => b.textContent.includes('Audit trail'));
    if (auditBtn) auditBtn.click();
  });
  await new Promise((r) => setTimeout(r, 2500));
  const govAuditPath = path.join(ARTIFACT_DIR, 'governance_audit_page.png');
  await page.screenshot({ path: govAuditPath, fullPage: false });
  console.log(`[SAVED] Governance audit page -> ${govAuditPath}`);

  // 5. Click Recommended Pilot Bundle in sidebar
  console.log('Clicking Recommended Pilot Bundle in sidebar...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Recommended Pilot Bundle'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 3000));
  const pilotBundlePath = path.join(ARTIFACT_DIR, 'pilot_bundle_page.png');
  await page.screenshot({ path: pilotBundlePath, fullPage: false });
  console.log(`[SAVED] Pilot bundle page -> ${pilotBundlePath}`);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
