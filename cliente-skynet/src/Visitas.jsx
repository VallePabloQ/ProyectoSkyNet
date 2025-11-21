import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Librerías de PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Librerías de Google Maps
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

function Visitas() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [visitas, setVisitas] = useState([]); 
    const [tableroSupervisor, setTableroSupervisor] = useState([]); 
    
    // Dropdowns
    const [listaClientes, setListaClientes] = useState([]);
    const [listaTecnicos, setListaTecnicos] = useState([]);

    // Formulario Supervisor
    const [idCliente, setIdCliente] = useState('');
    const [idTecnico, setIdTecnico] = useState('');
    const [fecha, setFecha] = useState('');

    // Técnico Check-out
    const [reporte, setReporte] = useState('');
    const [visitaActiva, setVisitaActiva] = useState(null);

    // --- NUEVOS ESTADOS PARA EL CHECK-IN INTUITIVO ---
    const [buscandoUbicacion, setBuscandoUbicacion] = useState(false); // Para mostrar "Cargando..."
    const [modalMapaOpen, setModalMapaOpen] = useState(false);        // Para abrir el modal
    const [ubicacionDetectada, setUbicacionDetectada] = useState(null); // { lat, lng }
    const [idVisitaCheckIn, setIdVisitaCheckIn] = useState(null);     // ID de la visita a confirmar

    // Cargar API de Google Maps
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyDSi3eM3vARj9R2RDTw629Le1wM5aH1c6c" // <--- ¡PEGAR TU API KEY AQUÍ!
    });

    useEffect(() => {
        const userStr = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');

        if (!userStr || !token) {
            navigate('/');
            return;
        }

        const userObj = JSON.parse(userStr);
        setUsuario(userObj);

        if (userObj.id_rol == 3) {
            cargarMisVisitas(token);
        } else {
            cargarListasParaFormulario(token);
            cargarTableroSupervisor(token);
        }
    }, []);

    // --- PDF ---
    const generarPDFVisitas = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Reporte de Visitas - SkyNet", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);
        
        autoTable(doc, {
            startY: 35,
            head: [['ID', 'Técnico', 'Cliente', 'Fecha', 'Estado', 'Reporte']],
            body: tableroSupervisor.map(v => [
                v.id_visita,
                v.nombre_tecnico,
                v.nombre_empresa,
                new Date(v.fecha_planificada).toLocaleDateString(),
                v.estado,
                v.reporte_visita || 'Pendiente'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });
        doc.save('reporte_visitas.pdf');
    };

    // --- CARGAS DE DATOS ---
    const cargarTableroSupervisor = async (token) => {
        try {
            const res = await axios.get('http://localhost:3003/api/tablero-supervisor', { headers: { Authorization: `Bearer ${token}` } });
            setTableroSupervisor(res.data);
        } catch (error) { console.error("Error tablero"); }
    };
    const cargarListasParaFormulario = async (token) => {
        try {
            const resC = await axios.get('http://localhost:3001/api/clientes', { headers: { Authorization: `Bearer ${token}` } });
            setListaClientes(resC.data);
            const resU = await axios.get('http://localhost:3002/api/usuarios');
            setListaTecnicos(resU.data.filter(u => u.id_rol == 3));
        } catch (error) { console.error("Error listas"); }
    };
    const cargarMisVisitas = async (token) => {
        try {
            const res = await axios.get('http://localhost:3003/api/mis-visitas', { headers: { Authorization: `Bearer ${token}` } });
            setVisitas(res.data);
        } catch (error) { console.error(error); }
    };

    // --- NUEVO PROCESO DE CHECK-IN ---
    const iniciarCheckIn = (id_visita) => {
        if (!navigator.geolocation) {
            alert("Navegador sin GPS");
            return;
        }

        setIdVisitaCheckIn(id_visita);
        setBuscandoUbicacion(true); // 1. Muestra "Cargando..."

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // 2. Éxito: Guardamos coords y abrimos el mapa
                setUbicacionDetectada({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setBuscandoUbicacion(false); // Oculta "Cargando..."
                setModalMapaOpen(true);      // Abre el mapa
            },
            (error) => {
                setBuscandoUbicacion(false);
                alert("Error obteniendo ubicación. Verifica los permisos.");
            }
        );
    };

    const confirmarCheckInFinal = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:3003/api/visitas/${idVisitaCheckIn}/checkin`, 
                { latitud: ubicacionDetectada.lat, longitud: ubicacionDetectada.lng }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            alert('✅ Check-in Registrado Exitosamente');
            setModalMapaOpen(false); // Cerrar modal
            cargarMisVisitas(token); // Refrescar lista
        } catch (error) {
            alert('Error al guardar en servidor');
        }
    };

    // --- OTROS HANDLERS ---
    const handleCheckOut = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:3003/api/visitas/${visitaActiva}/checkout`, { reporte_visita: reporte }, { headers: { Authorization: `Bearer ${token}` } });
            alert('✅ Visita finalizada.');
            setVisitaActiva(null); 
            setReporte('');
            cargarMisVisitas(token);
        } catch (error) { alert('Error checkout'); }
    };

    const handlePlanificar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3003/api/visitas', 
                { id_cliente: idCliente, id_tecnico: idTecnico, fecha_planificada: fecha }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('📅 Asignada');
            setFecha('');
            cargarTableroSupervisor(token); 
        } catch (error) { alert('Error planificar'); }
    };

    if (!usuario) return <div>Cargando...</div>;

    return (
        <div className="container mt-4 position-relative">
            {/* --- OVERLAY DE CARGA (SPINNER) --- */}
            {buscandoUbicacion && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75" style={{ zIndex: 2000 }}>
                    <div className="text-center text-white">
                        <div className="spinner-border text-info" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                        <h4 className="mt-3">🛰️ Localizando satélites...</h4>
                        <p>Por favor espera</p>
                    </div>
                </div>
            )}

            {/* --- MODAL DE CONFIRMACIÓN CON MAPA --- */}
            {modalMapaOpen && ubicacionDetectada && isLoaded && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
                    <div className="card shadow-lg" style={{ width: '90%', maxWidth: '500px' }}>
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">📍 Confirma tu ubicación</h5>
                        </div>
                        <div className="card-body p-0">
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '300px' }}
                                center={ubicacionDetectada}
                                zoom={16}
                                options={{ streetViewControl: false, mapTypeControl: false }}
                            >
                                <Marker position={ubicacionDetectada} />
                            </GoogleMap>
                            <div className="p-3">
                                <p className="small text-muted mb-2">
                                    Coordenadas: {ubicacionDetectada.lat}, {ubicacionDetectada.lng}
                                </p>
                                <p className="fw-bold">¿Estás en este lugar?</p>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-success flex-grow-1" onClick={confirmarCheckInFinal}>
                                        ✅ SÍ, CONFIRMAR CHECK-IN
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setModalMapaOpen(false)}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENIDO NORMAL --- */}
            <div className="d-flex justify-content-between mb-4">
                <h2>Módulo de Visitas</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Volver</button>
            </div>

            {/* VISTA SUPERVISOR */}
            {(usuario.id_rol == 2 || usuario.id_rol == 1) && (
                <>
                    <div className="card shadow p-4 mb-5 bg-light border-primary">
                        <h4 className="mb-3 text-primary">📅 Planificar Nueva Visita</h4>
                        <form onSubmit={handlePlanificar}>
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label>Cliente:</label>
                                    <select className="form-select" value={idCliente} onChange={e => setIdCliente(e.target.value)} required>
                                        <option value="">-- Seleccionar --</option>
                                        {listaClientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_empresa}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label>Técnico:</label>
                                    <select className="form-select" value={idTecnico} onChange={e => setIdTecnico(e.target.value)} required>
                                        <option value="">-- Asignar a --</option>
                                        {listaTecnicos.map(t => <option key={t.id_usuario} value={t.id_usuario}>{t.nombre_completo}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label>Fecha:</label>
                                    <input type="datetime-local" className="form-control" value={fecha} onChange={e => setFecha(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Asignar Visita</button>
                        </form>
                    </div>

                    <div className="card shadow">
                        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">📊 Tablero de Control</h5>
                            <button className="btn btn-danger btn-sm" onClick={generarPDFVisitas}>📄 Descargar PDF</button>
                        </div>
                        <div className="card-body">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr><th>ID</th><th>Técnico</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Reporte</th></tr>
                                </thead>
                                <tbody>
                                    {tableroSupervisor.map(v => (
                                        <tr key={v.id_visita}>
                                            <td>{v.id_visita}</td>
                                            <td><span className="fw-bold">{v.nombre_tecnico}</span></td>
                                            <td>{v.nombre_empresa}</td>
                                            <td>{new Date(v.fecha_planificada).toLocaleString()}</td>
                                            <td><span className={`badge ${v.estado === 'Planificada' ? 'bg-secondary' : v.estado === 'En Progreso' ? 'bg-warning text-dark' : 'bg-success'}`}>{v.estado}</span></td>
                                            <td><small className="text-muted">{v.reporte_visita || '-'}</small></td>
                                        </tr>
                                    ))}
                                    {tableroSupervisor.length === 0 && <tr><td colSpan="6" className="text-center">No hay visitas.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* VISTA TÉCNICO */}
            {usuario.id_rol == 3 && (
                <div>
                    <h4>👷‍♂️ Mi Agenda de Hoy</h4>
                    <div className="row">
                        {visitas.map(visita => (
                            <div key={visita.id_visita} className="col-md-6 mb-3">
                                <div className={`card border-${visita.estado === 'En Progreso' ? 'warning' : 'success'} shadow`}>
                                    <div className="card-body">
                                        <h5 className="card-title">Visita #{visita.id_visita}</h5>
                                        <p className="card-text">
                                            <strong>Cliente:</strong> {visita.nombre_empresa}<br/>
                                            <strong>Dirección:</strong> {visita.direccion_texto}<br/>
                                            <strong>Fecha:</strong> {new Date(visita.fecha_planificada).toLocaleString()}<br/>
                                            <strong>Estado:</strong> {visita.estado}
                                        </p>
                                        
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${visita.latitud},${visita.longitud}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary w-100 mb-2">
                                            🗺️ Cómo llegar (Google Maps)
                                        </a>

                                        {/* BOTÓN DE CHECK-IN MEJORADO */}
                                        {visita.estado === 'Planificada' && (
                                            <button className="btn btn-primary w-100" onClick={() => iniciarCheckIn(visita.id_visita)}>
                                                📍 Hacer Check-In
                                            </button>
                                        )}

                                        {visita.estado === 'En Progreso' && !visitaActiva && (
                                            <button className="btn btn-warning w-100" onClick={() => setVisitaActiva(visita.id_visita)}>
                                                📝 Finalizar y Reportar
                                            </button>
                                        )}
                                        {visitaActiva === visita.id_visita && (
                                            <div className="mt-3 p-2 bg-light rounded">
                                                <label>Reporte:</label>
                                                <textarea className="form-control mb-2" rows="3" value={reporte} onChange={e => setReporte(e.target.value)}></textarea>
                                                <button className="btn btn-success btn-sm" onClick={handleCheckOut}>Confirmar</button>
                                                <button className="btn btn-secondary btn-sm ms-2" onClick={() => setVisitaActiva(null)}>Cancelar</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Visitas;