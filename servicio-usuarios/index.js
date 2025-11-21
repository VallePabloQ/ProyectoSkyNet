// 1. Importar librerías
const express = require('express');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para crear tokens
const db = require('./db'); // Nuestra conexión a BD
const cors = require('cors');
require('dotenv').config(); // Para leer el JWT_SECRET


const app = express();
const PORT = 3002; // puerto 3002 para este servicio (el 3001 es clientes)

// 2. Middleware para leer JSON
app.use(express.json());
app.use(cors());

// --- RUTAS DE AUTENTICACIÓN ---

/*
 * POST /api/auth/registro
 * Crea un nuevo usuario con contraseña encriptada
 */
app.post('/api/auth/registro', async (req, res) => {
    try {
        const { nombre_completo, email, password, id_rol } = req.body;

        // Validar datos
        if (!nombre_completo || !email || !password || !id_rol) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // 1. Verificar si el usuario ya existe
        const userCheck = await db.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // 2. Encriptar la contraseña (Hashing)
        const salt = await bcrypt.genSalt(10); // "Sal" para aleatorizar el hash
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Insertar en la Base de Datos
        const sql = `
            INSERT INTO Usuarios (nombre_completo, email, password_hash, id_rol)
            VALUES ($1, $2, $3, $4)
            RETURNING id_usuario, nombre_completo, email, id_rol;
        `;
        // Nota: NO devolvemos el password_hash en el RETURNING por seguridad

        const { rows } = await db.query(sql, [nombre_completo, email, password_hash, id_rol]);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            usuario: rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/*
 * POST /api/auth/login
 * Verifica credenciales y devuelve un TOKEN
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar al usuario por email
        const result = await db.query('SELECT * FROM Usuarios WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciales inválidas' }); // Usuario no encontrado
        }

        const usuario = result.rows[0];

        // 2. Comparar contraseña (la que envían vs. el hash en BD)
        const validPassword = await bcrypt.compare(password, usuario.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Credenciales inválidas' }); // Contraseña mal
        }

        // 3. Generar el Token JWT
        // Aquí guardamos datos útiles dentro del token (payload)
        const token = jwt.sign(
            { 
                id: usuario.id_usuario, 
                rol: usuario.id_rol,
                email: usuario.email 
            },
            process.env.JWT_SECRET, // Nuestra clave secreta del .env
            { expiresIn: '2h' } // El token expira en 2 horas
        );

        // 4. Responder con el token
        res.json({
            message: 'Login exitoso',
            token: token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre_completo,
                id_rol: usuario.id_rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/*
 * GET /api/usuarios
 * Listar todos los usuarios (sin mostrar la contraseña)
 */
app.get('/api/usuarios', async (req, res) => {
    try {
        // Seleccionamos todo MENOS la contraseña por seguridad
        const sql = 'SELECT id_usuario, nombre_completo, email, id_rol FROM Usuarios ORDER BY id_usuario ASC';
        const { rows } = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

app.listen(PORT, () => {
    console.log(`Servicio de Usuarios corriendo en el puerto ${PORT}`);
});