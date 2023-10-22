import puppeteer from 'puppeteer';
import * as fs from 'node:fs';

// Scrape activiteiten Kasterlee
// Somige evenementen staan dubbel op de site van Kasterlee. Dit is geen fout van het programma.
async function scrapeActiviteitenKasterlee() {
  let evenementen = new Array();
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
  await page.goto('https://www.kasterlee.be/activiteitenoverzicht.aspx#', { waitUntil: 'networkidle0' });
  const pageTitle = await page.$eval('#filterstatus', (element) => element.textContent.trim());

  let count = 0;
  let linkVolgendePagina;
  do{
    count++;
    if (count > 1){
      await page.goto(linkVolgendePagina);
    }
    
    let paginationLinkElements = await page.$$('.next');
    linkVolgendePagina = (await Promise.all(paginationLinkElements.map(async (t) => {
      return await t.evaluate(x => x.href);
    })))[0];

    evenementen.push(await page.$$eval('#actcontainer .list .item', (rows) => {
      return rows.map((row) => ({
        naam: row.querySelector('.cont h3').textContent,
        maand: row.querySelector('.date .month').textContent,
        dag: row.querySelector('.date .day').textContent,
        link: row.querySelector('a').href
      }));
    }));
  }while(linkVolgendePagina != null)
  
  let filterNaamOpRegex = new RegExp("dag");
  const filteredEvenementen = evenementen.filter((evenement) => {
    //return evenement.naam.match(re);
    return true;
  });
  
  console.log(pageTitle);
  console.log(filteredEvenementen);

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

export { scrapeActiviteitenKasterlee };
