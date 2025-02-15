const axios = require('axios');
const cheerio = require('cheerio');

// Función para obtener el HTML de una URL
async function getHTML(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    return html;
  } catch (err) {
    console.error('Error al obtener el HTML:', err);
    throw err;
  }
}

// Función para extraer los datos de las casas desde el HTML
function extractHouses(html) {
  const $ = cheerio.load(html);
  const houses = [];

  $('article.item').each((i, house) => {
    // Se obtiene el ID de la casa
    const id = $(house).attr('data-element-id');
    // Se extrae el precio (por ejemplo, "174.000 €")
    const price = $(house).find('.item-price').text().trim();

    // Extraer los detalles desde los spans dentro de '.item-detail-char'
    // Se asume que:
    //   - El primer span contiene los m2 (ej. "60m²")
    //   - El segundo span contiene el número de habitaciones (ej. "2")
    //   - El tercer span contiene la ubicación (ej. "Terrassa - Vallparadís - Antic Poble de Sant Pere")
    const detailArray = $(house)
      .find('.item-detail-char span')
      .map((i, span) => $(span).text().trim())
      .get();

    // Procesar m2: extraer el número
    let habitaciones = detailArray[0] || "";
    habitaciones = parseInt(habitaciones.replace(/[^\d]/g, '')) || 0;
    
    // Procesar habitaciones: intentar extraer el número
    let m2 = detailArray[1] || "No disponible";
    const habNum = parseInt(m2.replace(/[^\d]/g, ''));
    m2 = isNaN(habNum) ? m2 : habNum;
    
    // La ubicación se extrae del tercer span
    const location = detailArray[2] || "";

    if (id && price) {
      houses.push({
        id: id,
        url: "https://www.idealista.com/" + id,
        price: price,
        location: location,
        m2: m2,
        habitaciones: habitaciones
      });
    }
  });

  return houses;
}

// Función principal que gestiona el flujo de extracción
async function idealista() {
  try {
    const url = 'https://www.idealista.com/areas/venta-viviendas/con-precio-hasta_220000,precio-desde_150000,metros-cuadrados-mas-de_80,metros-cuadrados-menos-de_140,pisos,solo-pisos,chalets-independientes,chalets-pareados,chalets-adosados,casas-de-pueblo,duplex,aticos,de-dos-dormitorios,de-tres-dormitorios,de-cuatro-cinco-habitaciones-o-mas,dos-banos,tres-banos-o-mas,obra-nueva,para-reformar,buen-estado/?shape=%28%28%28wxt%7CFgaeKba%40kSrDql%40tV_FmEqz%40cc%40g%60%40kx%40lEuTvIgN%7ET_EbA%3FjfA%60MlTh%5EN%60a%40b%5E%29%29%29';
    const html = await getHTML(url);
    const houses = extractHouses(html);
    // Si deseas procesar o guardar los datos, puedes llamar a:
    // handleHousesData(houses);
    return houses;
  } catch (err) {
    console.error('Error al obtener la página:', err);
    return [];
  }
}

module.exports = { idealista };
