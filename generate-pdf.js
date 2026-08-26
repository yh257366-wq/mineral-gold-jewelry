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

    // ==========================================
    // המתנה לטעינת כרטיסי המוצרים
    // ==========================================
    await page.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {
      console.log('לא נמצאו מוצרים בזמן הקצוב, מפיק PDF לפי המצב הקיים.');
    });

    // ==========================================
    // עדכון הכותרת והזרקת CSS ל-4 מוצרים בעמוד (ללא טורים)
    // ==========================================
    await page.evaluate(() => {
      // עדכון הכותרת הראשית
      const headerTitle = document.querySelector('.catalog-header h1');
      if (headerTitle) {
        headerTitle.textContent = 'תכשיטי מינרל גולד - קטלוג התכשיטים המלא';
      }
    });

    // הזרקת עיצוב מותאם עבור 4 מוצרים בעמוד בטור יחיד
    await page.addStyleTag({
      content: `
        /* ביטול הגריד והגדרת תצוגה של טור יחיד */
        .products-grid {
          display: block !important;
        }

        /* הגדרת גובה ומבנה עבור 4 מוצרים בעמוד */
        .product-card {
          box-sizing: border-box !important;
          height: calc((100vh - 120px) / 4) !important; /* חלוקת גובה העמוד ל-4 מוצרים */
          max-height: 230px !important;
          margin-bottom: 8px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* כפיית מעבר עמוד לאחר כל 4 מוצרים */
        .product-card:nth-child(4n) {
          page-break-after: always !important;
          break-after: page !important;
          margin-bottom: 0 !important;
        }

        /* התאמת גודל התמונה לתצוגה בטור */
        .product-card img {
          width: 90px !important;
          height: 90px !important;
          object-fit: cover !important;
        }
      `
    });

    // המתנה קצרה נוספת לוודא שכל התמונות והפונטים רונדרו במלואם
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
