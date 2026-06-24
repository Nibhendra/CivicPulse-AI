import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Helper for waiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== STARTING CIVICPULSE AI FULL AUDIT ===');
  
  const consoleLogs = [];
  const networkErrors = [];
  const screenshotDir = './test-results-screenshots';
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Create browser instance
  const browser = await chromium.launch({
    headless: true, // run headless to run inside sandbox
  });

  // Setup context with Geolocation permissions mocked
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['geolocation'],
    geolocation: { latitude: 12.9716, longitude: 77.5946 },
  });

  const page = await context.newPage();

  // Monitor console messages
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, location: msg.location().url });
    if (type === 'error') {
      console.log(`[Browser Console Error]: ${text}`);
    }
  });

  // Monitor page errors
  page.on('pageerror', (err) => {
    consoleLogs.push({ type: 'pageerror', text: err.message, stack: err.stack });
    console.log(`[Browser Page Error]: ${err.message}`);
  });

  // Monitor network requests/responses
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    networkErrors.push({
      url: request.url(),
      method: request.method(),
      errorText: failure ? failure.errorText : 'Unknown failure'
    });
    console.log(`[Network Request Failed]: ${request.method()} ${request.url()} - ${failure ? failure.errorText : 'Unknown'}`);
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push({
        url: response.url(),
        method: response.request().method(),
        status,
        statusText: response.statusText()
      });
      console.log(`[Network Error Response]: ${response.request().method()} ${response.url()} returned status ${status}`);
    }
  });

  try {
    // ----------------------------------------------------
    // FLOW 1: Authentication Flow & Redirects
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Authentication & Redirects ---');
    
    // Go to home page, check redirect
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('load');
    
    const urlAfterRedirect = page.url();
    console.log(`Initial URL: http://localhost:5173 -> Redirected to: ${urlAfterRedirect}`);
    
    if (urlAfterRedirect.includes('/login')) {
      console.log('SUCCESS: Redirect to login works for unauthenticated users.');
    } else {
      console.log('FAIL: Did not redirect to /login.');
    }
    
    await page.screenshot({ path: path.join(screenshotDir, '01_login_redirect.png') });

    // Test sign up
    console.log('Attempting to sign up with a new email/password...');
    // Click "Sign up" button link to toggle mode
    const signUpToggle = page.locator('button:has-text("Sign up")');
    await signUpToggle.click();
    
    const titleText = await page.locator('div:has-text("Create your account")').first().textContent();
    console.log(`Form mode title: ${titleText}`);

    // Generate random email to avoid duplicate errors
    const testEmail = `test_${Date.now()}@example.com`;
    const testName = 'Citizen Test User';
    const testPassword = 'Password123!';

    await page.fill('input#fullName', testName);
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);
    
    await page.screenshot({ path: path.join(screenshotDir, '02_signup_form_filled.png') });
    
    // Submit sign up
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home
    await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
    console.log(`SUCCESS: Signed up and redirected to home. Current URL: ${page.url()}`);
    await page.screenshot({ path: path.join(screenshotDir, '03_dashboard_after_signup.png') });

    // ----------------------------------------------------
    // FLOW 2: Dashboard Flow
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Dashboard ---');
    // Check if dashboard stats cards and recent issues section load
    const statsCount = await page.locator('main .grid > div').count();
    console.log(`Dashboard grid elements found: ${statsCount}`);
    
    const hasRecentIssues = await page.locator('text=Recent Issues').isVisible();
    console.log(`"Recent Issues" header visible: ${hasRecentIssues}`);
    
    const noIssuesFound = await page.locator('text=No issues reported yet').isVisible();
    console.log(`"No issues reported yet" empty state visible: ${noIssuesFound}`);

    // ----------------------------------------------------
    // FLOW 3: Report Issue Flow
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Report Issue ---');
    
    // Navigate to /report
    await page.goto('http://localhost:5173/report');
    await page.waitForLoadState('load');
    console.log(`Navigated to: ${page.url()}`);
    await page.screenshot({ path: path.join(screenshotDir, '04_report_issue_step1.png') });

    // Step 1: Photo upload
    console.log('Uploading test image...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-image.png');
    
    // Wait for uploading spinner to disappear
    await page.waitForSelector('text=Uploading...', { state: 'detached', timeout: 30000 });
    console.log('Image upload finished.');
    await page.screenshot({ path: path.join(screenshotDir, '05_image_uploaded_preview.png') });

    // Click Next to step 2
    await page.click('button:has-text("Next")');
    await page.screenshot({ path: path.join(screenshotDir, '06_report_issue_step2.png') });

    // Step 2: Details
    console.log('Filling issue details...');
    await page.selectOption('select#category', 'broken_road');
    await page.fill('input#title', 'Broken Road & Deep Pot-holes on Cross Way');
    await page.fill('textarea#description', 'There is a long stretch of broken tarmac and several deep potholes here causing vehicle damage and traffic safety issues.');
    
    // Click Next to step 3
    await page.click('button:has-text("Next")');
    await page.screenshot({ path: path.join(screenshotDir, '07_report_issue_step3.png') });

    // Step 3: Location
    console.log('Detecting geolocation...');
    await page.click('button:has-text("Detect My Location")');
    
    // Wait for the "Location captured" confirmation
    await page.waitForSelector('text=Location captured', { timeout: 10000 });
    console.log('Geolocation detected successfully.');

    // Enter manual details
    await page.fill('input#address', 'Avenue Road, Near State Bank');
    await page.fill('input#locality', 'Malleshwaram');
    
    await page.screenshot({ path: path.join(screenshotDir, '08_report_issue_location_filled.png') });

    // Click Next to step 4
    await page.click('button:has-text("Next")');
    await page.screenshot({ path: path.join(screenshotDir, '09_report_issue_review.png') });

    // Step 4: Submit Issue
    console.log('Submitting issue...');
    await page.click('button:has-text("Submit Issue")');
    
    // Wait for redirected issue detail URL
    await page.waitForURL(/\/issue\//, { timeout: 20000 });
    const issueUrl = page.url();
    console.log(`SUCCESS: Issue submitted. Redirected to detail page: ${issueUrl}`);
    
    const issueId = issueUrl.split('/issue/')[1];
    console.log(`Generated Issue ID: ${issueId}`);
    await page.screenshot({ path: path.join(screenshotDir, '10_issue_detail_page_initial.png') });

    // ----------------------------------------------------
    // FLOW 5: Issue Detail Page verification
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Issue Detail Page ---');
    
    const detailTitle = await page.locator('h2.text-2xl, h2.font-bold').first().textContent();
    console.log(`Issue Title in UI: ${detailTitle}`);
    
    const isImageVisible = await page.locator('.md\\:col-span-3 img').first().isVisible().catch(() => false) || await page.locator('img').first().isVisible().catch(() => false);
    console.log(`Issue Image visible: ${isImageVisible}`);
    
    const pageContentText = await page.content();
    const hasNullUndefined = /null|undefined/i.test(pageContentText);
    console.log(`Null/Undefined keywords check in text: ${hasNullUndefined ? 'FOUND' : 'None found (OK)'}`);
    
    // Google Maps link
    const mapsLink = page.locator('a[href*="google.com/maps"], a[href*="maps.google"]');
    const mapsLinkCount = await mapsLink.count();
    console.log(`Google Maps external links found: ${mapsLinkCount}`);

    // ----------------------------------------------------
    // FLOW 6: Civic Rescue Agent AI Flow
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Civic Rescue Agent AI Flow ---');
    
    // Check if the "Run Civic Rescue Agent" button is available
    const runAgentBtn = page.locator('button:has-text("Run Civic Rescue Agent"), button:has-text("Re-run AI Analysis")');
    const isAgentBtnVisible = await runAgentBtn.isVisible();
    console.log(`"Run Civic Rescue Agent" button visible: ${isAgentBtnVisible}`);
    
    if (isAgentBtnVisible) {
      console.log('Running Civic Rescue Agent...');
      await runAgentBtn.click();
      
      // Wait for AI results to be displayed or status to update
      console.log('Waiting for AI Analysis to complete (api process-issue call)...');
      
      // Look for AI sections in the UI
      await page.waitForSelector('text=AI Analysis', { timeout: 45000 });
      console.log('AI Analysis finished and loaded in UI!');
      await page.screenshot({ path: path.join(screenshotDir, '11_issue_detail_after_ai.png') });

      // Verify AI metrics
      const aiCategory = await page.locator('text=AI Category').isVisible().catch(() => false) || await page.locator('text=Category').isVisible().catch(() => false);
      const severity = await page.locator('text=Severity').isVisible().catch(() => false);
      const urgency = await page.locator('text=Urgency').isVisible().catch(() => false);
      const confidence = await page.locator('text=Confidence').isVisible().catch(() => false) || await page.locator('text=AI Confidence').isVisible().catch(() => false);
      const dept = await page.locator('text=Recommended Department').isVisible().catch(() => false) || await page.locator('text=Department').isVisible().catch(() => false);
      const complaintDraft = await page.locator('text=Formal Complaint Draft').isVisible().catch(() => false) || await page.locator('text=Complaint Draft').isVisible().catch(() => false);

      console.log(`AI elements found in UI:`);
      console.log(`- Category: ${aiCategory}`);
      console.log(`- Severity: ${severity}`);
      console.log(`- Urgency Score: ${urgency}`);
      console.log(`- AI Confidence: ${confidence}`);
      console.log(`- Recommended Department: ${dept}`);
      console.log(`- Complaint Draft: ${complaintDraft}`);
      
      // Test copy complaint button
      const copyBtn = page.locator('button:has-text("Copy")');
      const isCopyBtnVisible = await copyBtn.isVisible().catch(() => false);
      console.log(`Copy Draft button visible: ${isCopyBtnVisible}`);
      
      // Refresh page, confirm AI does not run automatically
      console.log('Refreshing page to check that AI does not automatically re-run...');
      await page.reload();
      await page.waitForLoadState('load');
      
      const refreshPageContent = await page.content();
      const containsProcessing = /Processing Issue|AI analysis in progress/i.test(refreshPageContent);
      console.log(`Is AI auto-running on refresh? ${containsProcessing ? 'YES (FAIL)' : 'NO (SUCCESS)'}`);
    } else {
      console.log('FAIL: Run Civic Rescue Agent button was not found.');
    }

    // ----------------------------------------------------
    // FLOW 4: My Issues Flow
    // ----------------------------------------------------
    console.log('\n--- 4. Testing My Issues Page ---');
    await page.goto('http://localhost:5173/my-issues');
    await page.waitForLoadState('load');
    console.log(`Navigated to: ${page.url()}`);
    // Wait for the new issue to load in the list (or catch timeout if slow)
    await page.waitForSelector('text=Broken Road & Deep Pot-holes on Cross Way', { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: path.join(screenshotDir, '12_my_issues_page.png') });
    
    // Check if the newly created issue title is in the list
    const myIssuesPageText = await page.content();
    const isNewIssueInList = myIssuesPageText.includes('Broken Road & Deep Pot-holes on Cross Way');
    console.log(`New issue is shown in My Issues page: ${isNewIssueInList}`);

    // ----------------------------------------------------
    // FLOW 7: Responsive UI & Viewports
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Responsive Viewports ---');
    const viewports = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'laptop', width: 1024, height: 768 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 390, height: 844 }
    ];

    for (const vp of viewports) {
      console.log(`Resizing to ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await delay(1000); // Wait for transition
      
      // Capture screenshot
      await page.screenshot({ path: path.join(screenshotDir, `13_responsive_${vp.name}.png`) });
      
      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      // Check if sidebar / bottom navigation are shown correctly
      const isSidebarVisible = await page.locator('aside, .sidebar').first().isVisible().catch(() => false);
      const isBottomNavVisible = await page.locator('nav.fixed.bottom-0, .bottom-nav').first().isVisible().catch(() => false);
      
      console.log(`Viewport: ${vp.name} - Overflow: ${hasOverflow ? 'YES (FAIL)' : 'NO (SUCCESS)'}`);
      console.log(`Sidebar visible: ${isSidebarVisible}`);
      console.log(`Bottom nav visible: ${isBottomNavVisible}`);
    }

    // ----------------------------------------------------
    // FLOW 1 (cont): Logout & Protected Route Access
    // ----------------------------------------------------
    console.log('\n--- 1 (cont). Testing Logout & Protected Routes ---');
    // Set desktop size again to navigate easily
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Find logout button
    await page.goto('http://localhost:5173/profile');
    await page.waitForLoadState('load');
    // Wait for profile loading state to disappear by waiting for Sign Out button
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: path.join(screenshotDir, '14_profile_page.png') });
    
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    if (await logoutBtn.isVisible()) {
      console.log('Clicking Logout...');
      await logoutBtn.click();
      
      // Confirm redirect to login
      await page.waitForURL(/\/login/, { timeout: 10000 });
      console.log(`Redirected after logout: ${page.url()}`);
      
      // Test accessing protected route without login
      console.log('Attempting to access /profile while logged out...');
      await page.goto('http://localhost:5173/profile');
      await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});
      console.log(`URL after navigating to /profile while logged out: ${page.url()}`);
      
      if (page.url().includes('/login')) {
        console.log('SUCCESS: Protected route access blocked and redirected to login.');
      } else {
        console.log('FAIL: Accessible protected route /profile while logged out!');
      }
    } else {
      console.log('FAIL: Logout button not found on profile page.');
    }

  } catch (error) {
    console.error('An error occurred during testing:', error);
  } finally {
    await browser.close();
    console.log('\n=== AUDIT COMPLETED ===');
    
    // Print summary metrics
    console.log(`Total browser console messages logged: ${consoleLogs.length}`);
    console.log(`Total network requests with status code >= 400 or failed: ${networkErrors.length}`);
    
    // Save results to file
    fs.writeFileSync('./audit-console-logs.json', JSON.stringify(consoleLogs, null, 2));
    fs.writeFileSync('./audit-network-errors.json', JSON.stringify(networkErrors, null, 2));
    console.log('Audit reports saved to audit-console-logs.json and audit-network-errors.json.');
  }
}

runTests();
