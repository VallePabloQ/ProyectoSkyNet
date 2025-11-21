const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // Importante para el email
require('dotenv').config();

const app = express();
const PORT = 3003;

app.use(express.json());
app.use(cors());

console.log("Intentando enviar correo desde:", process.env.NODEMAILER_USER);
// --- ÚLTIMO INTENTO DE CONFIGURACIÓN ---
const transporter = nodemailer.createTransport({
    service: 'gmail', // Volvemos al servicio automático
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Middleware de seguridad
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });

    jwt.verify(token, process.env.JWT_SECRET || 'skynet_secret_key_2025', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// ---------------- RUTAS ----------------

/*
 * POST /api/visitas
 * Planificar nueva visita
 */
app.post('/api/visitas', verificarToken, async (req, res) => {
    const { id_cliente, id_tecnico, fecha_planificada } = req.body;
    // El ID del supervisor viene del token
    const id_supervisor = req.user.id; 

    try {
        const sql = `
            INSERT INTO Visitas (id_cliente, id_tecnico, id_supervisor, fecha_planificada, estado)
            VALUES ($1, $2, $3, $4, 'Planificada')
            RETURNING id_visita
        `;
        const { rows } = await db.query(sql, [id_cliente, id_tecnico, id_supervisor, fecha_planificada]);
        res.json({ message: 'Visita creada', id_visita: rows[0].id_visita });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear visita' });
    }
});

/*
 * GET /api/mis-visitas
 * (Solo Técnicos) - Ver agenda CON DATOS DEL CLIENTE (JOIN)
 */
app.get('/api/mis-visitas', verificarToken, async (req, res) => {
    try {
        const id_tecnico = req.user.id; 
        
        // AQUÍ ESTABA EL ERROR DE LOS CAMPOS EN BLANCO:
        // Nos aseguramos de traer nombre_empresa, direccion_texto, latitud, etc.
        const sql = `
            SELECT 
                v.id_visita, v.fecha_planificada, v.estado, v.reporte_visita,
                c.id_cliente, c.nombre_empresa, c.direccion_texto, c.latitud, c.longitud
            FROM Visitas v
            INNER JOIN Clientes c ON v.id_cliente = c.id_cliente
            WHERE v.id_tecnico = $1 
            AND v.estado IN ('Planificada', 'En Progreso')
            ORDER BY v.fecha_planificada ASC
        `;

        const { rows } = await db.query(sql, [id_tecnico]);
        res.json(rows);

    } catch (error) {
        console.error('Error al consultar agenda:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

/*
 * GET /api/tablero-supervisor
 * (Solo Supervisores) - Ver SOLO las visitas que YO asigné
 */
app.get('/api/tablero-supervisor', verificarToken, async (req, res) => {
    try {
        const id_supervisor = req.user.id; // <--- Obtenemos el ID del que está logueado

        const sql = `
            SELECT 
                v.id_visita, v.fecha_planificada, v.estado, v.reporte_visita,
                c.nombre_empresa, 
                u.nombre_completo as nombre_tecnico
            FROM Visitas v
            INNER JOIN Clientes c ON v.id_cliente = c.id_cliente
            INNER JOIN Usuarios u ON v.id_tecnico = u.id_usuario
            WHERE v.id_supervisor = $1  -- <--- EL FILTRO MÁGICO
            ORDER BY v.fecha_planificada DESC
        `;
        
        const { rows } = await db.query(sql, [id_supervisor]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno' });
    }
});

/*
 * PUT /api/visitas/:id/checkin
 * Marcar llegada y guardar coordenadas reales
 */
app.put('/api/visitas/:id/checkin', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { latitud, longitud } = req.body; // Coordenadas reales del GPS

    try {
        const sql = `
            UPDATE Visitas 
            SET hora_inicio = NOW(), 
                estado = 'En Progreso',
                latitud_tecnico = $1,
                longitud_tecnico = $2
            WHERE id_visita = $3
        `;
        await db.query(sql, [latitud, longitud, id]);
        res.json({ message: 'Check-in registrado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en check-in' });
    }
});

/*
 * PUT /api/visitas/:id/checkout
 * Finalizar visita y enviar Email
 */
app.put('/api/visitas/:id/checkout', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { reporte_visita } = req.body;

    console.log(`Intentando Checkout para visita ID: ${id}`);

    try {
        // 1. Actualizar BD
        const sqlUpdate = `
            UPDATE Visitas 
            SET hora_fin = NOW(), 
                estado = 'Finalizada', 
                reporte_visita = $1 
            WHERE id_visita = $2
        `;
        await db.query(sqlUpdate, [reporte_visita, id]);

        // 2. Obtener datos para el correo
        const sqlDatos = `
            SELECT c.nombre_empresa, c.contacto_email, c.contacto_nombre, u.nombre_completo as nombre_tecnico, v.fecha_planificada
            FROM Visitas v
            JOIN Clientes c ON v.id_cliente = c.id_cliente
            JOIN Usuarios u ON v.id_tecnico = u.id_usuario
            WHERE v.id_visita = $1
        `;
        const resultado = await db.query(sqlDatos, [id]);
        const datos = resultado.rows[0];

        // 3. Intentar enviar correo (Dentro de un try/catch interno para que no falle todo si el correo falla)
        try {
            if (datos && datos.contacto_email) {
                const mailOptions = {
                    from: 'SkyNet Notificaciones',
                    to: datos.contacto_email,
                    subject: `Reporte de Visita - ${datos.nombre_empresa}`,
                    html: `<h3>Visita Finalizada</h3><p>Técnico: ${datos.nombre_tecnico}</p><p>Reporte: ${reporte_visita}</p>`
                };
                
                // No usamos await aquí para no bloquear, pero manejamos el error en callback
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) console.error("Error enviando email (pero la visita se cerró):", err);
                    else console.log("Email enviado correctamente");
                });
            } else {
                console.log("No se envió correo: Cliente sin email registrado.");
            }
        } catch (mailError) {
            console.error("Error configurando el email:", mailError);
        }

        res.json({ message: 'Visita finalizada' });

    } catch (error) {
        console.error("ERROR CRÍTICO EN CHECKOUT:", error); // Mira esto en la terminal si falla
        res.status(500).json({ error: 'Error al finalizar visita' });
    }
});

app.listen(PORT, () => {
    console.log(`Servicio de Visitas corriendo en puerto ${PORT}`);
});
