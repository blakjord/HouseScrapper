const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function habitaclia() {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    // Establecer User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');

    // Establecer Headers personalizados
    await page.setExtraHTTPHeaders({
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'es-ES,es;q=0.9',
        'priority': 'u=0, i',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'sec-gpc': '1',
        'upgrade-insecure-requests': '1'
    });

    // Navegar a la página
    await page.goto('https://www.habitaclia.com/viviendas-terrassa.htm?hab=2&ban=1&pmax=240000&codzonas=303,309,305,306,501,504,503,502&coddists=300,500', {
        waitUntil: 'domcontentloaded'
    });

    // Esperar a que se carguen los elementos de los inmuebles
    await page.waitForSelector('article.js-list-item', { timeout: 10000 });

    // Extraer datos
    const data = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article.js-list-item')).map(house => {
            const detailsText = house.querySelector('.list-item-feature')?.innerText.trim() || 'No disponible';

            // Expresiones regulares para extraer datos
            const m2Match = detailsText.match(/(\d+)\s*m2/);
            const roomsMatch = detailsText.match(/(\d+)\s*habitaciones?/);

            // Seleccionamos el enlace dentro de cada artículo
            const urlHouseElement = house.querySelector('.list-item-title a');
            let urlHouse = urlHouseElement ? urlHouseElement.getAttribute('href') : null;
            if (urlHouse) {
                urlHouse = urlHouse.split('.htm')[0] + '.htm'; // Mantiene solo hasta ".htm"
            }

            return {
                id: house.getAttribute('data-id') || 'No disponible',
                url: urlHouse ? `${urlHouse}` : 'No disponible',
                price: house.querySelector('.font-2')?.innerText.trim() || 'No disponible',
                location: house.querySelector('.list-item-location span')?.innerText.trim() || 'No disponible',
                m2: m2Match ? parseInt(m2Match[1]) : 'No disponible',
                habitaciones: roomsMatch ? parseInt(roomsMatch[1]) : 'No disponible'
            };
        });
    });

    await browser.close();
    return data;
}

module.exports = { habitaclia };
