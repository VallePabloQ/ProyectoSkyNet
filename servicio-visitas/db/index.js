const { Pool } = require('pg');
require('dotenv').config();

// Configuración para Nube (Railway) vs Local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.RAILWAY_ENVIRONMENT ? { rejectUnauthorized: false } : false
});

// Si no hay connection string, avisar del error en consola
if (!process.env.DATABASE_URL) {
    console.error("ERROR FATAL: No existe la variable DATABASE_URL. El sistema intentará conectarse a localhost y fallará.");
}

module.exports = {
  query: (text, params) => pool.query(text, params),
};