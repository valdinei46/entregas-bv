import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { calculateDistanceKm, generateRoutePoints, formatCurrencyBRL, formatDistance, formatETA } from '../../utils/geo';
import {
  Bike,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Star,
  QrCode,
  AlertCircle,
  Copy,
  ChevronRight,
  Sparkles,
  Navigation,
  Crosshair,
  Route,
  Gauge,
  Timer,
  Activity,
  Zap,
} from 'lucide-react';

interface ClientActiveOrderViewProps {
  order: Order;
  onOpenChat: () => void;
  onOpenRating: () => void;
}

export const ClientActiveOrderView: React.FC<ClientActiveOrderViewProps> = ({
  order,
  onOpenChat,
  onOpenRating,
}) => {
  const {
    jumpToOrderStatus,
    advanceSimulationStep,
    isSimulating,
    setIsSimulating,
    liveTelemetry,
  } = useApp();

  // Map and layer references for the route visualization inside ClientActiveOrderView
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const courierToDestinationPolylineRef = useRef<L.Polyline | null>(null);
  const glowPolylineRef = useRef<L.Polyline | null>(null);

  const [followCourier, setFollowCourier] = useState(true);

  // Speed tracking & dynamic moving average speed (km/h)
  const speedHistoryRef = useRef<number[]>([36, 38, 35]);
  const [averageSpeedKmH, setAverageSpeedKmH] = useState<number>(36);
  const [currentInstantSpeed, setCurrentInstantSpeed] = useState<number>(36);

  // Current positions
  const currentCourierLat = order.courierLocation?.lat ?? order.origin.lat;
  const currentCourierLng = order.courierLocation?.lng ?? order.origin.lng;
  const heading = order.courierLocation?.heading ?? 0;
  const destLat = order.destination.lat;
  const destLng = order.destination.lng;

  // 1. Calculate real-time remaining distance along the route coordinates or direct distance
  const calculateRemainingDistanceKm = (): number => {
    if (order.status === 'delivered') return 0;
    const courierPos: [number, number] = [currentCourierLat, currentCourierLng];
    const destPos: [number, number] = [destLat, destLng];

    if (order.routeCoordinates && order.routeCoordinates.length > 0) {
      let total = 0;
      let prev = courierPos;
      const remainingSegments = order.routeCoordinates.slice(order.currentWaypointIndex);
      for (const pt of remainingSegments) {
        total += calculateDistanceKm(prev[0], prev[1], pt[0], pt[1]);
        prev = pt;
      }
      total += calculateDistanceKm(prev[0], prev[1], destPos[0], destPos[1]);
      return Math.max(0.05, Math.round(total * 10) / 10);
    }

    return Math.max(0.05, calculateDistanceKm(currentCourierLat, currentCourierLng, destLat, destLng));
  };

  const remainingDistanceKm = calculateRemainingDistanceKm();

  // 2. Dynamic tracking of courier speed to compute rolling average
  useEffect(() => {
    const rawSpeed =
      liveTelemetry?.orderId === order.id && liveTelemetry.speedKmH > 0
        ? liveTelemetry.speedKmH
        : order.courierLocation?.speedKmH && order.courierLocation.speedKmH > 0
        ? order.courierLocation.speedKmH
        : null;

    if (rawSpeed && rawSpeed > 0) {
      setCurrentInstantSpeed(Math.round(rawSpeed));
      speedHistoryRef.current.push(rawSpeed);
      if (speedHistoryRef.current.length > 8) {
        speedHistoryRef.current.shift();
      }
      const sum = speedHistoryRef.current.reduce((a, b) => a + b, 0);
      const computedAvg = Math.round(sum / speedHistoryRef.current.length);
      setAverageSpeedKmH(Math.max(18, Math.min(65, computedAvg)));
    }
  }, [order.courierLocation?.speedKmH, liveTelemetry, order.id]);

  // 3. Dynamic ETA Calculation based on Remaining Distance and Average Speed:
  // Formula: time (hours) = distance (km) / speed (km/h)
  // Formula: time (seconds) = (distance / speed) * 3600
  const effectiveSpeed = Math.max(15, averageSpeedKmH);
  const calculatedSeconds =
    order.status === 'delivered'
      ? 0
      : Math.max(0, Math.round((remainingDistanceKm / effectiveSpeed) * 3600));

  const [dynamicSecondsRemaining, setDynamicSecondsRemaining] = useState<number>(calculatedSeconds);

  // Synchronize dynamic countdown when position or speed recalculates ETA
  useEffect(() => {
    setDynamicSecondsRemaining(calculatedSeconds);
  }, [calculatedSeconds]);

  // 1-second dynamic countdown timer for live real-time countdown display
  useEffect(() => {
    if (order.status === 'delivered' || order.status === 'pending') return;

    const interval = setInterval(() => {
      setDynamicSecondsRemaining(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order.status]);

  // Formatted ETA string for badges and map markers
  const getFormattedEta = () => {
    if (order.status === 'delivered') return 'Entregue!';
    if (order.status === 'pending') return 'Aguardando Motoboy';
    if (dynamicSecondsRemaining <= 15) return 'Chegando agora!';
    if (dynamicSecondsRemaining < 60) return `${dynamicSecondsRemaining} seg`;
    const mins = Math.floor(dynamicSecondsRemaining / 60);
    const secs = dynamicSecondsRemaining % 60;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs}s`;
  };

  const formattedEta = getFormattedEta();

  // Formatted arrival clock time (e.g. 15:42)
  const arrivalTimeFormatted =
    order.status === 'delivered'
      ? 'Entregue'
      : new Date(Date.now() + dynamicSecondsRemaining * 1000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

  // Formatted distance (km or meters)
  const formattedDistanceStr =
    remainingDistanceKm < 1
      ? `${Math.round(remainingDistanceKm * 1000)} m`
      : `${remainingDistanceKm.toFixed(1)} km`;

  // Total journey progress percentage
  const totalJourneyKm = order.distanceKm || 3.5;
  const progressPercentage =
    order.status === 'delivered'
      ? 100
      : Math.min(98, Math.max(5, Math.round(((totalJourneyKm - remainingDistanceKm) / totalJourneyKm) * 100)));

  // Initialize Leaflet Map directly inside ClientActiveOrderView
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = currentCourierLat || order.origin.lat || 2.8235;
    const initialLng = currentCourierLng || order.origin.lng || -60.6758;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // High quality Voyager / CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and draw/update the Polyline between motoboy and client destination
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !order) return;

    const courierPos: [number, number] = [currentCourierLat, currentCourierLng];
    const destPos: [number, number] = [destLat, destLng];
    const originPos: [number, number] = [order.origin.lat, order.origin.lng];

    // 1. Destination Marker (Cliente Final)
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
      destinationMarkerRef.current = L.marker(destPos, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destino Final do Cliente:</b><br/>${order.destination.address}, ${order.destination.number}`);
    } else {
      destinationMarkerRef.current.setLatLng(destPos);
    }

    // 2. Origin Marker (Ponto de Retirada)
    const originIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white text-[10px] font-bold">
            📦
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker(originPos, { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>Ponto de Retirada:</b><br/>${order.origin.address}, ${order.origin.number}`);
    } else {
      originMarkerRef.current.setLatLng(originPos);
    }

    // 3. Moving Motoboy Marker with animated rotation and live ETA tag
    const courierIcon = L.divIcon({
      className: 'courier-animated-marker',
      html: `
        <div class="relative flex items-center justify-center transform transition-transform duration-300">
          <div class="absolute -inset-2 bg-orange-500/25 rounded-full animate-ping"></div>
          <div class="absolute -inset-1 bg-orange-500/40 rounded-full animate-pulse"></div>
          
          <div class="relative w-12 h-12 rounded-full bg-slate-900 border-2 border-white shadow-2xl flex items-center justify-center overflow-visible">
            <div style="transform: rotate(${heading}deg);" class="absolute -top-1 w-3 h-3 border-l-2 border-t-2 border-amber-400 rotate-45"></div>
            <span class="text-xl select-none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🛵</span>
          </div>

          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-slate-700/80 backdrop-blur-xs flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${formattedEta}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!courierMarkerRef.current) {
      courierMarkerRef.current = L.marker(courierPos, { icon: courierIcon })
        .addTo(map)
        .bindPopup(`<b>${order.courierName || 'Motoboy'}</b><br/>Posição Atual • ETA: ${formattedEta}`);
    } else {
      courierMarkerRef.current.setLatLng(courierPos);
      courierMarkerRef.current.setIcon(courierIcon);
    }

    // 4. Polilinha entre a posição atual do motoboy e o destino final do cliente
    let polylineCoords: [number, number][] = [];
    if (order.routeCoordinates && order.routeCoordinates.length > 0) {
      // Slice intermediate remaining path coordinates up to destination
      const remainingSegments = order.routeCoordinates.slice(order.currentWaypointIndex);
      polylineCoords = [courierPos, ...remainingSegments, destPos];
    } else {
      // If coordinates aren't provided, generate smooth street path from courier to destination
      polylineCoords = generateRoutePoints(courierPos, destPos, 30);
    }

    // Outer glow casing for the polyline
    if (!glowPolylineRef.current) {
      glowPolylineRef.current = L.polyline(polylineCoords, {
        color: '#fb923c',
        weight: 9,
        opacity: 0.4,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      glowPolylineRef.current.setLatLngs(polylineCoords);
    }

    // Primary route polyline connecting current motoboy position to the final customer destination
    if (!courierToDestinationPolylineRef.current) {
      courierToDestinationPolylineRef.current = L.polyline(polylineCoords, {
        color: '#ea580c',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      courierToDestinationPolylineRef.current.setLatLngs(polylineCoords);
    }

    // Pan camera to follow the motoboy smoothly
    if (followCourier) {
      map.panTo(courierPos, { animate: true, duration: 0.6 });
    }
  }, [order, currentCourierLat, currentCourierLng, heading, destLat, destLng, followCourier, formattedEta, averageSpeedKmH]);

  // Map control helpers
  const handleRecenterCourier = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setFollowCourier(true);
    map.flyTo([currentCourierLat, currentCourierLng], 16, { animate: true });
  };

  const handleFitRouteBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setFollowCourier(false);

    const bounds = L.latLngBounds([
      [currentCourierLat, currentCourierLng],
      [destLat, destLng],
      [order.origin.lat, order.origin.lng],
    ]);
    map.fitBounds(bounds.pad(0.2), { animate: true });
  };

  const getStatusInfo = () => {
    switch (order.status) {
      case 'pending':
        return {
          title: 'Buscando motoboy mais próximo...',
          subtitle: 'Aguardando um entregador parceiro aceitar a corrida.',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          step: 1,
        };
      case 'accepted':
        return {
          title: 'Motoboy a caminho da coleta!',
          subtitle: `${order.courierName || 'O entregador'} está se deslocando até o endereço de retirada.`,
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          step: 2,
        };
      case 'arrived_pickup':
        return {
          title: 'Motoboy chegou ao local de coleta!',
          subtitle: 'Retirando o pacote para iniciar a rota de entrega.',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
          step: 3,
        };
      case 'in_transit':
        return {
          title: 'Pacote a caminho do destino!',
          subtitle: 'Acompanhe o motoboy se movendo em tempo real no mapa.',
          badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
          step: 4,
        };
      case 'arriving':
        return {
          title: 'Entregador chegando!',
          subtitle: 'O motoboy está a menos de 2 minutos do seu endereço.',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          step: 4,
        };
      case 'delivered':
        return {
          title: 'Entrega Concluída com Sucesso!',
          subtitle: 'O pacote foi entregue em mãos. Obrigado por usar MotoFlash!',
          badgeBg: 'bg-emerald-500 text-white border-emerald-600',
          step: 5,
        };
      default:
        return {
          title: 'Status da corrida',
          subtitle: '',
          badgeBg: 'bg-slate-100 text-slate-700',
          step: 1,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Bike className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeBg}`}>
                {statusInfo.title}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">{order.code}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{statusInfo.subtitle}</p>
          </div>
        </div>

        {/* Real-time Dynamic ETA Badge */}
        {order.status !== 'delivered' && (
          <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shrink-0 shadow-lg border border-slate-800">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Previsão de Chegada (ETA)
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-base font-black text-amber-300 tracking-tight block">
                {formattedEta}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {order.status === 'pending' ? 'Calculado via GPS' : `Chegada prevista às ${arrivalTimeFormatted}`}
              </span>
            </div>
          </div>
        )}

        {/* If delivered: prompt review */}
        {order.status === 'delivered' && !order.rating && (
          <button
            onClick={onOpenRating}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
          >
            <Star className="w-4 h-4 fill-white text-white" />
            <span>Avaliar Entrega</span>
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Aceito', step: 2 },
            { label: 'Na Coleta', step: 3 },
            { label: 'Em Trânsito', step: 4 },
            { label: 'Entregue', step: 5 },
          ].map((item, idx) => {
            const isCompleted = statusInfo.step >= item.step;
            const isCurrent = statusInfo.step === item.step;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-orange-200 animate-pulse' : ''}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-semibold mt-1 ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEDICATED REAL-TIME DYNAMIC ETA & TELEMETRY DASHBOARD CARD */}
      {order.status !== 'delivered' && (
        <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl border border-slate-800 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                <Timer className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-white">
                    Estimativa Dinâmica de Chegada (ETA)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Tempo Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cálculo contínuo: <span className="font-mono text-amber-300">tempo = distância atual / velocidade média</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-400">
                Chegada estimada:
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-amber-300 text-xs shadow-inner">
                🕒 {arrivalTimeFormatted}
              </span>
            </div>
          </div>

          {/* 4 Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tile 1: ETA */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-inner flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Tempo Estimado</span>
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div className="my-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight block">
                  {formattedEta}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Contagem dinâmica ao vivo
              </span>
            </div>

            {/* Tile 2: Distância Restante */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-inner flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Distância Restante</span>
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div className="my-1.5">
                <span className="text-xl sm:text-2xl font-black text-blue-300 tracking-tight block">
                  {formattedDistanceStr}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Até seu endereço final
              </span>
            </div>

            {/* Tile 3: Velocidade Média */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-inner flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Velocidade Média</span>
                <Gauge className="w-4 h-4 text-orange-400" />
              </div>
              <div className="my-1.5">
                <span className="text-xl sm:text-2xl font-black text-orange-400 tracking-tight block">
                  {averageSpeedKmH} km/h
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Instantânea:</span>
                <strong className="text-slate-200 font-mono">{currentInstantSpeed} km/h</strong>
              </div>
            </div>

            {/* Tile 4: Status do Fluxo / Trânsito */}
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-inner flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Status do Fluxo</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-1.5">
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 tracking-tight block truncate">
                  {dynamicSecondsRemaining <= 30
                    ? 'Chegando ao Portão'
                    : currentInstantSpeed > 20
                    ? 'Trânsito Fluindo'
                    : 'Aproximação'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {order.status === 'in_transit' ? 'Em trânsito com o pacote' : statusInfo.title}
              </span>
            </div>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Progresso da Rota com GPS</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {progressPercentage}% concluído
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm shadow-orange-500/50"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Coleta ({order.origin.neighborhood})</span>
              <span>Entrega ({order.destination.neighborhood})</span>
            </div>
          </div>
        </div>
      )}

      {/* MAP WITH POLYLINE VISUALIZATION BETWEEN MOTBOY AND CLIENT DESTINATION */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200/90 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-[420px] z-0" />

        {/* Floating Route Info Banner on the Map */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto z-10 bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-orange-600 text-white shadow-xs">
              <Route className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-300 block">
                  Rota: Motoboy ➔ Destino Final
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  GPS Ao Vivo
                </span>
              </div>
              <span className="text-[11px] text-slate-300">
                Restam <strong>{formattedDistanceStr}</strong> • Vel. Média: <strong>{averageSpeedKmH} km/h</strong> • ETA: <strong className="text-amber-300 font-mono">{formattedEta}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-20 left-4 z-10 flex flex-col gap-2">
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
            onClick={handleFitRouteBounds}
            className="p-2.5 rounded-xl bg-white/95 text-slate-700 hover:bg-slate-50 shadow-lg border border-slate-200 backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Ver Rota Toda"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Rota Toda</span>
          </button>
        </div>

        {/* Legend bar at bottom of the Map */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-md flex items-center justify-between sm:justify-start gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🛵</span>
            <span className="font-bold text-slate-900">Motoboy</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-1.5 rounded-full bg-orange-600 border border-orange-400"></span>
            <span className="font-semibold text-orange-700">Polilinha de Rota</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">✓</span>
            <span className="font-bold text-emerald-800">Destino Cliente</span>
          </div>
        </div>
      </div>

      {/* Courier Profile & Contact Card */}
      {order.courierName && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={order.courierAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                alt={order.courierName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-orange-500/20"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-400 text-[10px] font-bold flex items-center gap-0.5 shadow-sm">
                <Star className="w-3 h-3 fill-amber-400" />
                {order.courierRating || 4.9}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base">{order.courierName}</h4>
                <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-full" title="Verificado">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {order.courierVehicle?.model} • Placa{' '}
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {order.courierVehicle?.plate}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cor: {order.courierVehicle?.color}
              </p>
            </div>
          </div>

          {/* Action buttons: Call & Chat */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenChat}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat Interno</span>
            </button>

            <a
              href={`tel:${order.courierPhone || '95991361880'}`}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Ligar</span>
            </a>
          </div>
        </div>
      )}

      {/* Order Info & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Addresses */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Endereços da Corrida
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
              <div>
                <span className="text-slate-400 font-medium block">Retirada:</span>
                <strong className="text-slate-900 text-sm">
                  {order.origin.address}, {order.origin.number}
                </strong>
                <p className="text-slate-500">{order.origin.neighborhood} - {order.origin.city}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
              <div>
                <span className="text-slate-400 font-medium block">Entrega Final:</span>
                <strong className="text-slate-900 text-sm">
                  {order.destination.address}, {order.destination.number}
                </strong>
                <p className="text-slate-500">{order.destination.neighborhood} - {order.destination.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pagamento ao Motoboy
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">
                {order.paymentMethod === 'pix' ? 'Pix no local' : order.paymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Distância Total:</span>
                <strong>{order.distanceKm} km</strong>
              </div>
              <div className="flex justify-between">
                <span>Distância Restante:</span>
                <strong className="text-orange-600 font-bold">{formattedDistanceStr}</strong>
              </div>
              <div className="flex justify-between">
                <span>Estimativa (ETA):</span>
                <strong className="text-amber-600 font-bold font-mono">{formattedEta}</strong>
              </div>
              <div className="flex justify-between">
                <span>Velocidade Média:</span>
                <strong className="text-slate-800 font-semibold">{averageSpeedKmH} km/h</strong>
              </div>
              <div className="flex justify-between">
                <span>Tipo de item:</span>
                <strong className="capitalize">{order.packageType}</strong>
              </div>
              {order.cashChangeFor && (
                <div className="flex justify-between text-amber-700">
                  <span>Troco solicitado para:</span>
                  <strong>{formatCurrencyBRL(order.cashChangeFor)}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500 font-medium">Valor Total:</span>
            <span className="text-xl font-black text-slate-900">
              {formatCurrencyBRL(order.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Professional Delivery Security Code Card */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-600/90 text-white flex items-center justify-center font-mono font-black text-xl shadow-inner shrink-0">
            {order.deliveryConfirmationCode || '4829'}
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Código de Confirmação da Entrega (PIN)
            </span>
            <p className="text-xs text-slate-300">
              Informe este código de 4 dígitos ao motoboy no ato da entrega para validar o recebimento com segurança.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Entrega Protegida</span>
        </div>
      </div>
    </div>
  );
};
