import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Order } from '../types';
import { Navigation, Compass, Crosshair, MapPin } from 'lucide-react';

interface MapViewProps {
  order: Order | null;
  height?: string;
  className?: string;
  interactive?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  order,
  height = '420px',
  className = '',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer references
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);

  const [followCourier, setFollowCourier] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center (Boa Vista / Roraima coordinate matching mock data)
    const initialLat = order?.origin.lat || 2.8235;
    const initialLng = order?.origin.lng || -60.6758;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
    });

    // Add high quality modern map tiles (CartoDB Positron for clean delivery look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom controls top-right
    if (interactive) {
      L.control.zoom({ position: 'topright' }).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [interactive]);

  // Update Route and Markers whenever order or courier location updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !order) return;

    // 1. Origin Pin (Pickup)
    const pickupIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 bg-amber-500/30 rounded-full animate-ping"></span>
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker([order.origin.lat, order.origin.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Retirada:</b><br/>${order.origin.address}, ${order.origin.number}`);
    } else {
      originMarkerRef.current.setLatLng([order.origin.lat, order.origin.lng]);
    }

    // 2. Destination Pin (Delivery)
    const destIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 bg-emerald-500/30 rounded-full animate-ping"></span>
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker([order.destination.lat, order.destination.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destino:</b><br/>${order.destination.address}, ${order.destination.number}`);
    } else {
      destinationMarkerRef.current.setLatLng([order.destination.lat, order.destination.lng]);
    }

    // 3. Polylines
    if (order.routeCoordinates && order.routeCoordinates.length > 0) {
      // Remaining route
      const remainingCoords = order.routeCoordinates.slice(order.currentWaypointIndex);
      const passedCoords = order.routeCoordinates.slice(0, order.currentWaypointIndex + 1);

      if (!routePolylineRef.current) {
        routePolylineRef.current = L.polyline(order.routeCoordinates, {
          color: '#f97316',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(map);
      } else {
        routePolylineRef.current.setLatLngs(remainingCoords.length > 1 ? remainingCoords : order.routeCoordinates);
      }

      // Completed trail
      if (!completedPolylineRef.current) {
        completedPolylineRef.current = L.polyline(passedCoords, {
          color: '#0ea5e9',
          weight: 5,
          opacity: 0.9,
        }).addTo(map);
      } else {
        completedPolylineRef.current.setLatLngs(passedCoords);
      }
    }

    // 4. Moving Motorcycle Marker
    const courierPos = order.courierLocation || {
      lat: order.origin.lat,
      lng: order.origin.lng,
      heading: 0,
    };

    const courierDivIcon = L.divIcon({
      className: 'courier-animated-marker',
      html: `
        <div class="relative flex items-center justify-center transform transition-transform duration-300">
          <!-- Pulse wave -->
          <div class="absolute -inset-2 bg-indigo-500/25 rounded-full animate-ping"></div>
          <div class="absolute -inset-1 bg-indigo-500/40 rounded-full animate-pulse"></div>
          
          <!-- Motorcycle Avatar Badge -->
          <div class="relative w-12 h-12 rounded-full bg-slate-900 border-2 border-white shadow-2xl flex items-center justify-center overflow-visible">
            <!-- Rotating heading arrow -->
            <div style="transform: rotate(${courierPos.heading}deg);" class="absolute -top-1 w-3 h-3 border-l-2 border-t-2 border-amber-400 rotate-45"></div>
            
            <!-- Bike Icon -->
            <span class="text-xl select-none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🛵</span>
          </div>

          <!-- Floating ETA tag -->
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md border border-slate-700/60 backdrop-blur-xs flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${order.estimatedArrivalMin > 0 ? `${order.estimatedArrivalMin} min` : 'Chegando!'}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!courierMarkerRef.current) {
      courierMarkerRef.current = L.marker([courierPos.lat, courierPos.lng], { icon: courierDivIcon })
        .addTo(map)
        .bindPopup(`<b>${order.courierName || 'Motoboy'}</b><br/>Status: Em rota`);
    } else {
      courierMarkerRef.current.setLatLng([courierPos.lat, courierPos.lng]);
      courierMarkerRef.current.setIcon(courierDivIcon);
    }

    // Auto-center on courier if following
    if (followCourier && courierPos) {
      map.panTo([courierPos.lat, courierPos.lng], { animate: true, duration: 0.6 });
    }
  }, [order, followCourier]);

  // Recenter helper
  const handleRecenterCourier = () => {
    const map = mapInstanceRef.current;
    if (!map || !order) return;
    setFollowCourier(true);

    if (order.courierLocation) {
      map.flyTo([order.courierLocation.lat, order.courierLocation.lng], 16, { animate: true });
    } else {
      map.flyTo([order.origin.lat, order.origin.lng], 15);
    }
  };

  const handleFitAllBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || !order) return;
    setFollowCourier(false);

    const group = L.featureGroup();
    if (originMarkerRef.current) group.addLayer(originMarkerRef.current);
    if (destinationMarkerRef.current) group.addLayer(destinationMarkerRef.current);
    if (courierMarkerRef.current) group.addLayer(courierMarkerRef.current);

    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds().pad(0.2), { animate: true });
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 bg-slate-100 ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating map controls */}
      {order && interactive && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleRecenterCourier}
            className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold ${
              followCourier
                ? 'bg-orange-600 text-white border-orange-500 shadow-orange-500/30'
                : 'bg-white/95 text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
            title="Seguir Motoboy"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Seguir Motoboy</span>
          </button>

          <button
            onClick={handleFitAllBounds}
            className="p-2.5 rounded-xl bg-white/95 text-slate-700 hover:bg-slate-50 shadow-lg border border-slate-200 backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Ver Rota Completa"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Rota Toda</span>
          </button>
        </div>
      )}

      {/* Legend badge at bottom */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-md flex items-center justify-between sm:justify-start gap-4 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">1</span>
          <span>Coleta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">2</span>
          <span>Entrega</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🛵</span>
          <span className="font-bold text-slate-800">GPS Ao Vivo</span>
        </div>
      </div>
    </div>
  );
};
