// 1. Importar herramientas
const express = require('express');
const db = require('./db');
const verificarToken = require('./middleware/auth');
const cors = require('cors');

// 2. Inicializar la app
const app = express();
const PORT = 3001;

// 3. Middlewares
// Esto nos permite leer JSON (lo usaremos en el POST)
app.use(express.json());
app.use(cors());

// 4. --- DEFINICIÓN DE RUTAS (ENDPOINTS) ---

// Ruta de prueba (la que tenías)
app.get('/', (req, res) => {
    res.send('¡Hola! Soy el microservicio de Clientes.');
});

/*
 * GET /api/clientes
 * Endpoint para OBTENER todos los clientes
 */
app.get('/api/clientes', verificarToken, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM Clientes');
        res.status(200).json(rows); // Envía los clientes como respuesta JSON
    } catch (error) {
        console.error('Error al consultar clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/*
 * POST /api/clientes
 * Endpoint para CREAR un nuevo cliente
 */
app.post('/api/clientes', verificarToken, async (req, res) => {
    try {
        // 1. Desestructuramos los datos del cuerpo (body) de la petición
        const { 
            nombre_empresa, 
            contacto_nombre, 
            contacto_email,
            telefono,
            direccion_texto,
            latitud, 
            longitud 
        } = req.body;

        // 2. Validamos datos obligatorios
        // (Según tu proyecto, coordenadas y nombre son críticos)
        if (!nombre_empresa || !latitud || !longitud) {
            return res.status(400).json({ 
                error: 'Faltan campos obligatorios: nombre_empresa, latitud, longitud' 
            });
        }

        // 3. Query SQL para insertar
        // Usamos "RETURNING *" para que la BD nos devuelva el dato recién creado
        const sql = `
            INSERT INTO Clientes (
                nombre_empresa, contacto_nombre, contacto_email, telefono, 
                direccion_texto, latitud, longitud
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

        const values = [
            nombre_empresa, contacto_nombre, contacto_email, 
            telefono, direccion_texto, latitud, longitud
        ];

        // 4. Ejecutamos la consulta
        const { rows } = await db.query(sql, values);

        // 5. Respondemos con el cliente creado (Código 201 = Created)
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/*
 * DELETE /api/clientes/:id
 * Borrar un cliente
 */
app.delete('/api/clientes/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Borramos el cliente por su ID
        await db.query('DELETE FROM Clientes WHERE id_cliente = $1', [id]);
        res.json({ message: 'Cliente eliminado' });
    } catch (error) {
        console.error(error);
        // Si falla, suele ser porque el cliente tiene visitas asignadas (Foreign Key)
        res.status(500).json({ error: 'No se puede borrar: El cliente tiene visitas registradas.' });
    }
});

/*
 * PUT /api/clientes/:id
 * Actualizar datos de un cliente
 */
app.put('/api/clientes/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { nombre_empresa, contacto_nombre, contacto_email, telefono, direccion_texto, latitud, longitud } = req.body;

    try {
        const sql = `
            UPDATE Clientes 
            SET nombre_empresa=$1, contacto_nombre=$2, contacto_email=$3, telefono=$4, direccion_texto=$5, latitud=$6, longitud=$7
            WHERE id_cliente=$8
        `;
        await db.query(sql, [nombre_empresa, contacto_nombre, contacto_email, telefono, direccion_texto, latitud, longitud, id]);
        
        res.json({ message: 'Cliente actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servicio de Clientes corriendo en el puerto ${PORT}`);
});

// Actualización forzada para Railway