const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. הגדרת גודל מסך מספק להצגה מלאה
  await page.setViewport({ width: 1200, height: 800 });

  // 2. טעינת דף האתר דרך קובץ ה-HTML
  const htmlPath = path.join(__dirname, 'index.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // 3. הזרקת CSS בסיסי בלבד שמבטיח שרק תצוגת הגלריה גלויה
  await page.addStyleTag({
    content: `
      .view-section { display: none !important; }
      #view-gallery { display: block !important; }
    `
  });

  // 4. השהייה קצרה לוודא שכל התמונות והעיצובים נטענו כראוי
  await new Promise(resolve => setTimeout(resolve, 4000));

  // 5. הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
