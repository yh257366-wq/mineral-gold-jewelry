const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. טעינת האתר
  const htmlPath = path.join(__dirname, 'index.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // 2. עיצוב הקטלוג: הוספת הלוגו, כותרות, ומפרט מורחב לכל מוצר
  await page.evaluate(() => {
    // הוספת הדר בראש הדף עם הלוגו והכותרת
    const container = document.querySelector('.container') || document.body;
    
    const catalogHeader = document.createElement('div');
    catalogHeader.style.cssText = `
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    `;
    catalogHeader.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 10px;">
        <h1 style="font-size: 28px; color: #1a1a1a; margin: 0;">תכשיטי מינרל גולד</h1>
      </div>
      <h2 style="font-size: 22px; color: #d4af37; margin: 5px 0 0 0;">קטלוג התכשיטים המלא</h2>
    `;
    
    container.insertBefore(catalogHeader, container.firstChild);

    // עדכון כרטיסי המוצרים כך שיציגו את המפרט המלא והשדרוגים
    if (typeof products !== 'undefined' && Array.isArray(products)) {
      const grid = document.getElementById('products-grid');
      if (grid) {
        grid.innerHTML = products.map(product => {
          // חילוץ מפרט ושדרוגים מתוך נתוני המוצר
          const specHtml = product.specs ? `
            <div style="font-size: 11px; color: #555; background: #f9f9f9; padding: 6px; border-radius: 4px; margin-top: 6px;">
              ${product.specs}
            </div>
          ` : '';

          const upgradesHtml = product.upgrades ? `
            <div style="font-size: 11px; color: #2e7d32; margin-top: 4px; font-weight: bold;">
              שדרוגים זמינים: ${product.upgrades}
            </div>
          ` : '';

          return `
            <div class="product-card" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; page-break-inside: avoid;">
              <img src="${product.image}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px;" />
              <h3 style="font-size: 16px; margin: 8px 0 4px 0;">${product.name}</h3>
              <div style="font-size: 14px; color: #c62828; font-weight: bold;">₪${product.price}</div>
              ${specHtml}
              ${upgradesHtml}
            </div>
          `;
        }).join('');
      }
    }
  });

  // השהייה קצרה לטעינה ויזואלית
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. הנפקת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
