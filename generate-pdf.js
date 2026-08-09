const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Open the local site
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });

  // Wait for the products grid to actually contain the jewelry items
  await page.waitForSelector('#products-grid > *', { timeout: 20000 }).catch(() => {
    console.log('Warning: products grid did not populate in time');
  });

  // Small extra buffer to let images finish rendering
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
