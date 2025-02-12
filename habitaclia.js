const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function habitaclia() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
   

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    await page.goto('https://www.habitaclia.com/viviendas-terrassa.htm?hab=2&ban=1&pmax=240000&codzonas=303,309,305,306,501,504,503,502&coddists=300,500', {
        waitUntil: 'domcontentloaded'
    });

    await page.waitForSelector('article.js-list-item', { timeout: 10000 });

    const data = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article.js-list-item')).map(house => {
            const detailsText = house.querySelector('.list-item-feature')?.innerText.trim() || 'No disponible';
            
            // Expresiones regulares para extraer datos
            const m2Match = detailsText.match(/(\d+)m2/);
            const roomsMatch = detailsText.match(/(\d+)\s*habitaciones?/);

            return {
                id: house.getAttribute('data-id'),
                price: house.querySelector('.font-2')?.innerText.trim() || 'No disponible',
                location: house.querySelector('.list-item-location span')?.innerText.trim() || 'No disponible',
                m2: m2Match ? parseInt(m2Match[1]) : 'No disponible',
                habitaciones: roomsMatch ? parseInt(roomsMatch[1]) : 'No disponible'
            };
        });
    });

    console.log(data);
    await browser.close();
}

module.exports = { habitaclia };
