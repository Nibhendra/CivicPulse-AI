const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const URL = 'http://localhost:5173';
  let logs = [];
  page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.message}`));

  try {
    console.log("1. Testing Authentication Flow");
    await page.goto(URL);
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`Current URL after going to / : ${currentUrl}`);
    if (!currentUrl.includes('/login')) {
      console.log("❌ Redirect to login failed.");
    } else {
      console.log("✅ Redirected to login successfully.");
    }

    // Try to login or create user
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = `Password@123`;
    
    // We will switch to Sign Up if we want to create a new user, or just use login if we have one.
    // Let's create a new user.
    await page.click('button:has-text("Sign up")');
    await page.waitForTimeout(500);
    
    await page.fill('input#fullName', 'Test User');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);
    
    console.log(`Attempting to sign up with ${testEmail}`);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const afterLoginUrl = page.url();
    console.log(`Current URL after signup: ${afterLoginUrl}`);
    if (afterLoginUrl === URL || afterLoginUrl === `${URL}/`) {
      console.log("✅ Successfully logged in/signed up.");
    } else {
      console.log("❌ Failed to navigate to dashboard after login.");
    }

    // Check dashboard loads correctly
    console.log("2. Testing Dashboard Flow");
    await page.goto(`${URL}/my-issues`);
    await page.waitForTimeout(1000);
    console.log(`My Issues URL: ${page.url()}`);
    
    await page.goto(`${URL}/leaderboard`);
    await page.waitForTimeout(1000);
    console.log(`Leaderboard URL: ${page.url()}`);

    await page.goto(`${URL}/authority`);
    await page.waitForTimeout(1000);
    console.log(`Authority Dashboard URL: ${page.url()}`);

    console.log("3. Testing Report Issue Flow");
    await page.goto(`${URL}/report`);
    await page.waitForTimeout(2000);

    console.log("Report issue page URL: " + page.url());
    
    // Check if the form is rendering
    const isFormVisible = await page.isVisible('form');
    console.log(`Form is visible: ${isFormVisible}`);
    
    // Log out
    console.log("Testing Logout");
    // Find logout button
    // It might be in the app shell sidebar
    const logoutBtn = await page.$('button:has-text("Logout"), a:has-text("Logout")');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      console.log(`URL after logout: ${page.url()}`);
    } else {
      console.log("❌ Logout button not found.");
    }

  } catch (err) {
    console.error("Test failed: ", err);
  } finally {
    console.log("Browser Logs:");
    console.log(logs.join('\n'));
    await browser.close();
  }
})();
