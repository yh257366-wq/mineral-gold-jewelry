const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. טעינת קובץ index.html ישירות מנתיב הקבצים
  const indexPath = path.join(__dirname, 'index.html');
  await page.goto(`file://${indexPath}`, { waitUntil: 'load' });

  // 2. הזרקת קוד שמציג את כל המוצרים עם המפרט והשדרוגים ומסדר את הלהאוט להדפסה
  await page.evaluate(() => {
    // הסתרת אלמנטים מיותרים של האתר (תפריטים, עגלת קניות, טפסים)
    const style = document.createElement('style');
    style.innerHTML = `
      header, footer, .cart-btn, .nav-bar, .view-section:not(#view-gallery) { display: none !important; }
      #view-gallery { display: block !important; visibility: visible !important; }
      body { background: #fff !important; padding: 20px; }
      .product-card { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    `;
    document.head.appendChild(style);

    // במידה ויש פונקציית טעינה פנימית - הרצתה
    if (typeof showView === 'function') showView('gallery');
    if (typeof renderGallery === 'function') renderGallery();
  });

  // השהייה של 3 שניות להבטחת טעינת תמונות
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
