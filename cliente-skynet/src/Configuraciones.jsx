import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Configuraciones() {
    const navigate = useNavigate();
    
    // Estados existentes
    const [empresa, setEmpresa] = useState('SkyNet');
    const [modoOscuro, setModoOscuro] = useState(false);
    const [emailSoporte, setEmailSoporte] = useState('soporte@skynet.com');
    
    // NUEVOS ESTADOS PARA IMÁGENES
    const [logo, setLogo] = useState('');     // Logo del Dashboard
    const [favicon, setFavicon] = useState(''); // Icono del Tab del navegador

    useEffect(() => {
        // Protección de Ruta (Solo Admin)
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
        if (usuarioGuardado && usuarioGuardado.id_rol != 1) { 
            navigate('/dashboard'); 
        }

        // Cargar config guardada
        const configGuardada = localStorage.getItem('skynet_config');
        if (configGuardada) {
            const config = JSON.parse(configGuardada);
            setEmpresa(config.empresa || 'SkyNet');
            setModoOscuro(config.modoOscuro || false);
            setEmailSoporte(config.emailSoporte || '');
            setLogo(config.logo || '');
            setFavicon(config.favicon || '');
        }
    }, [navigate]);

    // Función mágica para convertir Imagen -> Texto (Base64)
    const handleImageUpload = (e, setFunction) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) { // Límite de 500KB aprox
                alert("⚠️ La imagen es muy pesada. Intenta con una más pequeña (menos de 500KB).");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFunction(reader.result); // Guardamos la imagen como texto
            };
            reader.readAsDataURL(file);
        }
    };

    const guardarCambios = (e) => {
        e.preventDefault();
        const config = { empresa, modoOscuro, emailSoporte, logo, favicon };
        
        localStorage.setItem('skynet_config', JSON.stringify(config));
        
        // Actualizar favicon inmediatamente en el navegador
        if (favicon) {
            const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = favicon;
            document.getElementsByTagName('head')[0].appendChild(link);
        }

        alert('✅ Configuraciones y Logos guardados.');
        // Opcional: Recargar página para ver cambios globales
        window.location.reload(); 
    };

    const restaurarFabrica = () => {
        if(window.confirm("¿Borrar toda la personalización?")) {
            localStorage.removeItem('skynet_config');
            window.location.reload();
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>⚙️ Configuraciones del Sistema</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    Volver al Dashboard
                </button>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card shadow mb-4">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="mb-0">Personalización Visual</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={guardarCambios}>
                                <div className="mb-3">
                                    <label className="form-label">Nombre de la Organización:</label>
                                    <input type="text" className="form-control" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
                                </div>

                                {/* INPUT PARA EL LOGO */}
                                <div className="mb-3">
                                    <label className="form-label">Logo del Sistema (Navbar):</label>
                                    <input type="file" accept="image/*" className="form-control" onChange={(e) => handleImageUpload(e, setLogo)} />
                                    {logo && <img src={logo} alt="Vista previa" className="mt-2 border rounded p-1" style={{ height: '50px' }} />}
                                </div>

                                {/* INPUT PARA EL FAVICON */}
                                <div className="mb-3">
                                    <label className="form-label">Ícono de Pestaña (Favicon):</label>
                                    <input type="file" accept="image/*" className="form-control" onChange={(e) => handleImageUpload(e, setFavicon)} />
                                    {favicon && <img src={favicon} alt="Vista previa" className="mt-2 border rounded p-1" style={{ height: '32px' }} />}
                                    <div className="form-text">Recomendado: Imágenes cuadradas pequeñas (.png o .ico).</div>
                                </div>

                                <div className="mb-3 form-check form-switch">
                                    <input className="form-check-input" type="checkbox" checked={modoOscuro} onChange={(e) => setModoOscuro(e.target.checked)} />
                                    <label className="form-check-label">Activar Modo Oscuro (Beta)</label>
                                </div>

                                <button type="submit" className="btn btn-primary">💾 Guardar Cambios</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow mb-4">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">Sistema</h5>
                        </div>
                        <div className="card-body">
                            <p><strong>Email Soporte:</strong> {emailSoporte}</p>
                            <button className="btn btn-outline-danger w-100" onClick={restaurarFabrica}>⚠️ Restaurar de Fábrica</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Configuraciones;