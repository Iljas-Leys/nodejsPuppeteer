import puppeteer from 'puppeteer';
import * as fs from 'node:fs';

// Scrape Laptops
async function scrapeLaptops() {
  let products = new Array();
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
  await page.goto('https://www.coolblue.be/nl/laptops/filter', { waitUntil: 'networkidle0' });
  const pageTitle = await page.$eval('.filtered-search__header h1', (element) => element.textContent.trim());

  let count = 0;
  let linkVolgendePagina;
  do{
    count++;
    if (count > 1){
      await page.goto(linkVolgendePagina);
    }
    
    let paginationLinkElements = await page.$$('a[rel="next"]');
    linkVolgendePagina = (await Promise.all(paginationLinkElements.map(async (t) => {
      return await t.evaluate(x => x.href);
    })))[0];

    products.push(await page.$$eval('.product-card', (rows) => {
      return rows.map((row) => ({
        naam: row.querySelector('.product-card__title').textContent.trim(),
        prijs: Number(row.querySelector('.sales-price__current').textContent.trim().replace(/[^0-9]/g, '')),
        aantalReviews: Number(row.querySelector('.review-rating__reviews').textContent.trim().replace(/[^0-9]/g, '')),
        beschikbaar: row.querySelector('.color--available') != null ? "ja" : "nee",
        specificaties: row.querySelector('.product-card__highlights').textContent.replace(/\s/g, '')
      }));
    }));
  }while(linkVolgendePagina != null)
  
  let minimumprijs = 100;
  let maximumprijs = 1000;
  let minimumAantalReviews = 10;
  let isBeschikbaar = "ja";
  const filteredProducts = products.filter((product) => {
    //return product.prijs > minimumprijs && product.prijs < maximumprijs && product.aantalReviews > minimumAantalReviews && product.beschikbaar == isBeschikbaar;
    return true;
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

export { scrapeLaptops };
