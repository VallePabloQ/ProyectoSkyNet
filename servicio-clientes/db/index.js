// Importar el "conector" de Postgres
const { Pool } = require('pg');

// Importar y configurar dotenv para leer el archivo .env
require('dotenv').config();

// Crear un "pool" de conexiones.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Exportamos una función para hacer consultas
module.exports = {
    query: (text, params) => pool.query(text, params),
};