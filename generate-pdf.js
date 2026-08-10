const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security'
    ]
  });

  try {
    const page = await browser.newPage();

    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });

    page.on('pageerror', error => {
      console.error('PAGE ERROR:', error.message);
    });

    page.on('requestfailed', request => {
      console.error(
        'REQUEST FAILED:',
        request.url(),
        request.failure()?.errorText
      );
    });

    await page.setViewport({
      width: 1280,
      height: 1000
    });

    const indexPath = path.join(__dirname, 'index.html');

    await page.goto(`file://${indexPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // הצגת הגלריה
    await page.evaluate(() => {
      showView('gallery');
      renderGallery();

      const style = document.createElement('style');

      style.innerHTML = `
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
      `;

      document.head.appendChild(style);
    });

    // המתנה לכך שהמוצרים באמת נוצרו
    await page.waitForSelector('#products-grid .product-card', {
      timeout: 15000
    });

    // המתנה לטעינת התמונות
    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();

          return new Promise(resolve => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        })
      );
    });

    // המתנה קצרה נוספת לרינדור
    await new Promise(resolve => setTimeout(resolve, 1000));

    // יצירת PDF
    await page.pdf({
      path: 'catalog.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    console.log('PDF created successfully.');

  } finally {
    await browser.close();
  }
})();
