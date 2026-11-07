import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Bike,
  User,
  Volume2,
  VolumeX,
  Bell,
  History,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenNotifications: () => void;
  onOpenAdminLogin: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenNotifications,
  onOpenAdminLogin,
  onOpenProfile,
}) => {
  const {
    activeRole,
    switchRole,
    currentUser,
    soundEnabled,
    toggleSound,
    notifications,
    activeOrder,
  } = useApp();

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const handleRoleClick = (role: UserRole) => {
    if (role === 'admin' && activeRole !== 'admin') {
      onOpenAdminLogin();
    } else {
      switchRole(role);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Bike className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  MotoFlash
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                  Profissional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Entregas & Rastreamento GPS
              </p>
            </div>
          </div>

          {/* Role Switcher Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/90 text-xs font-semibold">
            <button
              onClick={() => handleRoleClick('client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'client'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Cliente</span>
            </button>

            <button
              onClick={() => handleRoleClick('courier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'courier'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Motoboy</span>
              {activeOrder && activeOrder.status === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => handleRoleClick('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Quick Controls & Tools */}
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
              title={soundEnabled ? 'Áudio ativado' : 'Áudio silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all"
              title="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Order History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
              title="Histórico de Pedidos"
            >
              <History className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">Histórico</span>
            </button>

            {/* User Profile Avatar with Click to Edit Profile & Photo */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-85 transition-opacity group cursor-pointer"
              title="Ver e Editar Perfil com Foto"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-500/30 group-hover:ring-orange-500"
                />
                <span className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-emerald-500 text-white rounded-full">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
