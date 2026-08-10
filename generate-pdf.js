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
  const page = await browser.newPage();

  // הגדרת תצוגה בגודל מסך מספק
  await page.setViewport({ width: 1280, height: 1000 });

  // 1. טעינת index.html דרך הנתיב המקומי
  const indexPath = path.join(__dirname, 'index.html');
  await page.goto(`file://${indexPath}`, { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });

  // 2. טיפול בטוח באלמנטים ללא סיכון להתרסקות הקוד
  await page.evaluate(() => {
    try {
      if (typeof showView === 'function') showView('gallery');
      if (typeof renderGallery === 'function') renderGallery();
    } catch (e) {
      // התעלמות משגיאות פנימיות של האפליקציה למניעת קריסת התהליך
    }

    // הזרקת עיצוב להסתרת סרגלים והבטחת תצוגה של הגלריה
    const style = document.createElement('style');
    style.innerHTML = `
      header, footer, nav, .cart-btn, .nav-bar, #view-summary { display: none !important; }
      #view-gallery { display: block !important; visibility: visible !important; opacity: 1 !important; }
      .product-card { break-inside: avoid; page-break-inside: avoid; }
    `;
    document.head.appendChild(style);
  });

  // השהייה קבועה ובטוחה של 4 שניות לרינדור מלא וטעינת תמונות
  await new Promise(resolve => setTimeout(resolve, 4000));

  // 3. הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
