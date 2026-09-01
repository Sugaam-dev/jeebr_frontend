const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\6384ccd6-fa7e-40d3-9b70-e1f70c1645c5';

async function capture() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  // 1. Visit Login page and click Admin demo login
  console.log('Navigating to http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });

  console.log('Clicking Admin demo login button...');
  // Find button with text 'PMRG AI Administrator' or 'Admin'
  const adminBtn = await page.waitForSelector('button:has-text("PMRG AI Administrator"), button:has-text("System Administrator"), button:has-text("Admin")');
  await adminBtn.click();
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  // 2. Capture Journeys Page
  console.log('Navigating to /journeys...');
  await page.evaluate(() => {
    window.history.pushState({ tab: 'journeys' }, '', '/journeys');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await new Promise((r) => setTimeout(r, 2000));
  const journeysPath = path.join(ARTIFACT_DIR, 'journeys_page.png');
  await page.screenshot({ path: journeysPath, fullPage: false });
  console.log(`[SAVED] Journeys page -> ${journeysPath}`);

  // 3. Capture Governance Approval Queue Page
  console.log('Navigating to /governance...');
  await page.evaluate(() => {
    window.history.pushState({ tab: 'governance' }, '', '/governance');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await new Promise((r) => setTimeout(r, 2000));
  const govQueuePath = path.join(ARTIFACT_DIR, 'governance_queue_page.png');
  await page.screenshot({ path: govQueuePath, fullPage: false });
  console.log(`[SAVED] Governance queue page -> ${govQueuePath}`);

  // 4. Capture Governance Audit Trail Page
  console.log('Switching to Audit Trail tab in /governance...');
  const auditTabBtn = await page.waitForSelector('button:has-text("Audit trail")');
  await auditTabBtn.click();
  await new Promise((r) => setTimeout(r, 1500));
  const govAuditPath = path.join(ARTIFACT_DIR, 'governance_audit_page.png');
  await page.screenshot({ path: govAuditPath, fullPage: false });
  console.log(`[SAVED] Governance audit page -> ${govAuditPath}`);

  // 5. Capture Pilot Bundle Connected Trace Page
  console.log('Navigating to /pilot-bundle...');
  await page.evaluate(() => {
    window.history.pushState({ tab: 'pilot-bundle' }, '', '/pilot-bundle');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await new Promise((r) => setTimeout(r, 2000));
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
