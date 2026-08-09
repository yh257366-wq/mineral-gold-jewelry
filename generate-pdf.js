const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // טעינת השרת המקומי
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });

  // המתנה לטעינת אלמנט המוצרים
  try {
    await page.waitForSelector('#products-grid > *', { timeout: 15000 });
  } catch (error) {
    console.log('Warning: products grid did not populate in time');
  }

  // טעינת כל התמונות במלואן לפני הנפקת ה-PDF
  await page.evaluate(async () => {
    const selectors = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      selectors.map(img => {
        if (img.complete) return;
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  });

  // יצירת קובץ ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
