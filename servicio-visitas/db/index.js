const { Pool } = require('pg');
require('dotenv').config(); // Importante para leer el .env

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};