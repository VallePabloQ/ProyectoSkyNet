import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Clientes from './Clientes';
import Visitas from './Visitas';
import Usuarios from './Usuarios';
import Configuraciones from './Configuraciones';

function App() {
  // --- EFECTO PARA CAMBIAR EL FAVICON AL INICIAR ---
  useEffect(() => {
    const config = JSON.parse(localStorage.getItem('skynet_config'));
    
    if (config && config.favicon) {
      // Buscamos el link del icono en el HTML
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = config.favicon;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para el Login (Raíz) */}
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/visitas" element={<Visitas />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/configuraciones" element={<Configuraciones />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;