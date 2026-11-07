import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatCurrencyBRL } from '../../utils/geo';
import {
  History,
  X,
  Bike,
  Package,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  Search,
} from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (order: Order) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const { orders, activeRole, currentUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'delivered' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filter relevant orders depending on active role
  const roleOrders = orders.filter(o => {
    if (activeRole === 'client') return o.clientId === currentUser.id || !o.clientId;
    if (activeRole === 'courier') return o.courierId === currentUser.id || !o.courierId;
    return true; // Admin sees all
  });

  const filteredOrders = roleOrders.filter(o => {
    if (filter === 'delivered' && o.status !== 'delivered') return false;
    if (filter === 'active' && (o.status === 'delivered' || o.status === 'cancelled')) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        o.code.toLowerCase().includes(term) ||
        o.origin.address.toLowerCase().includes(term) ||
        o.destination.address.toLowerCase().includes(term) ||
        (o.courierName && o.courierName.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-orange-600 rounded-xl text-white">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Histórico de Corridas</h3>
              <p className="text-xs text-slate-400">
                Visualização detalhada de pedidos realizados e entregues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Todas ({roleOrders.length})
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                filter === 'delivered' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Concluídas ({roleOrders.filter(o => o.status === 'delivered').length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                filter === 'active' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Em Andamento ({roleOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, rua..."
              className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">Nenhuma corrida encontrada</p>
              <p className="text-xs">Faça um novo pedido para começar a registrar histórico.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                className="pt-3.5 first:pt-0 bg-white hover:bg-slate-50/50 p-4 rounded-2xl border border-slate-200 transition-all space-y-3"
              >
                {/* Top Row: Code, Status, Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {order.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.status === 'delivered' ? 'Entregue' : order.status === 'pending' ? 'Pendente' : 'Em Rota'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-medium block">Origem:</span>
                      <strong className="text-slate-800">{order.origin.address}, {order.origin.number}</strong>
                      <p className="text-slate-500">{order.origin.neighborhood} ({order.origin.city})</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-slate-400 font-medium block">Destino:</span>
                      <strong className="text-slate-800">{order.destination.address}, {order.destination.number}</strong>
                      <p className="text-slate-500">{order.destination.neighborhood} ({order.destination.city})</p>
                    </div>
                  </div>
                </div>

                {/* Courier, Rating & Price footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    {order.courierName && (
                      <div className="flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-orange-600" />
                        <span className="font-semibold text-slate-700">{order.courierName}</span>
                      </div>
                    )}
                    {order.rating && (
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{order.rating.stars}</span>
                        {order.rating.comment && (
                          <span className="text-slate-500 font-normal italic truncate max-w-[150px]">
                            "{order.rating.comment}"
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      {order.paymentMethod === 'pix' ? 'Pix' : order.paymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrencyBRL(order.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
