const axios = require('axios');
const envs = require('../environment');
const { getTokenTelegram  } = require('../cloudflare.js');

async function getChatId(tokenBot) {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${tokenBot}/getUpdates`);
        
        if (response.data.result.length === 0) {
            throw new Error("No hay mensajes recientes en el bot. Envíale un mensaje primero.");
        }

        return response.data.result[0].message.chat.id;
    } catch (error) {
        console.error('Error al obtener Chat ID:', error);
        return null;
    }
}

async function sendMessage(tokenTelegram, message) {
    try {
        const chatId = await getChatId(envs.tokenTelegram);
        if (!chatId) return;

        await axios.post(`https://api.telegram.org/bot${tokenTelegram}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: "HTML"
        });
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
    }
}

async function sendNotificationsTelegram(updates, data, UserID) {
    try {
        const tokenTelegram  = await getTokenTelegram(UserID);
        if(tokenTelegram){
            if (updates.updatedPrices.length > 0) {
                console.log("📢 Bajada de precios detectada");
                for (const id of updates.updatedPrices) {
                    const encontrado = data.find(item => item.id == id);
                    if (encontrado) {
                        const message = `<b>📢Bajada de precios📢</b>\n` + 
                                        `<b>Precio:</b> <strong>${encontrado.price}</strong>\n` + 
                                        `<b>Ubicación:</b> ${encontrado.location}\n` + 
                                        `<b>m²:</b> ${encontrado.m2} - ` + 
                                        `<b>Hab:</b> ${encontrado.habitaciones}\n` + 
                                        `<a href="${encontrado.url}">🔗 Ver más</a>`;
                        await sendMessage(tokenTelegram, message);
                    }
                }
            }
            if (updates.newHouses.length > 0) {
                console.log("🏠 Nueva casa disponible");
                for (const id of updates.newHouses) {
                    const encontrado = data.find(item => item.id == id);
                    if (encontrado) {
                        const message = `<b>Precio:</b> <strong>${encontrado.price}</strong>\n` + 
                                        `<b>Ubicación:</b> ${encontrado.location}\n` + 
                                        `<b>m²:</b> ${encontrado.m2} - ` + 
                                        `<b>Habitaciones:</b> ${encontrado.habitaciones}\n` + 
                                        `<a href="${encontrado.url}">🔗 Ver más</a>`;     
                        await sendMessage(tokenTelegram, message);
                    }
                }
            }
        } else {
            throw new Error("El usuario parece no tener Token");
        }
    } catch (error) {
        console.error('❌ Error al enviar notificaciones:', error);
    }
}


module.exports = { sendNotificationsTelegram };
