import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// Tamaño del mapa en pantalla
const containerStyle = {
  width: '100%',
  height: '350px'
};

// Coordenadas iniciales (Centro de Guatemala)
const center = {
  lat: 14.6349,
  lng: -90.5069
};

function SelectorMapaGoogle({ setLat, setLng }) {
  // Cargar la API de Google
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDSi3eM3vARj9R2RDTw629Le1wM5aH1c6c"
  });

  const [markerPosition, setMarkerPosition] = useState(center);

  // Función que se ejecuta al hacer clic en el mapa
  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setMarkerPosition({ lat, lng }); // Mueve el pin visual
    setLat(lat); // Manda el dato al formulario padre
    setLng(lng); // Manda el dato al formulario padre
  }, [setLat, setLng]);

  if (!isLoaded) return <div>Cargando Google Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      onClick={onMapClick} // Detectar clic
      options={{
        streetViewControl: false, // Ocultamos el muñequito naranja para limpiar la vista
        mapTypeControl: false,    // Ocultamos "Satelite/Mapa"
      }}
    >
      {/* El Pin Rojo */}
      <Marker position={markerPosition} />
    </GoogleMap>
  );
}

export default React.memo(SelectorMapaGoogle);