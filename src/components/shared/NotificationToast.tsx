import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, MessageCircle, Bike, CheckCircle2, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useApp();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'chat':
        return <MessageCircle className="w-5 h-5 text-orange-600" />;
      case 'order':
        return <Bike className="w-5 h-5 text-amber-600" />;
      case 'payment':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-orange-50 shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {activeToast.title}
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              {activeToast.timestamp}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
            {activeToast.message}
          </p>
        </div>

        <button
          onClick={dismissToast}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
