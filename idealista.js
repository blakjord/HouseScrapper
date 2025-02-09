const axios = require('axios');
const cheerio = require('cheerio');
const { handleHousesData } = require('./saveData.js');  // Importar las funciones

// Función para obtener el HTML de una URL
async function getHTML(url) {
    const { data: html } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    });
    return html;
}

function extractIds(html) {
    const $ = cheerio.load(html);
    const ids = [];
    const prices = [];
    const details = [];

    $('article.item').each((i, house) => {
        const id = $(house).attr('data-element-id');
        const price = $(house).find('.item-price').text().trim();
        const detail = $(house).find('.item-detail-char').find('span').map((i, span) => $(span).text().trim()).get();
        if (id && price) {
            ids.push(id);
            prices.push(price);
            details.push(detail);
        }
    });
    handleHousesData(ids, prices, details)
}

// Función principal que gestiona el flujo
async function idealista() {
    try {
        const url = 'https://www.idealista.com/areas/venta-viviendas/con-precio-hasta_220000,precio-desde_150000,metros-cuadrados-mas-de_80,metros-cuadrados-menos-de_140,pisos,solo-pisos,chalets-independientes,chalets-pareados,chalets-adosados,casas-de-pueblo,duplex,aticos,de-dos-dormitorios,de-tres-dormitorios,de-cuatro-cinco-habitaciones-o-mas,dos-banos,tres-banos-o-mas,obra-nueva,para-reformar,buen-estado/?shape=%28%28%28wxt%7CFgaeKba%40kSrDql%40tV_FmEqz%40cc%40g%60%40kx%40lEuTvIgN%7ET_EbA%3FjfA%60MlTh%5EN%60a%40b%5E%29%29%29';
        const html = await getHTML(url);
        extractIds(html);  // Extraer los IDs y precios y validarlos

    } catch (err) {
        console.error('Error al obtener la página:', err);
    }
}
module.exports = { idealista };
