const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to http://localhost:3000/admin/settings');
  await page.goto('http://localhost:3000/admin/settings', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log(e));
  
  await browser.close();
})();
