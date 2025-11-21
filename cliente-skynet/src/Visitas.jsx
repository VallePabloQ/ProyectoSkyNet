import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import MapaUbicacionOSM from './components/MapaUbicacionOSM';

function Visitas() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    
    // Datos
    const [visitas, setVisitas] = useState([]); // Agenda del técnico
    const [tableroSupervisor, setTableroSupervisor] = useState([]); // Tabla del supervisor
    
    // Listas para Dropdowns (Planificación)
    const [listaClientes, setListaClientes] = useState([]);
    const [listaTecnicos, setListaTecnicos] = useState([]);

    // Formulario Supervisor
    const [idCliente, setIdCliente] = useState('');
    const [idTecnico, setIdTecnico] = useState('');
    const [fecha, setFecha] = useState('');

    // Técnico Check-out (Reporte)
    const [reporte, setReporte] = useState('');
    const [visitaActiva, setVisitaActiva] = useState(null);

    // --- ESTADOS PARA EL CHECK-IN CON MAPA ---
    const [buscandoUbicacion, setBuscandoUbicacion] = useState(false); 
    const [modalMapaOpen, setModalMapaOpen] = useState(false);        
    const [ubicacionDetectada, setUbicacionDetectada] = useState(null); // { lat, lon }
    const [idVisitaCheckIn, setIdVisitaCheckIn] = useState(null);     

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
                new Date(v.fecha_planificada).toLocaleString(),
                v.estado,
                v.reporte_visita || 'Pendiente'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });
        doc.save('reporte_visitas.pdf');
    };

    // --- CARGAS DE DATOS (API) ---
    const cargarTableroSupervisor = async (token) => {
        try {
            const res = await axios.get('https://servicio-visitas-production.up.railway.app/api/tablero-supervisor', { headers: { Authorization: `Bearer ${token}` } });
            setTableroSupervisor(res.data);
        } catch (error) { console.error("Error tablero"); }
    };

    const cargarListasParaFormulario = async (token) => {
        try {
            // Cargar Clientes
            const resC = await axios.get('https://servicio-clientes-production.up.railway.app/api/clientes', { headers: { Authorization: `Bearer ${token}` } });
            setListaClientes(resC.data);
            // Cargar Técnicos
            const resU = await axios.get('https://servicio-usuarios-production.up.railway.app/api/usuarios');
            setListaTecnicos(resU.data.filter(u => u.id_rol == 3));
        } catch (error) { console.error("Error listas"); }
    };

    const cargarMisVisitas = async (token) => {
        try {
            const res = await axios.get('https://servicio-visitas-production.up.railway.app/api/mis-visitas', { headers: { Authorization: `Bearer ${token}` } });
            setVisitas(res.data);
        } catch (error) { console.error(error); }
    };

    // --- PROCESO DE CHECK-IN (GEOLOCALIZACIÓN) ---
    const iniciarCheckIn = (id_visita) => {
        if (!navigator.geolocation) {
            alert("Navegador sin GPS");
            return;
        }

        setIdVisitaCheckIn(id_visita);
        setBuscandoUbicacion(true); 

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Éxito: Guardamos coords y abrimos el mapa
                setUbicacionDetectada({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
                setBuscandoUbicacion(false); 
                setModalMapaOpen(true);      
            },
            (error) => {
                setBuscandoUbicacion(false);
                alert("Error obteniendo ubicación. Verifica permisos del navegador.");
            }
        );
    };

    const confirmarCheckInFinal = async () => {
        try {
            const token = localStorage.getItem('token');
            // Enviamos lat/long al backend
            await axios.put(`https://servicio-visitas-production.up.railway.app/api/visitas/${idVisitaCheckIn}/checkin`, 
                { latitud: ubicacionDetectada.lat, longitud: ubicacionDetectada.lon }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            alert('✅ Check-in Registrado Exitosamente');
            setModalMapaOpen(false); 
            cargarMisVisitas(token); 
        } catch (error) {
            console.error(error);
            alert('Error al guardar en servidor');
        }
    };

    // --- CHECK-OUT Y PLANIFICACIÓN ---
    const handleCheckOut = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`https://servicio-visitas-production.up.railway.app/api/visitas/${visitaActiva}/checkout`, 
                { reporte_visita: reporte }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('✅ Visita finalizada y reporte enviado.');
            setVisitaActiva(null); 
            setReporte('');
            cargarMisVisitas(token);
        } catch (error) { alert('Error checkout'); }
    };

    const handlePlanificar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://servicio-visitas-production.up.railway.app/api/visitas', 
                { id_cliente: idCliente, id_tecnico: idTecnico, fecha_planificada: fecha }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('📅 Visita asignada correctamente');
            setFecha('');
            cargarTableroSupervisor(token); 
        } catch (error) { alert('Error planificar'); }
    };

    if (!usuario) return <div className="p-5 text-center">Cargando sistema...</div>;

    return (
        <div className="container mt-4 position-relative">
            
            {/* --- OVERLAY DE CARGA (SPINNER) --- */}
            {buscandoUbicacion && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75" style={{ zIndex: 2000 }}>
                    <div className="text-center text-white">
                        <div className="spinner-border text-info" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                        <h4 className="mt-3">🛰️ Conectando con Satélites...</h4>
                        <p>Obteniendo tu ubicación exacta</p>
                    </div>
                </div>
            )}

            {/* --- MODAL DE CONFIRMACIÓN CON MAPA OSM --- */}
            {modalMapaOpen && ubicacionDetectada && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
                    <div className="card shadow-lg" style={{ width: '90%', maxWidth: '500px' }}>
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">📍 Confirma tu ubicación</h5>
                        </div>
                        <div className="card-body p-0">
                            
                            {/* AQUÍ ESTÁ EL NUEVO MAPA QUE NO REQUIERE API KEY */}
                            <MapaUbicacionOSM 
                                latitud={ubicacionDetectada.lat}
                                longitud={ubicacionDetectada.lon}
                            />

                            <div className="p-3 text-center">
                                <p className="fw-bold">¿Estás en este lugar?</p>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-success flex-grow-1" onClick={confirmarCheckInFinal}>
                                        ✅ SÍ, CONFIRMAR
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

            {/* --- ENCABEZADO --- */}
            <div className="d-flex justify-content-between mb-4">
                <h2>Módulo de Visitas</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Volver</button>
            </div>

            {/* VISTA SUPERVISOR / ADMIN */}
            {(usuario.id_rol == 2 || usuario.id_rol == 1) && (
                <>
                    {/* Formulario de Planificación */}
                    <div className="card shadow p-4 mb-5 bg-light border-primary">
                        <h4 className="mb-3 text-primary">📅 Planificar Nueva Visita</h4>
                        <form onSubmit={handlePlanificar}>
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Cliente:</label>
                                    <select className="form-select" value={idCliente} onChange={e => setIdCliente(e.target.value)} required>
                                        <option value="">-- Seleccionar --</option>
                                        {listaClientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre_empresa}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Técnico:</label>
                                    <select className="form-select" value={idTecnico} onChange={e => setIdTecnico(e.target.value)} required>
                                        <option value="">-- Asignar a --</option>
                                        {listaTecnicos.map(t => <option key={t.id_usuario} value={t.id_usuario}>{t.nombre_completo}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Fecha:</label>
                                    <input type="datetime-local" className="form-control" value={fecha} onChange={e => setFecha(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Asignar Visita</button>
                        </form>
                    </div>

                    {/* TABLERO DE CONTROL */}
                    <div className="card shadow">
                        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">📊 Tablero de Control</h5>
                            <button className="btn btn-danger btn-sm" onClick={generarPDFVisitas}>📄 Descargar PDF</button>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
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
                                        
                                        {/* ENLACE A GOOGLE MAPS EXTERNO (PARA NAVEGAR) */}
                                        <a 
                                            href={`https://www.google.com/maps?q=${visita.latitud},${visita.longitud}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="btn btn-outline-primary w-100 mb-2"
                                        >
                                            🗺️ Cómo llegar (Google Maps)
                                        </a>

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
                        {visitas.length === 0 && <p className="text-muted">No tienes visitas asignadas por ahora.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Visitas;