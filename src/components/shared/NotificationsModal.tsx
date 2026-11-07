import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, X, Check, Bike, MessageCircle, DollarSign, CheckCircle2 } from 'lucide-react';
import { requestNotificationPermission } from '../../utils/notifications';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications } = useApp();

  if (!isOpen) return null;

  const handleEnableBrowserPush = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      alert('Notificações push do navegador ativadas com sucesso!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-orange-600 rounded-lg text-white">
              <Bell className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">Notificações em Tempo Real</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser push permission helper */}
        <div className="p-3.5 bg-orange-50 border-b border-orange-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="text-orange-900">
            <span className="font-bold block">Push Notifications do Navegador</span>
            <span className="text-[11px] text-orange-700">Receba avisos mesmo com app em segundo plano</span>
          </div>
          <button
            onClick={handleEnableBrowserPush}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
          >
            Ativar Push
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-1">
              <Bell className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Nenhuma notificação recente</p>
              <p className="text-[11px]">As atualizações de corrida e mensagens aparecerão aqui.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  {n.type === 'chat' && <MessageCircle className="w-4 h-4 text-orange-600" />}
                  {n.type === 'order' && <Bike className="w-4 h-4 text-amber-600" />}
                  {n.type === 'payment' && <DollarSign className="w-4 h-4 text-emerald-600" />}
                  {n.type === 'admin' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{n.title}</h5>
                    <span className="text-[10px] text-slate-400 font-medium">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
