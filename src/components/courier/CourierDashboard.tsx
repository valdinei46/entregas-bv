import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MapView } from '../MapView';
import { formatCurrencyBRL } from '../../utils/geo';
import { ADMIN_CREDENTIALS } from '../../utils/mockData';
import {
  Bike,
  Power,
  Navigation,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  CreditCard,
  QrCode,
  Compass,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  X,
  User,
  Plus,
} from 'lucide-react';

interface CourierDashboardProps {
  onOpenChat: () => void;
  onOpenFeeModal: (orderId: string) => void;
  onOpenRegister?: () => void;
}

export const CourierDashboard: React.FC<CourierDashboardProps> = ({
  onOpenChat,
  onOpenFeeModal,
  onOpenRegister,
}) => {
  const {
    currentUser,
    toggleCourierOnline,
    orders,
    activeOrder,
    acceptOrder,
    updateOrderStatus,
    confirmDeliveryWithPIN,
    useRealGps,
    setUseRealGps,
    realGpsActive,
  } = useApp();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const isOnline = currentUser.isOnline ?? true;

  // Find if there is a pending order waiting for acceptance
  const pendingOrder = orders.find(o => o.status === 'pending');

  // Filter completed deliveries by this courier
  const myCompletedOrders = orders.filter(
    o => o.courierId === currentUser.id && o.status === 'delivered'
  );

  const totalEarningsToday = myCompletedOrders.reduce((acc, curr) => acc + curr.price, 0);

  const handleFinishDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (activeOrder.deliveryConfirmationCode && pinInput.trim() !== activeOrder.deliveryConfirmationCode) {
      setPinError(true);
      return;
    }

    confirmDeliveryWithPIN(activeOrder.id, pinInput);
    setShowPinModal(false);
    setPinInput('');
    setPinError(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Courier Status & Online Toggle Bar */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-orange-500/20"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">{currentUser.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                Motoboy Verificado
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser.vehicle?.model} • Placa {currentUser.vehicle?.plate}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
              <span className="font-bold text-amber-600 flex items-center gap-1">
                ★ {currentUser.rating || 4.96}
              </span>
              <span>•</span>
              <span>{currentUser.totalDeliveries || 342} entregas</span>
            </div>
          </div>
        </div>

        {/* Online / Offline switch & New Driver registration */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenRegister && (
            <button
              onClick={onOpenRegister}
              className="px-3.5 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-orange-200 transition-all shadow-xs"
              title="Cadastrar Novo Motoboy ou Trocar de Conta"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Motoboy</span>
            </button>
          )}

          <button
            onClick={toggleCourierOnline}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'ONLINE • Recebendo Corridas' : 'OFFLINE • Ficar Online'}</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Ganhos Hoje
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900">
            {formatCurrencyBRL(totalEarningsToday)}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Entregas Hoje
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-orange-600">
            {myCompletedOrders.length}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Taxa Admin (R$ 15)
          </span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 block mt-1">
            Pix {ADMIN_CREDENTIALS.pixKey}
          </span>
        </div>
      </div>

      {/* INCOMING RIDE ALERT (Professional Call Card) */}
      {isOnline && pendingOrder && (
        <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-3xl shadow-xl shadow-orange-500/25 border border-orange-400/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <img
                src={pendingOrder.clientAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'}
                alt={pendingOrder.clientName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/40 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-700 text-xs font-black uppercase tracking-wider">
                    Nova Corrida Disponível!
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-100">{pendingOrder.code}</span>
                </div>
                <h3 className="text-xl font-black mt-1">
                  Ganho: {formatCurrencyBRL(pendingOrder.price)}
                </h3>
                <p className="text-xs text-orange-100">
                  Cliente: <strong>{pendingOrder.clientName}</strong> ({pendingOrder.clientPhone})
                </p>
                <p className="text-[11px] text-orange-200 mt-0.5">
                  Distância: {pendingOrder.distanceKm} km • Previsão: ~{pendingOrder.durationMin} min
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => acceptOrder(pendingOrder.id)}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-orange-50 text-orange-700 font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Aceitar Corrida Agora</span>
              </button>
            </div>
          </div>

          {/* Route preview */}
          <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300"></span>
              <span className="truncate">Retirada: {pendingOrder.origin.address}, {pendingOrder.origin.number}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300"></span>
              <span className="truncate">Entrega: {pendingOrder.destination.address}, {pendingOrder.destination.number}</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE ORDER IN PROGRESS */}
      {activeOrder && activeOrder.status !== 'pending' && (
        <div className="space-y-4">
          {/* Header Action Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={activeOrder.clientAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'}
                alt={activeOrder.clientName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-orange-500/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{activeOrder.code}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                    {activeOrder.status === 'accepted' && 'A caminho da Coleta'}
                    {activeOrder.status === 'arrived_pickup' && 'No Local de Coleta'}
                    {activeOrder.status === 'in_transit' && 'Em Trânsito para Entrega'}
                    {activeOrder.status === 'arriving' && 'Chegando ao Destino'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Cliente: {activeOrder.clientName}
                </h3>
                <p className="text-xs text-slate-500">
                  Receber: <strong className="text-slate-900">{formatCurrencyBRL(activeOrder.price)}</strong> ({activeOrder.paymentMethod.toUpperCase()})
                </p>
              </div>
            </div>

            {/* Status transition button */}
            <div className="flex flex-wrap items-center gap-2">
              {activeOrder.status === 'accepted' && (
                <button
                  onClick={() => updateOrderStatus(activeOrder.id, 'arrived_pickup')}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Cheguei na Coleta</span>
                </button>
              )}

              {activeOrder.status === 'arrived_pickup' && (
                <button
                  onClick={() => updateOrderStatus(activeOrder.id, 'in_transit')}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Peguei o Pacote • Iniciar Rota</span>
                </button>
              )}

              {(activeOrder.status === 'in_transit' || activeOrder.status === 'arriving') && (
                <button
                  onClick={() => setShowPinModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Entrega (PIN)</span>
                </button>
              )}

              {/* Chat with client */}
              <button
                onClick={onOpenChat}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-orange-600" />
                <span>Chat</span>
              </button>

              <a
                href={`tel:${activeOrder.clientPhone}`}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Ligar</span>
              </a>
            </div>
          </div>

          {/* GPS Telemetry Bar (Professional indicator) */}
          <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold">
                Rastreamento GPS Ativo • Transmissão em Tempo Real
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseRealGps(!useRealGps)}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-all text-xs ${
                  useRealGps
                    ? 'bg-orange-600 text-white border-orange-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5 inline mr-1" />
                {useRealGps ? 'GPS do Dispositivo Conectado' : 'Sincronizar GPS Nativo'}
              </button>
            </div>
          </div>

          {/* Interactive Map */}
          <MapView order={activeOrder} height="380px" />

          {/* Admin Fee card for this order */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                  Taxa Administrativa
                </span>
                <span className="text-xs font-bold text-amber-900">
                  R$ 15,00 por corrida
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Pague a taxa ao Admin pela chave Pix <strong>{ADMIN_CREDENTIALS.pixKey}</strong>.
              </p>
              <div className="text-xs mt-1">
                Status:{' '}
                {activeOrder.courierAdminFeeStatus === 'verified_by_admin' ? (
                  <strong className="text-emerald-700">✓ Aprovado pelo Admin</strong>
                ) : activeOrder.courierAdminFeeStatus === 'paid' ? (
                  <strong className="text-blue-700">⏳ Enviado (Aguardando Admin)</strong>
                ) : (
                  <strong className="text-red-600">Pendente de Pagamento</strong>
                )}
              </div>
            </div>

            <button
              onClick={() => onOpenFeeModal(activeOrder.id)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Pagar Taxa R$ 15 (Pix)</span>
            </button>
          </div>
        </div>
      )}

      {/* If no active order and no pending order */}
      {!activeOrder && !pendingOrder && (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <Bike className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {isOnline ? 'Pronto para novas corridas!' : 'Você está offline'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {isOnline
                ? 'Aguardando chamados de clientes em Boa Vista com telemetria GPS ativa. O aplicativo emitirá alerta sonoro assim que uma corrida for solicitada.'
                : 'Clique no botão acima para ficar online e começar a receber chamados de entrega.'}
            </p>
          </div>
        </div>
      )}

      {/* PIN Confirmation Modal for finishing delivery professionally */}
      {showPinModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <KeyRound className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm text-slate-900">Finalizar Entrega</h3>
              </div>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Peça o código PIN de 4 dígitos ao cliente <strong>{activeOrder.clientName}</strong> para confirmar a entrega e recebimento do valor ({formatCurrencyBRL(activeOrder.price)}).
            </p>

            <form onSubmit={handleFinishDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Código PIN de Entrega (4 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder={activeOrder.deliveryConfirmationCode || '0000'}
                  className="w-full text-center text-2xl font-mono font-black tracking-widest bg-slate-50 border border-slate-300 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {pinError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 font-semibold">
                  Código inválido. Verifique com o cliente.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Quick confirm without code if needed
                    updateOrderStatus(activeOrder.id, 'delivered');
                    setShowPinModal(false);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Entregue sem PIN
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  Confirmar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
