import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SelectorMapaGoogle from './SelectorMapaGoogle';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const navigate = useNavigate();

    // Estado para saber si estamos editando (y qué ID estamos editando)
    const [editandoId, setEditandoId] = useState(null);

    const [nuevoCliente, setNuevoCliente] = useState({
        nombre_empresa: '',
        contacto_nombre: '',
        contacto_email: '',
        telefono: '',
        direccion_texto: '',
        latitud: '',
        longitud: ''
    });

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/'); return; }

            const response = await axios.get('https://clientes-19-26373.up.railway.app/api/clientes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClientes(response.data);
        } catch (error) {
            console.error("Error cargando clientes:", error);
        }
    };

    // --- FUNCIÓN BORRAR ---
    const handleBorrar = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar este cliente?")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`https://clientes-19-26373.up.railway.app/api/clientes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Cliente eliminado.");
            cargarClientes(); // Recargar la lista
        } catch (error) {
            alert("No se pudo borrar. Puede que tenga visitas asociadas.");
        }
    };

    // --- FUNCIÓN EDITAR (PREPARAR FORMULARIO) ---
    const handleEditar = (cliente) => {
        setEditandoId(cliente.id_cliente); // Guardamos el ID que estamos editando
        setNuevoCliente({
            nombre_empresa: cliente.nombre_empresa,
            contacto_nombre: cliente.contacto_nombre,
            contacto_email: cliente.contacto_email,
            telefono: cliente.telefono,
            direccion_texto: cliente.direccion_texto,
            latitud: parseFloat(cliente.latitud), // Aseguramos que sean números
            longitud: parseFloat(cliente.longitud)
        });
        setMostrarFormulario(true); // Abrimos el formulario
        window.scrollTo(0, 0); // Subimos la pantalla para que vea el form
    };

    const handleInputChange = (e) => {
        setNuevoCliente({
            ...nuevoCliente,
            [e.target.name]: e.target.value
        });
    };

    // --- SUBMIT UNIFICADO (CREAR O ACTUALIZAR) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            if (editandoId) {
                // MODO EDICIÓN (PUT)
                await axios.put(`https://clientes-19-26373.up.railway.app/api/clientes/${editandoId}`, nuevoCliente, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('¡Cliente actualizado exitosamente!');
            } else {
                // MODO CREACIÓN (POST)
                await axios.post('https://clientes-19-26373.up.railway.app/api/clientes', nuevoCliente, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('¡Cliente creado exitosamente!');
            }

            // Limpieza
            setMostrarFormulario(false);
            setEditandoId(null); // Salimos del modo edición
            setNuevoCliente({
                nombre_empresa: '', contacto_nombre: '', contacto_email: '',
                telefono: '', direccion_texto: '', latitud: '', longitud: ''
            });
            cargarClientes(); 
        } catch (error) {
            console.error(error);
            alert('Error al guardar. Verifica los datos.');
        }
    };

    // --- FUNCIÓN PDF ---
    const generarPDFClientes = () => {
        const doc = new jsPDF();
        doc.text("Directorio de Clientes - SkyNet", 14, 20);
        autoTable(doc, {
            startY: 30,
            head: [['Empresa', 'Contacto', 'Email', 'Teléfono', 'Dirección']],
            body: clientes.map(c => [c.nombre_empresa, c.contacto_nombre, c.contacto_email, c.telefono, c.direccion_texto]),
            theme: 'grid',
        });
        doc.save('reporte_clientes.pdf');
    };

    // Función auxiliar para cancelar el formulario y limpiar
    const cancelarFormulario = () => {
        setMostrarFormulario(false);
        setEditandoId(null);
        setNuevoCliente({
            nombre_empresa: '', contacto_nombre: '', contacto_email: '',
            telefono: '', direccion_texto: '', latitud: '', longitud: ''
        });
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>🏢 Gestión de Clientes</h2>
                <div>
                    <button className="btn btn-danger me-2" onClick={generarPDFClientes}>📄 PDF</button>
                    <button 
                        className={`btn ${mostrarFormulario ? 'btn-secondary' : 'btn-success'}`} 
                        onClick={mostrarFormulario ? cancelarFormulario : () => setMostrarFormulario(true)}
                    >
                        {mostrarFormulario ? 'Cancelar' : '+ Nuevo Cliente'}
                    </button>
                </div>
            </div>

            {mostrarFormulario && (
                <div className="card p-4 mb-4 bg-light shadow-sm border-warning">
                    <h4 className="mb-3 text-primary">
                        {editandoId ? `✏️ Editando Cliente #${editandoId}` : '✨ Registrar Nuevo Cliente'}
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Nombre Empresa:</label>
                                <input type="text" name="nombre_empresa" className="form-control" required onChange={handleInputChange} value={nuevoCliente.nombre_empresa}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Nombre Contacto:</label>
                                <input type="text" name="contacto_nombre" className="form-control" onChange={handleInputChange} value={nuevoCliente.contacto_nombre}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Email:</label>
                                <input type="email" name="contacto_email" className="form-control" onChange={handleInputChange} value={nuevoCliente.contacto_email}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Teléfono:</label>
                                <input type="text" name="telefono" className="form-control" onChange={handleInputChange} value={nuevoCliente.telefono}/>
                            </div>
                            <div className="col-12 mb-3">
                                <label>Dirección Escrita:</label>
                                <input type="text" name="direccion_texto" className="form-control" required onChange={handleInputChange} value={nuevoCliente.direccion_texto}/>
                            </div>
                            
                            <div className="col-12 mb-3">
                                <label className="fw-bold text-primary mb-2">📍 Ubicación GPS (Modificar en el mapa si es necesario):</label>
                                <SelectorMapaGoogle 
                                    setLat={(val) => setNuevoCliente(prev => ({...prev, latitud: val}))}
                                    setLng={(val) => setNuevoCliente(prev => ({...prev, longitud: val}))}
                                />
                                {editandoId && <small className="text-muted">Nota: El pin se centrará en la nueva ubicación al hacer clic.</small>}
                            </div>
                        </div>
                        <button type="submit" className={`btn w-100 ${editandoId ? 'btn-warning' : 'btn-primary'}`}>
                            {editandoId ? 'Actualizar Datos' : 'Guardar Cliente'}
                        </button>
                    </form>
                </div>
            )}

            <div className="card shadow">
                <div className="card-body">
                    <table className="table table-hover">
                        <thead className="table-dark">
                            <tr>
                                <th>Empresa</th>
                                <th>Contacto</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((cliente) => (
                                <tr key={cliente.id_cliente}>
                                    <td>{cliente.nombre_empresa}</td>
                                    <td>{cliente.contacto_nombre}</td>
                                    <td>{cliente.contacto_email}</td>
                                    <td>{cliente.telefono}</td>
                                    <td>
                                        <button 
                                            className="btn btn-sm btn-primary me-2"
                                            onClick={() => handleEditar(cliente)} // <--- CONECTADO
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleBorrar(cliente.id_cliente)} // <--- CONECTADO
                                        >
                                            🗑️ Borrar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {clientes.length === 0 && (
                                <tr><td colSpan="5" className="text-center">No hay clientes registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <button className="btn btn-secondary mt-3" onClick={() => navigate('/dashboard')}>Volver al Dashboard</button>
        </div>
    );
}

export default Clientes;