const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. טעינת הדף
  await page.goto('http://localhost:8080/index.html#gallery', { 
    waitUntil: 'networkidle0', 
    timeout: 30000 
  });

  // 2. הזרקת CSS מפורש שמסתיר את כל האזורים האחרים ומציג רק את הגלריה
  await page.addStyleTag({
    content: `
      .view-section { display: none !important; }
      #view-gallery { display: block !important; }
    `
  });

  // 3. הפעלת הניווט והטעינה בתוך הדף
  await page.evaluate(() => {
    if (typeof showView === 'function') {
      showView('gallery');
    }
    if (typeof renderGallery === 'function') {
      renderGallery();
    }
  });

  // 4. השהייה קצרה לוודא שהאלמנטים והתמונות נטענו
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 5. הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
