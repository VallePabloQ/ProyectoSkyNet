import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
// -------------------------------------------------------------------------

// Componente auxiliar para recentrar el mapa cuando cambian las coordenadas externas
function RecenterAutomatically({lat, lng}) {
 const map = useMap();
 useEffect(() => {
   map.setView([lat, lng]);
 }, [lat, lng, map]);
 return null;
}

function SelectorMapaOSM({ latitud, longitud, setLatitud, setLongitud }) {
    // Coordenadas por defecto (Ciudad de Guatemala) si no vienen datos
    const centerLat = latitud || 14.634915;
    const centerLng = longitud || -90.506882;
    
    const [position, setPosition] = useState({ lat: centerLat, lng: centerLng });
    const markerRef = useRef(null);

    // Actualizar posición si las props cambian externamente (ej. al editar)
    useEffect(() => {
        if (latitud && longitud) {
            setPosition({ lat: parseFloat(latitud), lng: parseFloat(longitud) });
        }
    }, [latitud, longitud]);

    // Manejador del evento cuando se arrastra el marcador
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPosition(newPos);
                    // Actualizamos los estados del padre (Clientes.jsx)
                    setLatitud(newPos.lat.toFixed(8));
                    setLongitud(newPos.lng.toFixed(8));
                }
            },
        }),
        [setLatitud, setLongitud],
    );

    return (
        <div className="mb-3 border rounded shadow-sm" style={{ height: '400px', overflow: 'hidden' }}>
            <MapContainer 
                center={[centerLat, centerLng]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker 
                    draggable={true} 
                    eventHandlers={eventHandlers} 
                    position={position} 
                    ref={markerRef}>
                    <Popup>
                        ¡Arrástrame para ajustar la ubicación! <br /> 
                        Lat: {position.lat.toFixed(5)}, Long: {position.lng.toFixed(5)}
                    </Popup>
                </Marker>
                <RecenterAutomatically lat={position.lat} lng={position.lng} />
            </MapContainer>
             <p className="text-muted small text-center mt-1">
                ℹ️ Arrastra el marcador azul para precisar la ubicación exacta.
            </p>
        </div>
    );
}

export default SelectorMapaOSM;