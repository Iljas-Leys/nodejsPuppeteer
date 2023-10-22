import puppeteer from 'puppeteer';
import * as fs from 'node:fs';

// Scrape Playstations
async function scrapePlaystations() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
  await page.goto('https://www.coolblue.be/nl/consoles/playstation5', { waitUntil: 'networkidle0' });

  const pageTitle = await page.$eval('.filtered-search__header h1', (element) => element.textContent.trim());

  const products = await page.$$eval('.product-card', (rows) => {
    return rows.map((row) => ({
      productTitle: row.querySelector('.product-card__title').textContent.trim(),
      price: Number(row.querySelector('.sales-price__current').textContent.trim().replace(/[^0-9]/g, '')),
      beschikbaar: row.querySelector('.color--available') != null ? "ja" : "nee",
    }));
  });

  const filteredProducts = products.filter((product) => {
    return product.price > 600;
  });

  console.log(pageTitle);
  //console.log(products);
  console.log(filteredProducts);

  try {
    if (fs.existsSync("output.json")) {
      console.log('Er is al een bestand met de naam "output.json".')
    }
    else{
      fs.writeFile('output.json', JSON.stringify(filteredProducts), (err) => {
        if (err) throw err;
        console.log('Het bestand is opgeslagen naar output.json!');
      });
    }
  } catch(err) {
    console.error(err)
  }

  await browser.close();
}

export { scrapePlaystations };
