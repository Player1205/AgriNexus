import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, MapPin } from 'lucide-react';

// Fix for default Leaflet icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

function ChangeView({ center, zoom }) {
    const map = useMapEvents({});
    map.setView(center, zoom);
    return null;
}

export default function MapModal({ isOpen, onClose, onSelectLocation }) {
    // Default to India's approximate center (Amravati) if no location
    const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 });
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [zoomLevel, setZoomLevel] = useState(5);

    React.useEffect(() => {
        if (isOpen && typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLat = pos.coords.latitude;
                    const userLng = pos.coords.longitude;
                    setPosition({ lat: userLat, lng: userLng });
                    setMapCenter([userLat, userLng]);
                    setZoomLevel(12); // Zoom in closer if we found them
                },
                (err) => console.warn("MapModal GPS fetch failed:", err),
                { timeout: 5000, enableHighAccuracy: false }
            );
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (position) {
            onSelectLocation(position.lat, position.lng);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl flex flex-col h-[70vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-emerald-800">
                        <MapPin className="w-5 h-5" />
                        <h2 className="font-bold">Select Farm Location</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="flex-1 relative bg-gray-100">
                    <MapContainer 
                        center={mapCenter} 
                        zoom={zoomLevel} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <ChangeView center={mapCenter} zoom={zoomLevel} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                    
                    <div className="absolute top-4 left-0 right-0 z-[400] flex justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur text-gray-800 text-xs font-bold px-4 py-2 rounded-full shadow-lg pointer-events-auto border border-gray-200">
                            Tap anywhere on the map to drop a pin
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                        {position ? `Lat: ${position.lat.toFixed(4)}, Lon: ${position.lng.toFixed(4)}` : 'No location selected'}
                    </div>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:from-emerald-700 hover:to-green-700 active:scale-95 transition-all"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
}
