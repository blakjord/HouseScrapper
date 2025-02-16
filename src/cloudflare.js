const fetch = require('node-fetch');
const envs = require('./environment');

// Configuración de la conexión a Cloudflare
const CLOUDFLARE_URL = `https://api.cloudflare.com/client/v4/accounts/${envs.accountIdCloudflare}/d1/database/${envs.databaseIdCloudflare}/query`;
const CLOUDFLARE_HEADERS = {
  'Authorization': `Bearer ${envs.keyCloudflare}`,
  'Content-Type': 'application/json'
};

// Función genérica para ejecutar una consulta en Cloudflare
async function executeCloudflareQuery(sql) {
  const body = JSON.stringify({ sql });
  try {
    const response = await fetch(CLOUDFLARE_URL, {
      method: 'POST',
      headers: CLOUDFLARE_HEADERS,
      body
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare query error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

// Función para obtener el Token de Telegram
async function getTokenTelegram(UserID) {
  const sql = `SELECT TokenTelegram 
               FROM Users
               WHERE UserID = ${UserID} LIMIT 1`;
  try {
    const result = await executeCloudflareQuery(sql);
    if (result.success) {
      return result.result[0].results[0].TokenTelegram; // Devuelve el arreglo de casas
    }
    return false;
  } catch (error) {
    console.error("Error al obtener el Token de Telegram desde Cloudflare:", error);
    return false;
  }
}

// Función para validar y limpiar el precio
function validateAndCleanPrice(price) {
  const cleanedPrice = price.trim().replace('€', '').replace(/\./g, '').replace(/\s+/g, '');
  const numericPrice = parseFloat(cleanedPrice);
  if (isNaN(numericPrice)) {
    throw new Error(`El precio "${price}" no es un número válido.`);
  }
  return numericPrice;
}

// Función para obtener todas las casas existentes en la base de datos
async function getHousesFromDatabase(UserID) {
  const sql = `SELECT H.* 
               FROM Houses AS H
               INNER JOIN Users_Houses AS UH ON H.HouseID = UH.HouseID
               WHERE UH.UserID = ${UserID};`;
  try {
    const result = await executeCloudflareQuery(sql);
    if (result.success) {
      return result.result[0].results; // Devuelve el arreglo de casas
    }
    return [];
  } catch (error) {
    console.error("Error al obtener casas:", error);
    return [];
  }
}

// Función para actualizar o insertar casas de forma agrupada
async function updateOrInsertHouses(habitacliaData, UserID) {
  const housesInDb = await getHousesFromDatabase(UserID);
  const housesToUpdate = [];
  const housesToInsert = [];
  const housesToRelate = [];

  for (let house of habitacliaData) {
    try {
      const cleanedPrice = validateAndCleanPrice(house.price);
      const existingHouse = housesInDb.find(h => h.HouseID == house.id);

      if (existingHouse) {
        const isRelated = housesInDb.some(h => h.HouseID == house.id);
        if (isRelated) {
          if (existingHouse.Price !== cleanedPrice) {
            housesToUpdate.push({ ...house, price: cleanedPrice });
          }
        } else {
          housesToRelate.push({ HouseID: house.id, UserID });
        }
      } else {
        housesToRelate.push({ HouseID: house.id, UserID });
        housesToInsert.push({ ...house, price: cleanedPrice });
      }
    } catch (error) {
      console.error(`Error al procesar la casa ${house.id}: ${error.message}`);
    }
  }

  const result = {
    updatedPrices: [],
    newHouses: [],
    newRelations: []
  };

  if (housesToUpdate.length > 0) {
    await updateHousePrices(housesToUpdate);
    result.updatedPrices = housesToUpdate.map(house => house.id);
  }

  if (housesToInsert.length > 0) {
    const [insertedIds] = await insertHouses(housesToInsert);
    result.newHouses = insertedIds;
  }

  if (housesToRelate.length > 0) {
    await relateHousesToUser(housesToRelate);
    result.newRelations = housesToRelate.map(house => house.HouseID);
  }

  return result;
}

// Función para insertar la relación entre las casas y el usuario
async function relateHousesToUser(houses) {
  const values = houses.map(house => `(${house.HouseID}, ${house.UserID})`).join(', ');
  const sql = `INSERT INTO Users_Houses (HouseID, UserID) VALUES ${values};`;
  try {
    await executeCloudflareQuery(sql);
    console.log('Relación entre casas y usuario insertada correctamente');
  } catch (error) {
    console.error('Error al insertar relación entre casas y usuario:', error);
  }
}

// Función para actualizar los precios de varias casas
async function updateHousePrices(houses) {
  const updates = houses.map(house => `WHEN ${house.id} THEN ${house.price}`).join(' ');
  const sql = `UPDATE Houses SET Price = CASE HouseID ${updates} ELSE Price END WHERE HouseID IN (${houses.map(house => house.id).join(', ')});`;

  try {
    await executeCloudflareQuery(sql);
    console.log('Precios actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar precios:', error);
  }
}

// Función para insertar casas
async function insertHouses(houses) {
  if (houses.length === 0) return [ [], [] ];
  // Escapar comillas simples en la URL para evitar errores SQL
  const escapeString = str => str.replace(/'/g, "''");
  // Crear la lista de valores para el INSERT
  const values = houses
    .map(house => `(${house.id}, ${house.price}, '${escapeString(house.url)}')`)
    .join(', ');
  
  // Utilizamos RETURNING para obtener las filas insertadas
  const sql = `
    INSERT OR IGNORE INTO Houses (HouseID, Price, Url)
    VALUES ${values}
    RETURNING HouseID, Price, Url;
  `;

  try {
    const result = await executeCloudflareQuery(sql);
    let inserted = [];
    if (result.success && result.result[0].results.length) {
      inserted = result.result[0].results;
    }
    // Extraer solo los IDs de las casas insertadas
    const insertedIds = inserted.map(row => row.HouseID);
    // Las casas ignoradas son aquellas que no están en insertedIds
    const ignoredIds = houses
      .filter(house => !insertedIds.includes(house.id))
      .map(house => house.id);

    return [ insertedIds, ignoredIds ];
  } catch (error) {
    console.error('Error al insertar casas:', error);
    // Si ocurre un error, se retornan arrays vacíos para insertadas y todos los IDs para ignoradas
    return [ [], houses.map(house => house.id) ];
  }
}


module.exports = { updateOrInsertHouses, getTokenTelegram };
