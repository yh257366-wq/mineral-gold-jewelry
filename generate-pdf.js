const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  let browser;

  try {
    console.log('Starting Puppeteer for Dedicated Catalog Template...');

    browser = await puppeteer.launch({
      protocolTimeout: 120000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 1000,
      deviceScaleFactor: 1
    });

    const pdfTemplatePath = path.join(__dirname, 'pdf-template.html');
    const pdfTemplateUrl = pathToFileURL(pdfTemplatePath).href;

    console.log('Loading pdf-template.html...');

    await page.goto(pdfTemplateUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('pdf-template.html loaded successfully.');

    await page.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {
      console.log('לא נמצאו מוצרים בזמן הקצוב, מפיק PDF לפי המצב הקיים.');
    });

    await page.evaluate(() => {
      const headerTitle = document.querySelector('.catalog-header h1');
      if (headerTitle) {
        headerTitle.textContent = 'תכשיטי מינרל גולד - קטלוג התכשיטים המלא';
      }
    });

    // הזרקת CSS מתוקנת השומרת על זרימת התוכן וללא דריסת גבהים
    await page.addStyleTag({
      content: `
        .products-grid {
          display: flex !important;
          flex-direction: column !important;
          gap: 16px !important;
        }

        .product-card {
          box-sizing: border-box !important;
          height: auto !important;
          max-height: none !important;
          margin-bottom: 12px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .product-card img {
          width: 180px !important;
          height: 180px !important;
          object-fit: cover !important;
        }
      `
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Generating PDF...');

    const pdfPath = path.join(__dirname, 'catalog.pdf');

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    console.log('========================================');
    console.log('PDF CREATED SUCCESSFULLY');
    console.log(`File saved to: ${pdfPath}`);
    console.log('========================================');

  } catch (error) {
    console.error('========================================');
    console.error('PDF GENERATION FAILED');
    console.error('========================================');
    console.error(error);
    process.exitCode = 1;

  } finally {
    if (browser) {
      console.log('Closing browser...');
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
})();
