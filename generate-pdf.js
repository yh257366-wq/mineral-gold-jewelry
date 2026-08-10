const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // טעינת הדף והפנייה ישירה לתצוגת הגלריה
  await page.goto('http://localhost:8080/index.html#gallery', { 
    waitUntil: 'networkidle2', 
    timeout: 30000 
  });

  // הפעלת פונקציית הצגת הגלריה בתוך הדף במידה ויש צורך
  await page.evaluate(() => {
    if (typeof showView === 'function') {
      showView('gallery');
    }
  });

  // המתנה לטעינת רשת המוצרים
  await page.waitForSelector('#products-grid', { timeout: 10000 }).catch(() => {
    console.log('Notice: products-grid element not found');
  });

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
