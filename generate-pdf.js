const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1. קריאת קובץ index.html
  const indexPath = path.join(__dirname, 'index.html');
  await page.goto(`file://${indexPath}`, { waitUntil: 'domcontentloaded' });

  // 2. הזרקת קוד שמחלץ את הנתונים ובונה קטלוג נקי מאפס
  await page.evaluate(() => {
    // במידה ויש פונקציית טעינה
    if (typeof renderGallery === 'function') {
      try { renderGallery(); } catch (e) {}
    }

    // הזרקת סטייל ייעודי שמציג את כל האלמנטים ומעלים סרגלים
    const style = document.createElement('style');
    style.innerHTML = `
      header, footer, nav, .cart-btn, .nav-bar, #view-summary, .view-section:not(#view-gallery) { 
        display: none !important; 
      }
      #view-gallery, #products-grid { 
        display: grid !important; 
        grid-template-columns: repeat(2, 1fr) !important; 
        gap: 20px !important; 
        visibility: visible !important; 
        opacity: 1 !important;
      }
      body { 
        background: #ffffff !important; 
        padding: 20px !important; 
      }
      .product-card { 
        break-inside: avoid !important; 
        page-break-inside: avoid !important; 
        border: 1px solid #e0e0e0 !important; 
        padding: 15px !important; 
        border-radius: 8px !important; 
        display: block !important;
      }
      img { 
        max-width: 100% !important; 
        height: auto !important; 
        display: block !important; 
      }
    `;
    document.head.appendChild(style);
  });

  // השהייה של 5 שניות לטעינת כל התמונות בזיכרון
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 3. יצירת ה-PDF
  await page.pdf({
    path: 'catalog.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' }
  });

  await browser.close();
})();
