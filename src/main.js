const { idealista } = require('./scrapper/idealista.js');  
const { habitaclia } = require('./scrapper/habitaclia.js');   
const { updateOrInsertHouses  } = require('./cloudflare.js');
const { sendNotificationsTelegram } = require('./notification/telegram.js');

const fs = require('fs');
const path = require('path');

// Función principal asíncrona
async function main() {
    try {
        const idealistaData = await idealista();
        const habitacliaData = await habitaclia();
        //console.log(habitacliaData);
       /*const pathTxt = path.join(__dirname, "data", "dataHabitaclia.txt");
        const data = fs.readFileSync(pathTxt, 'utf8');
        const habitacliaData = JSON.parse(data);*/
        const d1Data = await updateOrInsertHouses([...idealistaData, ...habitacliaData], 1);
        console.log(d1Data);
        sendNotificationsTelegram(d1Data, [...idealistaData, ...habitacliaData], 1);

    } catch (error) {
        console.error("❌ Error al ejecutar las funciones:", error);
    }
}

main();
