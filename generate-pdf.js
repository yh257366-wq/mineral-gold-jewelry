const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. טעינת הדף דרך השרת המקומי עם ה-hash של הגלריה
  await page.goto('http://localhost:8080/index.html#gallery', { 
    waitUntil: 'networkidle0', 
    timeout: 30000 
  });

  // 2. הפעלת פונקציות הרינדור של האפליקציה באופן מפורש
  await page.evaluate(() => {
    if (typeof showView === 'function') {
      showView('gallery');
    }
    if (typeof renderGallery === 'function') {
      renderGallery();
    }
  });

  // 3. המתנה אקטיבית להופעת כרטיס מוצר ראשון ב-DOM
  await page.waitForSelector('#products-grid .product-card', { timeout: 15000 });

  // 4. הזרקת CSS להסתרת שאר התצוגות והצגת הגלריה בלבד
  await page.addStyleTag({
    content: `
      .view-section:not(#view-gallery) { display: none !important; }
      #view-gallery { display: block !important; }
    `
  });

  // השהייה קצרה לוודא טעינת תמונות
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
