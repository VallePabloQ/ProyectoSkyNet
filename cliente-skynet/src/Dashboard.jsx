import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [logoApp, setLogoApp] = useState(null);

  useEffect(() => {
    // 1. Verificamos si hay usuario guardado
    const usuarioGuardado = localStorage.getItem('usuario');
    const config = JSON.parse(localStorage.getItem('skynet_config'));
    if (config && config.logo) {
      setLogoApp(config.logo);
    }
    
    if (!usuarioGuardado) {
      navigate('/'); // Si no hay nadie, fuera.
    } else {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  // Función auxiliar para mostrar el nombre del rol en pantalla
  const getRolName = (id) => {
    if (id == 1) return 'Administrador';
    if (id == 2) return 'Supervisor';
    if (id == 3) return 'Técnico';
    return 'Usuario';
  };

  if (!usuario) return null;

  return (
    <div>
      {/* Barra Superior (Navbar) */}
      <nav className="navbar navbar-dark bg-dark px-4 shadow">
        <span className="navbar-brand mb-0 h1">
          {logoApp ? (
             <img src={logoApp} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
          ) : (
             'SkyNet 🤖'
          )}
        </span>
        <div className="d-flex align-items-center">
            <span className="text-light me-3 d-none d-md-block">
                Hola, {usuario.nombre_completo} ({getRolName(usuario.id_rol)})
            </span>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
            Cerrar Sesión
            </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <div className="container mt-5">
        <div className="alert alert-info shadow-sm">
          <h4>¡Bienvenido al Panel de Control!</h4>
          <p className="mb-0">
            Estás conectado como: <strong>{getRolName(usuario.id_rol)}</strong>. 
            Tus opciones están limitadas según tu perfil.
          </p>
        </div>

        <div className="row g-4">
            
            {/* 1. MÓDULO VISITAS (Visible para TODOS) */}
            <div className="col-md-4">
                <div className="card h-100 shadow-sm border-primary">
                    <div className="card-body text-center">
                        <h1 className="display-4">📅</h1>
                        <h5 className="card-title">Módulo de Visitas</h5>
                        <p className="card-text text-muted">
                            {usuario.id_rol == 3 
                                ? "Revisa tu agenda y reporta tu ubicación." 
                                : "Planifica, asigna y supervisa al equipo."}
                        </p>
                        <button className="btn btn-primary w-100" onClick={() => navigate('/visitas')}>
                            Ir a Visitas
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MÓDULO CLIENTES (Solo Admin y Supervisor) */}
            {(usuario.id_rol == 1 || usuario.id_rol == 2) && (
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                            <h1 className="display-4">🏢</h1>
                            <h5 className="card-title">Gestión de Clientes</h5>
                            <p className="card-text text-muted">Administra la base de datos de empresas.</p>
                            <button className="btn btn-success w-100" onClick={() => navigate('/clientes')}>
                                Ir a Clientes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. MÓDULO USUARIOS (Solo Admin) */}
            {usuario.id_rol == 1 && (
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                            <h1 className="display-4">👥</h1>
                            <h5 className="card-title">Personal (RRHH)</h5>
                            <p className="card-text text-muted">Crea cuentas para Técnicos y Supervisores.</p>
                            <button className="btn btn-info text-white w-100" onClick={() => navigate('/usuarios')}>
                                Gestionar Usuarios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. CONFIGURACIONES (Solo Admin) */}
            {usuario.id_rol == 1 && (
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm border-secondary">
                        <div className="card-body text-center">
                            <h1 className="display-4">⚙️</h1>
                            <h5 className="card-title">Configuración</h5>
                            <p className="card-text text-muted">Ajustes globales del sistema.</p>
                            <button className="btn btn-secondary w-100" onClick={() => navigate('/configuraciones')}>
                                Ajustes
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;