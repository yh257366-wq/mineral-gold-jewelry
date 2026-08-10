const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.goto('http://localhost:8080/index.html#gallery', { 
    waitUntil: 'networkidle0', 
    timeout: 30000 
  });

  // הפעלת פונקציית הצגת הגלריה בתוך הדף במידה ויש צורך
  await page.evaluate(() => {
    if (typeof showView === 'function') {
      showView('gallery');
    }
  });

  // המתנה לטעינה מלאה של כרטיסי המוצרים בתוך הגלריה
  await page.waitForSelector('#products-grid .product-card', { timeout: 10000 });

  // השהייה קצרה לטעינת התמונות והעיצוב
  await new Promise(resolve => setTimeout(resolve, 3000));

  // הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
