const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  let browser;

  try {
    console.log('Starting Puppeteer...');

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

    // ==========================================
    // טעינת index.html
    // ==========================================

    const indexPath = path.join(__dirname, 'index.html');
    const indexUrl = pathToFileURL(indexPath).href;

    console.log('Loading index.html...');

    await page.goto(indexUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('index.html loaded.');

    // ==========================================
    // מעבר לגלריה ורינדור המוצרים
    // ==========================================

    await page.evaluate(() => {
      if (typeof showView === 'function') {
        showView('gallery');
      }

      if (typeof renderGallery === 'function') {
        renderGallery();
      }
    });

    console.log('Gallery rendered.');

    // ==========================================
    // CSS מיוחד לקטלוג PDF
    // ==========================================

    await page.addStyleTag({
      content: `
        /*
         * ========================================
         * PDF CATALOG OVERRIDES
         * ========================================
         */

        /* מציגים את הגלריה */
        #view-gallery {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
        }

        /*
         * החוק המקורי ב-index.html אומר:
         *
         * body * {
         *   visibility: hidden;
         * }
         *
         * לכן חייבים להחזיר visibility לכל
         * תוכן הגלריה.
         */
        #view-gallery,
        #view-gallery * {
          visibility: visible !important;
        }

        /* כל שאר הדפים לא צריכים להופיע בקטלוג */
        #view-product,
        #view-about,
        #view-contact,
        #view-checkout,
        #view-summary {
          display: none !important;
        }

        /* ניווט, footer וכפתורים לא נכנסים לקטלוג */
        header,
        nav,
        footer,
        button,
        .no-print,
        .cart-btn,
        .nav-bar {
          display: none !important;
        }

        /* ביטול הגבלות הדפסה על הגלריה */
        #view-gallery .product-card {
          visibility: visible !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          transform: none !important;
        }

        /* רקע לבן ל-PDF */
        body {
          background: white !important;
          color: #1c1917 !important;
        }

        /*
         * מבטיח שהתמונות יהיו טעונות גם כשהן
         * מוגדרות loading="lazy"
         */
        #view-gallery img {
          visibility: visible !important;
        }

        /* לא להדפיס את כפתור הקטלוג עצמו */
        #view-gallery a.no-print {
          display: none !important;
        }

        /* סידור נכון של הגלריה */
        #products-grid {
          visibility: visible !important;
        }

        #products-grid > * {
          visibility: visible !important;
        }

        /*
         * חשוב במיוחד:
         * החוק הזה נמצא ב-index.html בתוך @media print
         *
         * body * { visibility: hidden; }
         *
         * אנחנו דורסים אותו כאן.
         */
        @media print {
          body * {
            visibility: hidden !important;
          }

          #view-gallery,
          #view-gallery * {
            visibility: visible !important;
          }

          #view-gallery {
            display: block !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
          }

          #view-product,
          #view-about,
          #view-contact,
          #view-checkout,
          #view-summary {
            display: none !important;
          }

          nav,
          footer,
          button,
          .no-print {
            display: none !important;
          }

          .product-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `
    });

    console.log('PDF CSS injected.');

    // ==========================================
    // לוודא שהמוצרים קיימים
    // ==========================================

    await page.waitForSelector(
      '#view-gallery #products-grid .product-card',
      {
        timeout: 15000
      }
    );

    const productCount = await page.$$eval(
      '#view-gallery #products-grid .product-card',
      cards => cards.length
    );

    console.log(`Products found: ${productCount}`);

    if (productCount === 0) {
      throw new Error('No products found in gallery.');
    }

    // ==========================================
    // להפוך תמונות lazy ל-eager
    // ==========================================

    await page.evaluate(() => {
      document
        .querySelectorAll('#view-gallery img')
        .forEach(img => {
          img.loading = 'eager';
          img.decoding = 'sync';
        });
    });

    console.log('Images set to eager loading.');

    // ==========================================
    // המתנה לטעינת התמונות
    // ==========================================

    await new Promise(resolve => setTimeout(resolve, 5000));

    // ==========================================
    // המתנה לפונטים
    // ==========================================

    try {
      await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      });
    } catch (e) {
      console.log('Font loading check skipped.');
    }

    // ==========================================
    // המתנה נוספת לרינדור
    // ==========================================

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Generating PDF...');

    // ==========================================
    // יצירת PDF
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
      },

      preferCSSPageSize: false
    });

    console.log('========================================');
    console.log('PDF CREATED SUCCESSFULLY');
    console.log(`Products: ${productCount}`);
    console.log(`File: ${pdfPath}`);
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
