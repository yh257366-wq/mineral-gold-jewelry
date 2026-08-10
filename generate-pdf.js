const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  let browser;

  try {
    console.log('Starting browser...');

    browser = await puppeteer.launch({
      protocolTimeout: 120000,

      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 1000,
      deviceScaleFactor: 1
    });

    // -----------------------------------
    // טעינת index.html
    // -----------------------------------

    const indexPath = path.join(__dirname, 'index.html');
    const indexUrl = pathToFileURL(indexPath).href;

    console.log('Opening:', indexPath);

    await page.goto(indexUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('HTML loaded.');

    // -----------------------------------
    // שימוש ב-CSS הרגיל
    // -----------------------------------

    await page.emulateMediaType('screen');

    // -----------------------------------
    // מעבר לגלריה
    // -----------------------------------

    console.log('Opening gallery...');

    await page.evaluate(() => {
      if (typeof showView === 'function') {
        showView('gallery');
      }

      if (typeof renderGallery === 'function') {
        renderGallery();
      }

      const style = document.createElement('style');

      style.textContent = `
        header,
        footer,
        nav,
        .cart-btn,
        .nav-bar,
        #view-summary {
          display: none !important;
        }

        #view-gallery {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .product-card {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        body {
          margin: 0;
        }
      `;

      document.head.appendChild(style);
    });

    console.log('Gallery rendered.');

    // -----------------------------------
    // לוודא שיש מוצרים
    // -----------------------------------

    console.log('Waiting for products...');

    await page.waitForSelector('#products-grid .product-card', {
      visible: true,
      timeout: 15000
    });

    const productCount = await page.$$eval(
      '#products-grid .product-card',
      cards => cards.length
    );

    console.log(`Found ${productCount} products.`);

    // -----------------------------------
    // המתנה מוגבלת לתמונות
    // -----------------------------------

    console.log('Waiting for images...');

    try {
      await page.waitForFunction(
        () => {
          const images = Array.from(document.images);

          return images.every(img => {
            return img.complete;
          });
        },
        {
          timeout: 10000,
          polling: 200
        }
      );

      console.log('Images finished loading.');
    } catch (error) {
      console.log(
        'Some images did not finish loading within 10 seconds. Continuing anyway.'
      );
    }

    // -----------------------------------
    // לתת לדפדפן לסיים רינדור
    // -----------------------------------

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Generating PDF...');

    // -----------------------------------
    // יצירת PDF
    // -----------------------------------

    await page.pdf({
      path: path.join(__dirname, 'catalog.pdf'),

      format: 'A4',

      printBackground: true,

      preferCSSPageSize: false,

      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    console.log('================================');
    console.log('PDF created successfully!');
    console.log('File: catalog.pdf');
    console.log('================================');

  } catch (error) {
    console.error('================================');
    console.error('PDF GENERATION FAILED');
    console.error('================================');

    console.error(error);

    process.exitCode = 1;

  } finally {
    if (browser) {
      console.log('Closing browser...');

      try {
        await browser.close();
      } catch (error) {
        console.error('Failed to close browser:', error);
      }
    }
  }
})();
