import React from 'react';
import { useApp } from '../../context/AppContext';
import { POPULAR_LOCATIONS } from '../../utils/mockData';
import {
  Bike,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Package,
  QrCode,
  ArrowRight,
  Camera,
  User,
  Edit3,
} from 'lucide-react';

interface ClientDashboardProps {
  onOpenNewOrder: () => void;
  onOpenHistory: () => void;
  onOpenRegister: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onOpenNewOrder,
  onOpenHistory,
  onOpenRegister,
}) => {
  const { currentUser, orders } = useApp();

  const handleOrderClick = () => {
    // Check if user has photo and registered profile
    if (!currentUser.isRegistered && !currentUser.avatar) {
      onOpenRegister();
    } else {
      onOpenNewOrder();
    }
  };

  return (
    <div className="space-y-6">
      {/* Client Profile Card with Photo */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={onOpenRegister}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-orange-500/25 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 p-1 bg-orange-600 text-white rounded-full shadow-xs">
              <Camera className="w-2.5 h-2.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">{currentUser.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Identificação com Foto</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              WhatsApp: {currentUser.phone} {currentUser.cpf ? `• CPF: ${currentUser.cpf}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenRegister}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5 text-orange-600" />
          <span>Editar Perfil & Foto</span>
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xl shadow-orange-500/20">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-amber-200">
            <Zap className="w-3.5 h-3.5 fill-amber-200" />
            <span>Entregas Rápidas em Boa Vista</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Para onde vamos levar seu pacote hoje?
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 font-medium">
            Chame um motoboy parceiro em segundos, acompanhe o deslocamento em tempo real no mapa com GPS e pague via Pix ou dinheiro.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleOrderClick}
              className="px-6 py-3.5 bg-white hover:bg-orange-50 text-orange-700 font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Pedir Entrega Agora</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl backdrop-blur-xs transition-all flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Ver Corridas Anteriores</span>
            </button>
          </div>
        </div>

        {/* Decorative background bike illustration */}
        <div className="absolute right-4 -bottom-6 opacity-15 pointer-events-none text-[160px] select-none hidden md:block">
          🛵
        </div>
      </div>

      {/* Value props cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Rastreamento GPS</h4>
            <p className="text-[11px] text-slate-500">Veja o motoboy se movendo ao vivo</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Pix e Dinheiro Direto</h4>
            <p className="text-[11px] text-slate-500">Pague direto ao motoboy na entrega</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Identificação com Foto</h4>
            <p className="text-[11px] text-slate-500">Segurança para cliente e entregador</p>
          </div>
        </div>
      </div>

      {/* Popular locations quick shortcut */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Locais Frequentes em Boa Vista</span>
          </h3>
          <span className="text-[11px] text-slate-400">Atalhos de rota</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {POPULAR_LOCATIONS.slice(0, 6).map((loc, idx) => (
            <div
              key={idx}
              onClick={handleOrderClick}
              className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <strong className="text-xs text-slate-800 group-hover:text-orange-700 block">
                  {loc.address}, {loc.number}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {loc.neighborhood} - {loc.city}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
