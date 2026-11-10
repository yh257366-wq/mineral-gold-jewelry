const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// width = רוחב מקסימלי בפיקסלים לכל תמונה (בקטלוג התמונה מוצגת ב-62 מ"מ)
// 1200px ≈ 490 DPI בהדפסה
const IMG_WIDTH = 1200;
const IMG_QUALITY = 85;
const BG = '#f0eadd'; // אותו צבע רקע כמו .pic img בתבנית

const cache = new Map();

async function getResized(url) {
  if (cache.has(url)) return cache.get(url);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  const out = await sharp(input)
    .rotate()
    .resize({ width: IMG_WIDTH, withoutEnlargement: true })
    .flatten({ background: BG })
    .jpeg({ quality: IMG_QUALITY, mozjpeg: true })
    .toBuffer();

  cache.set(url, out);
  return out;
}

(async () => {
  let browser;
  try {
    console.log('Starting Puppeteer...');
    browser = await puppeteer.launch({
      protocolTimeout: 180000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });

    // הקטנת תמונות בזמן הטעינה (האתר עצמו נשאר עם התמונות המקוריות)
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      if (req.isInterceptResolutionHandled()) return;
      const url = req.url();

      // לוגו, פונטים וכל השאר עוברים כרגיל (הלוגו נשאר כדי לשמור שקיפות)
      if (req.resourceType() !== 'image' || !url.startsWith('http') || /logo/i.test(url)) {
        return req.continue();
      }
      try {
        const body = await getResized(url);
        await req.respond({ status: 200, contentType: 'image/jpeg', body });
      } catch (e) {
        console.warn(`Resize failed, using original: ${url} (${e.message})`);
        if (!req.isInterceptResolutionHandled()) req.continue();
      }
    });

    const templateUrl = pathToFileURL(path.join(__dirname, 'pdf-template.html')).href;
    console.log('Loading pdf-template.html...');
    await page.goto(templateUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    await page.waitForSelector('.item', { timeout: 10000 }).catch(() => {
      console.log('לא נמצאו פריטי מוצרים בזמן הקצוב, מפיק PDF לפי המצב הקיים.');
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Generating PDF...');
    const pdfPath = path.join(__dirname, 'catalog.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });

    const mb = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(1);
    console.log(`PDF CREATED SUCCESSFULLY: ${mb} MB`);

  } catch (error) {
    console.error('PDF GENERATION FAILED');
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
})();
