const jwt = require('jsonwebtoken');
require('dotenv').config();

/*
 * Middleware de Autenticación
 * Este código se ejecuta ANTES de que la petición llegue a la ruta final.
 */
const verificarToken = (req, res, next) => {
    // 1. Buscar el token en la cabecera "Authorization"
    // El formato estándar es: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    
    // Si no hay cabecera, rechazamos
    if (!authHeader) {
        return res.status(403).json({ error: 'Acceso denegado: No se proporcionó un token' });
    }

    // Separamos la palabra "Bearer" del token real
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado: Formato de token inválido' });
    }

    try {
        // 2. Verificar si el token es real y no ha expirado
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Si es válido, guardamos los datos del usuario en la petición
        // para que la ruta pueda saber quién es (ej: req.user.id)
        req.user = decoded;

        // 4. ¡Pase adelante!
        next(); 
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = verificarToken;