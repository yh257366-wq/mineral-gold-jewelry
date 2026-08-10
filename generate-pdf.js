const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. קריאת קובץ ה-HTML או הנתונים ישירות מהתיקייה
  const htmlPath = path.join(__dirname, 'index.html');
  
  // טעינת הקובץ הישיר כ-File URL
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // 2. הזרקת CSS שכופה הצגה אך ורק של הגלריה והסרת כל השאר
  await page.addStyleTag({
    content: `
      body * { visibility: hidden !important; }
      #view-gallery, #view-gallery * { visibility: visible !important; }
      #view-gallery { 
        position: absolute !important; 
        left: 0 !important; 
        top: 0 !important; 
        width: 100% !important; 
        display: block !important; 
      }
      .view-section:not(#view-gallery) { display: none !important; }
    `
  });

  // 3. הרצת רינדור הגלריה ישירות
  await page.evaluate(() => {
    if (typeof renderGallery === 'function') {
      renderGallery();
    }
  });

  // השהייה של 2 שניות לטעינת התמונות
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
