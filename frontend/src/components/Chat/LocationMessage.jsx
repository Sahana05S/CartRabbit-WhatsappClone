import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet when bundled
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationMessage = ({ location }) => {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return null;

  const position = [location.lat, location.lng];

  return (
    <div className="w-[240px] sm:w-[280px] h-[180px] rounded-xl overflow-hidden relative border border-black/10 dark:border-white/10 z-0">
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={false} 
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
      </MapContainer>
      
      {/* Overlay to catch clicks and open Google Maps instead of interacting with Leaflet */}
      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute inset-0 z-[400] flex flex-col justify-end p-2 cursor-pointer transition-colors hover:bg-black/10 group"
      >
         <div className="self-end bg-white/90 dark:bg-[#202c33]/90 backdrop-blur-md text-[var(--accent-default)] font-bold text-[11px] px-3 py-1.5 rounded-full shadow-lg border border-black/5 dark:border-white/5 opacity-90 group-hover:opacity-100 transition-opacity">
            View on Map
         </div>
      </a>
    </div>
  );
};

export default LocationMessage;
