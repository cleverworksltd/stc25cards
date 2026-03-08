import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapCaptureProps {
  label: string;
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

const MapCenterObserver = ({ setPosition }: { setPosition: (pos: L.LatLng) => void }) => {
  const map = useMapEvents({
    moveend() {
      setPosition(map.getCenter());
    },
    zoomend() {
      setPosition(map.getCenter());
    }
  });

  return null;
};

const MapCapture: React.FC<MapCaptureProps> = ({ label, lat, lng, onChange }) => {
  const [position, setPosition] = useState<L.LatLng | null>(lat && lng ? new L.LatLng(lat, lng) : null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (position) {
      onChange(position.lat, position.lng);
    }
  }, [position]);

  const handleLocateMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(newPos);
          if (mapRef.current) {
            mapRef.current.flyTo(newPos, 19);
          }
          setIsLocating(false);
        },
        (err) => {
          console.error(err);
          alert("Could not get location.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 flex flex-col bg-slate-50 h-full relative group transition-all hover:border-brand-400">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{label}</p>
        <button 
          onClick={handleLocateMe} 
          disabled={isLocating}
          className="no-print px-2 py-1 bg-blue-100 text-blue-700 rounded text-[9px] font-bold hover:bg-blue-200 flex items-center gap-1"
        >
          {isLocating ? '⏳ Locating...' : '📍 My Location'}
        </button>
      </div>
      
      <div className="flex-1 w-full rounded overflow-hidden border border-slate-200 relative z-0 min-h-[250px]">
        <MapContainer 
          center={position || [51.505, -0.09]} 
          zoom={position ? 19 : 13} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            maxZoom={21}
          />
          <MapCenterObserver setPosition={setPosition} />
        </MapContainer>
        
        {/* Fixed Center Pin Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="relative flex items-center justify-center">
            {/* Pin head */}
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center absolute -top-6">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            {/* Pin point */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-red-500 absolute -top-1"></div>
            {/* Shadow */}
            <div className="w-3 h-1 bg-black/30 rounded-full blur-[1px] absolute top-0"></div>
          </div>
        </div>
      </div>
      <div className="text-[8px] text-slate-400 mt-1 text-center no-print">
        Drag the map to position the pin exactly over the manhole.
      </div>
    </div>
  );
};

export default MapCapture;
