import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  // Estados para guardar lo que escribe el usuario
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    try {
      // 1. Hacemos la petición POST a tu servicio de usuarios
      const response = await axios.post('https://usuarios-19-26373.up.railway.app/api/auth/login', {
        email: email,
        password: password
      });

      // 2. Si es exitoso, guardamos el token en el navegador
      // "localStorage" es una memoria pequeña del navegador
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

      alert('¡Login Exitoso! Bienvenido/a ' + response.data.usuario.nombre);
      
      navigate('/dashboard');
      
    } catch (err) {
      // Si falla (ej: contraseña mal), mostramos el error
      setError('Error: Credenciales inválidas o servidor apagado');
      console.error(err);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: '400px' }}>
        <h2 className="text-center mb-4">SkyNet Login</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Email:</label>
            <input 
              type="email" 
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="mb-3">
            <label>Contraseña:</label>
            <input 
              type="password" 
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;