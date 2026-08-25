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

    // ==========================================
    // טעינת הקובץ הייעודי pdf-template.html
    // ==========================================
    const pdfTemplatePath = path.join(__dirname, 'pdf-template.html');
    const pdfTemplateUrl = pathToFileURL(pdfTemplatePath).href;

    console.log('Loading pdf-template.html...');

    await page.goto(pdfTemplateUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('pdf-template.html loaded successfully.');

    // המתנה קצרה לוודא שכל התמונות והפונטים רונדרו במלואם
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Generating PDF...');

    // ==========================================
    // יצירת קובץ ה-PDF
    // ==========================================
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
