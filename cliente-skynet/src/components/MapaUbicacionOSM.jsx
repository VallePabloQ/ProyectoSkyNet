import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Arreglo de iconos ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// -------------------------

function MapaUbicacionOSM({ latitud, longitud }) {
    if (!latitud || !longitud) return <p>Esperando coordenadas...</p>;

    const position = [parseFloat(latitud), parseFloat(longitud)];

    return (
        <div className="border rounded shadow-sm my-3" style={{ height: '250px', overflow: 'hidden' }}>
            <MapContainer 
                center={position} 
                zoom={16} 
                scrollWheelZoom={false} // Desactivamos zoom con scroll para que no moleste en el modal
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>
                        ¡Estás aquí! <br /> 
                        Lat: {latitud}, Long: {longitud}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}

export default MapaUbicacionOSM;