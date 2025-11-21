import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SelectorMapaOSM from './components/SelectorMapaOSM';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const navigate = useNavigate();
    const [editandoId, setEditandoId] = useState(null);
    const [buscando, setBuscando] = useState(false);

    // --- TU URL DE RAILWAY (CLIENTES) ---
    const API_URL = 'https://clientes-19-26373.up.railway.app';

    const [nuevoCliente, setNuevoCliente] = useState({
        nombre_empresa: '',
        contacto_nombre: '',
        contacto_email: '',
        telefono: '',
        direccion_texto: '',
        latitud: 14.6349,
        longitud: -90.5069
    });

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/'); return; }

            const response = await axios.get(`${API_URL}/api/clientes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClientes(response.data);
        } catch (error) {
            console.error("Error cargando clientes:", error);
        }
    };

    // --- BUSCAR DIRECCIÓN EN MAPA ---
    const buscarDireccion = async () => {
        if (!nuevoCliente.direccion_texto) {
            alert("Escribe una dirección primero.");
            return;
        }
        setBuscando(true);
        try {
            const query = `${nuevoCliente.direccion_texto}, Guatemala`;
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);

            if (res.data && res.data.length > 0) {
                const mejor = res.data[0];
                setNuevoCliente(prev => ({
                    ...prev,
                    latitud: parseFloat(mejor.lat),
                    longitud: parseFloat(mejor.lon)
                }));
            } else {
                alert("Dirección no encontrada. Intenta ajustar el pin manualmente.");
            }
        } catch (error) { console.error(error); } 
        finally { setBuscando(false); }
    };

    // --- CRUD ---
    const handleBorrar = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar este cliente?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/clientes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Cliente eliminado.");
            cargarClientes();
        } catch (error) { alert("No se pudo borrar."); }
    };

    const handleEditar = (cliente) => {
        setEditandoId(cliente.id_cliente);
        // Blindaje para evitar mapa blanco
        const lat = cliente.latitud ? parseFloat(cliente.latitud) : 14.6349;
        const lng = cliente.longitud ? parseFloat(cliente.longitud) : -90.5069;

        setNuevoCliente({
            nombre_empresa: cliente.nombre_empresa,
            contacto_nombre: cliente.contacto_nombre,
            contacto_email: cliente.contacto_email,
            telefono: cliente.telefono,
            direccion_texto: cliente.direccion_texto,
            latitud: lat,
            longitud: lng
        });
        setMostrarFormulario(true);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editandoId) {
                await axios.put(`${API_URL}/api/clientes/${editandoId}`, nuevoCliente, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('¡Cliente actualizado!');
            } else {
                await axios.post(`${API_URL}/api/clientes`, nuevoCliente, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('¡Cliente creado!');
            }
            setMostrarFormulario(false);
            setEditandoId(null);
            setNuevoCliente({ nombre_empresa: '', contacto_nombre: '', contacto_email: '', telefono: '', direccion_texto: '', latitud: 14.6349, longitud: -90.5069 });
            cargarClientes(); 
        } catch (error) { alert('Error al guardar.'); }
    };

    const handleInputChange = (e) => setNuevoCliente({ ...nuevoCliente, [e.target.name]: e.target.value });

    const generarPDF = () => {
        const doc = new jsPDF();
        doc.text("Listado de Clientes", 14, 20);
        autoTable(doc, {
            startY: 30,
            head: [['Empresa', 'Contacto', 'Email', 'Teléfono']],
            body: clientes.map(c => [c.nombre_empresa, c.contacto_nombre, c.contacto_email, c.telefono]),
        });
        doc.save('clientes.pdf');
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>🏢 Gestión de Clientes</h2>
                <div>
                    <button className="btn btn-danger me-2" onClick={generarPDF}>📄 PDF</button>
                    <button className="btn btn-success" onClick={() => setMostrarFormulario(!mostrarFormulario)}>
                        {mostrarFormulario ? 'Cancelar' : '+ Nuevo Cliente'}
                    </button>
                </div>
            </div>

            {mostrarFormulario && (
                <div className="card p-4 mb-4 bg-light shadow-sm">
                    <h4>{editandoId ? 'Editar Cliente' : 'Nuevo Cliente'}</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Empresa:</label>
                                <input type="text" name="nombre_empresa" className="form-control" required value={nuevoCliente.nombre_empresa} onChange={handleInputChange}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Contacto:</label>
                                <input type="text" name="contacto_nombre" className="form-control" value={nuevoCliente.contacto_nombre} onChange={handleInputChange}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Email:</label>
                                <input type="email" name="contacto_email" className="form-control" value={nuevoCliente.contacto_email} onChange={handleInputChange}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Teléfono:</label>
                                <input type="text" name="telefono" className="form-control" value={nuevoCliente.telefono} onChange={handleInputChange}/>
                            </div>
                            
                            {/* INPUT CON BUSCADOR */}
                            <div className="col-12 mb-3">
                                <label>Dirección:</label>
                                <div className="input-group">
                                    <input type="text" name="direccion_texto" className="form-control" required value={nuevoCliente.direccion_texto} onChange={handleInputChange} placeholder="Ej: Tikal Futura"/>
                                    <button type="button" className="btn btn-info text-white" onClick={buscarDireccion} disabled={buscando}>
                                        {buscando ? '...' : '🔍 Buscar Mapa'}
                                    </button>
                                </div>
                            </div>

                            {/* MAPA OSM */}
                            <div className="col-12 mb-3">
                                <label className="text-primary fw-bold">📍 Ubicación GPS:</label>
                                <SelectorMapaOSM 
                                    latitud={nuevoCliente.latitud}
                                    longitud={nuevoCliente.longitud}
                                    setLatitud={(val) => setNuevoCliente(prev => ({...prev, latitud: val}))}
                                    setLongitud={(val) => setNuevoCliente(prev => ({...prev, longitud: val}))}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Guardar</button>
                    </form>
                </div>
            )}

            <div className="card shadow">
                <div className="card-body">
                    <table className="table table-hover">
                        <thead className="table-dark"><tr><th>Empresa</th><th>Contacto</th><th>Email</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {clientes.map(c => (
                                <tr key={c.id_cliente}>
                                    <td>{c.nombre_empresa}</td>
                                    <td>{c.contacto_nombre}</td>
                                    <td>{c.contacto_email}</td>
                                    <td>
                                        <button className="btn btn-sm btn-primary me-2" onClick={() => handleEditar(c)}>✏️</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleBorrar(c.id_cliente)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <button className="btn btn-secondary mt-3" onClick={() => navigate('/dashboard')}>Volver</button>
        </div>
    );
}

export default Clientes;