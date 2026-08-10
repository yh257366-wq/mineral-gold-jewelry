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

  // הגדרת תצוגה בגודל מסך מלא כדי לוודא שכל הגריד נטען
  await page.setViewport({ width: 1280, height: 1000 });

  // 1. טעינת index.html דרך הנתיב המקומי
  const indexPath = path.join(__dirname, 'index.html');
  await page.goto(`file://${indexPath}#gallery`, { 
    waitUntil: ['load', 'networkidle0'],
    timeout: 60000 
  });

  // 2. ווידוא שפונקציות הרינדור של האתר רצו
  await page.evaluate(async () => {
    if (typeof showView === 'function') showView('gallery');
    if (typeof renderGallery === 'function') renderGallery();

    // הסתרת סרגלים ורכיבי ניווט בלבד
    const style = document.createElement('style');
    style.innerHTML = `
      header, footer, nav, .cart-btn, .nav-bar, #view-summary { display: none !important; }
      #view-gallery { display: block !important; visibility: visible !important; }
      .product-card { break-inside: avoid; page-break-inside: avoid; }
    `;
    document.head.appendChild(style);

    // המתנה אקטיבית לטעינת כל התמונות בדף
    const selectors = Array.from(document.querySelectorAll('img'));
    await Promise.all(selectors.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  });

  // השהייה של 3 שניות להבטחת רינדור סופי
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
