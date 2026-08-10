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

    await page.setViewport({
      width: 1280,
      height: 1000
    });

    const indexPath = path.join(__dirname, 'index.html');

    await page.goto(`file://${indexPath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // להשתמש ב-CSS הרגיל של האתר ולא ב-@media print
    await page.emulateMediaType('screen');

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

    // לוודא שהמוצרים אכן קיימים
    await page.waitForSelector('#products-grid .product-card', {
      timeout: 15000
    });

    // להמתין לטעינת התמונות
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

    await new Promise(resolve => setTimeout(resolve, 1000));

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
