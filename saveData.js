const fs = require('fs');
const path = './data.json';  // Ruta del archivo JSON donde almacenamos los IDs

// Función para leer los IDs almacenados desde el archivo JSON
function readStoredIds() {
    try {
        const data = fs.readFileSync(path, 'utf-8');
        return JSON.parse(data); // Si el archivo existe, retorna los datos del JSON
    } catch (err) {
        // Si el archivo no existe o está vacío, devuelve un objeto vacío
        return {};
    }
}

// Función para guardar los nuevos IDs en el archivo JSON
function saveIds(ids) {
    fs.writeFileSync(path, JSON.stringify(ids, null, 2), 'utf-8');
}

// Función para añadir una nueva casa con ID y precio
function addHouse(id, price, detail) {
    const storedIds = readStoredIds();  // Leer los IDs ya guardados
    if (!storedIds[id]) {  // Si el ID no existe
        storedIds[id] = { price: price, hab: detail[0], m2: detail[1], piso: detail[2] };
    }
    saveIds(storedIds);  // Guardar los nuevos IDs en el archivo JSON
}

// Función para actualizar el precio de una casa si el ID ya existe
function updateHousePrice(id, price) {
    const storedIds = readStoredIds();  // Leer los IDs ya guardados
    if (storedIds[id]) {
        // Si el ID existe, actualiza el precio solo si es diferente
        if (storedIds[id].price !== price) {
            storedIds[id].price = price;  // Actualizar el precio
            console.log(`Precio actualizado para el ID: ${id}`);
        }
    }
    saveIds(storedIds);  // Guardar los cambios en el archivo JSON
}

// Función para obtener un listado de las casas que tienen un ID específico
function getHousesByIds(idsArray) {
    const storedIds = readStoredIds();
    const result = [];
    idsArray.forEach(id => {
        if (storedIds[id]) {
            result.push({
                id: id,
                price: storedIds[id].price
            });
        }
    });
    return result;
}

// Función para manejar el flujo de añadir o actualizar las casas
function handleHousesData(ids, prices, details = 'No disponible', location = 'No disponible') {
    const storedIds = readStoredIds();
    const newIds = [];  // Array para almacenar los nuevos IDs
    let updatedIds = { ...storedIds };  // Copia de los datos para actualizar

    ids.forEach((id, index) => {
        const price = prices[index];
        const detail = details[index];

        if (storedIds[id]) {
            // Si el ID ya existe, validamos el precio
            if (storedIds[id].price !== price) {
                updateHousePrice(id, price);  // Actualizar precio
            }
        } else {
            // Si el ID es nuevo, lo añadimos y lo almacenamos en newIds
            addHouse(id, price, detail);
            newIds.push(id);
        }
    });

    // Al final, mostramos todos los nuevos IDs añadidos
    if (newIds.length > 0) {
        return newIds;
    }
}

module.exports = {
    readStoredIds,
    saveIds,
    addHouse,
    updateHousePrice,
    getHousesByIds,
    handleHousesData
};
