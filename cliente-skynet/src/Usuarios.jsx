import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const navigate = useNavigate();

    // --- TU URL DE RAILWAY (USUARIOS) ---
    const API_URL = 'https://usuarios-19-26373.up.railway.app';

    const [nuevoUsuario, setNuevoUsuario] = useState({
        nombre_completo: '',
        email: '',
        password: '',
        id_rol: '3' 
    });

    useEffect(() => {
        // Protección de ruta (Solo Admin)
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
        if (usuarioGuardado.id_rol != 1) navigate('/dashboard');
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/usuarios`);
            setUsuarios(res.data);
        } catch (error) { console.error('Error cargando usuarios'); }
    };

    const obtenerNombreRol = (id) => {
        if (id == 1) return 'Administrador';
        if (id == 2) return 'Supervisor';
        if (id == 3) return 'Técnico';
        return 'Desconocido';
    };

    const generarPDF = () => {
        const doc = new jsPDF();
        doc.text("Listado de Personal", 14, 20);
        autoTable(doc, {
            startY: 30,
            head: [['ID', 'Nombre', 'Email', 'Rol']],
            body: usuarios.map(u => [u.id_usuario, u.nombre_completo, u.email, obtenerNombreRol(u.id_rol)]),
        });
        doc.save('personal.pdf');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/auth/registro`, nuevoUsuario);
            alert('¡Usuario creado!');
            setMostrarFormulario(false);
            setNuevoUsuario({ nombre_completo: '', email: '', password: '', id_rol: '3' });
            cargarUsuarios(); 
        } catch (error) { alert('Error al crear usuario (Email duplicado).'); }
    };

    const handleInputChange = (e) => setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>👥 Gestión de Personal</h2>
                <div>
                    <button className="btn btn-danger me-2" onClick={generarPDF}>📄 PDF</button>
                    <button className="btn btn-primary" onClick={() => setMostrarFormulario(!mostrarFormulario)}>
                        {mostrarFormulario ? 'Cancelar' : '+ Nuevo Usuario'}
                    </button>
                </div>
            </div>

            {mostrarFormulario && (
                <div className="card p-4 mb-4 bg-light shadow-sm">
                    <h4>Registrar Empleado</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Nombre:</label>
                                <input type="text" name="nombre_completo" className="form-control" required value={nuevoUsuario.nombre_completo} onChange={handleInputChange}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Rol:</label>
                                <select name="id_rol" className="form-select" value={nuevoUsuario.id_rol} onChange={handleInputChange}>
                                    <option value="3">Técnico</option>
                                    <option value="2">Supervisor</option>
                                    <option value="1">Administrador</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Email:</label>
                                <input type="email" name="email" className="form-control" required value={nuevoUsuario.email} onChange={handleInputChange}/>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label>Contraseña:</label>
                                <input type="password" name="password" className="form-control" required value={nuevoUsuario.password} onChange={handleInputChange}/>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success w-100">Registrar</button>
                    </form>
                </div>
            )}

            <div className="card shadow">
                <div className="card-body">
                    <table className="table table-hover">
                        <thead className="table-dark"><tr><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id_usuario}>
                                    <td>{u.nombre_completo}</td>
                                    <td>{u.email}</td>
                                    <td><span className="badge bg-info text-dark">{obtenerNombreRol(u.id_rol)}</span></td>
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

export default Usuarios;