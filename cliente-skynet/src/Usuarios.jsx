import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const navigate = useNavigate();

    // Datos del nuevo usuario
    const [nuevoUsuario, setNuevoUsuario] = useState({
        nombre_completo: '',
        email: '',
        password: '',
        id_rol: '3' // Por defecto seleccionamos "Técnico"
    });

    useEffect(() => {
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
        if (usuarioGuardado.id_rol != 1) { // Si NO es admin
            navigate('/dashboard'); // Expulsado silenciosamente
        }
        
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const res = await axios.get('http://localhost:3002/api/usuarios');
            setUsuarios(res.data);
        } catch (error) {
            console.error('Error cargando usuarios');
        }
    };

    // --- FUNCIÓN HELPER PARA NOMBRES DE ROLES ---
    const obtenerNombreRol = (id) => {
        if (id == 1) return 'Administrador';
        if (id == 2) return 'Supervisor';
        if (id == 3) return 'Técnico';
        return 'Desconocido';
    };

    // --- GENERAR PDF ---
    const generarPDFUsuarios = () => {
        const doc = new jsPDF();
        doc.text("Listado de Personal - SkyNet", 14, 20);
        
        autoTable(doc, {
            startY: 30,
            head: [['ID', 'Nombre', 'Email', 'Rol']],
            body: usuarios.map(u => [
                u.id_usuario,
                u.nombre_completo,
                u.email,
                obtenerNombreRol(u.id_rol)
            ]),
            theme: 'grid',
        });

        doc.save('reporte_personal.pdf');
    };

    const handleInputChange = (e) => {
        setNuevoUsuario({
            ...nuevoUsuario,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3002/api/auth/registro', nuevoUsuario);
            
            alert(`¡Usuario con rol ${obtenerNombreRol(nuevoUsuario.id_rol)} creado exitosamente!`);
            setMostrarFormulario(false);
            
            setNuevoUsuario({ nombre_completo: '', email: '', password: '', id_rol: '3' });
            
            cargarUsuarios(); 
        } catch (error) {
            alert('Error al crear usuario. El correo podría estar repetido.');
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>👥 Gestión de Personal</h2>
                <div>
                    {/* Botón PDF */}
                    <button className="btn btn-danger me-2" onClick={generarPDFUsuarios}>
                        📄 Descargar PDF
                    </button>
                    {/* Botón Nuevo Usuario */}
                    <button 
                        className={`btn ${mostrarFormulario ? 'btn-secondary' : 'btn-primary'}`} 
                        onClick={() => setMostrarFormulario(!mostrarFormulario)}
                    >
                        {mostrarFormulario ? 'Cancelar' : '+ Nuevo Usuario'}
                    </button>
                </div>
            </div>

            {/* FORMULARIO */}
            {mostrarFormulario && (
                <div className="card p-4 mb-4 bg-light shadow-sm border-primary">
                    <h4 className="mb-3">Registrar Nuevo Empleado</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Nombre Completo:</label>
                                <input type="text" name="nombre_completo" className="form-control" required 
                                    value={nuevoUsuario.nombre_completo} onChange={handleInputChange} placeholder="Ej: Juan Pérez"/>
                            </div>
                            
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold">Rol del Sistema:</label>
                                <select name="id_rol" className="form-select border-success" value={nuevoUsuario.id_rol} onChange={handleInputChange}>
                                    <option value="3">👷‍♂️ Técnico (Realiza Visitas)</option>
                                    <option value="2">📋 Supervisor (Planifica y Asigna)</option>
                                    <option value="1">🔐 Administrador (Control Total)</option>
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email (Usuario):</label>
                                <input type="email" name="email" className="form-control" required 
                                    value={nuevoUsuario.email} onChange={handleInputChange}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Contraseña:</label>
                                <input type="password" name="password" className="form-control" required 
                                    value={nuevoUsuario.password} onChange={handleInputChange}/>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success w-100">Guardar Usuario</button>
                    </form>
                </div>
            )}

            {/* TABLA */}
            <div className="card shadow">
                <div className="card-body">
                    <table className="table table-hover align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u) => (
                                <tr key={u.id_usuario}>
                                    <td>{u.id_usuario}</td>
                                    <td>{u.nombre_completo}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className={`badge rounded-pill ${
                                            u.id_rol == 1 ? 'bg-danger' : 
                                            u.id_rol == 2 ? 'bg-warning text-dark' : 
                                            'bg-info text-dark'
                                        }`}>
                                            {obtenerNombreRol(u.id_rol)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <button className="btn btn-secondary mt-3" onClick={() => navigate('/dashboard')}>
                Volver al Dashboard
            </button>
        </div>
    );
}

export default Usuarios;