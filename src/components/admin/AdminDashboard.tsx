import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ADMIN_CREDENTIALS } from '../../utils/mockData';
import { formatCurrencyBRL } from '../../utils/geo';
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Bike,
  Package,
  CheckCircle2,
  Clock,
  QrCode,
  Copy,
  Check,
  Star,
  Users,
  User,
  Search,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { orders, allUsers, adminVerifyFee } = useApp();
  const [filterFee, setFilterFee] = useState<'all' | 'pending' | 'paid' | 'verified_by_admin'>('all');
  const [copiedKey, setCopiedKey] = useState(false);

  // Statistics
  const totalOrdersCount = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalVolume = deliveredOrders.reduce((acc, curr) => acc + curr.price, 0);

  const verifiedFeesCount = orders.filter(o => o.courierAdminFeeStatus === 'verified_by_admin').length;
  const totalAdminFeesRevenue = verifiedFeesCount * ADMIN_CREDENTIALS.feeAmount;

  const couriers = allUsers.filter(u => u.role === 'courier');
  const onlineCouriers = couriers.filter(u => u.isOnline);

  const filteredOrders = orders.filter(o => {
    if (filterFee === 'all') return true;
    return o.courierAdminFeeStatus === filterFee;
  });

  const handleCopyKey = () => {
    navigator.clipboard.writeText(ADMIN_CREDENTIALS.pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Admin details & Chave Pix */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-600 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">Painel do Administrador</h2>
          </div>
          <p className="text-xs text-slate-400">
            Logado como <strong>{ADMIN_CREDENTIALS.email}</strong> • Gestão de Corridas e Taxas
          </p>
        </div>

        {/* Admin Pix key badge */}
        <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sua Chave Pix para Taxas (R$ 15,00)
            </span>
            <span className="font-mono font-extrabold text-amber-400 text-sm">
              {ADMIN_CREDENTIALS.pixKey}
            </span>
          </div>
          <button
            onClick={handleCopyKey}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all"
            title="Copiar Chave Pix"
          >
            {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Taxas Recebidas
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            {formatCurrencyBRL(totalAdminFeesRevenue)}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {verifiedFeesCount} taxas de R$ 15 aprovadas
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Faturamento Total
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            {formatCurrencyBRL(totalVolume)}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            Volume bruto de corridas
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total de Pedidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            {totalOrdersCount}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            {deliveredOrders.length} entregas concluídas
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Motoboys Ativos
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            {onlineCouriers.length} <span className="text-xs font-normal text-slate-400">/ {couriers.length}</span>
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {onlineCouriers.length} online no momento
          </span>
        </div>
      </div>

      {/* R$ 15 FEE VERIFICATION & APPROVAL TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Gestão de Taxas do Motoboy (R$ 15,00)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirmação de pagamentos Pix realizados pelos entregadores para a chave {ADMIN_CREDENTIALS.pixKey}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterFee('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterFee === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({orders.length})
            </button>
            <button
              onClick={() => setFilterFee('paid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterFee === 'paid' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aguardando ({orders.filter(o => o.courierAdminFeeStatus === 'paid').length})
            </button>
            <button
              onClick={() => setFilterFee('verified_by_admin')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterFee === 'verified_by_admin' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aprovadas ({verifiedFeesCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Corrida</th>
                <th className="py-3 px-4">Motoboy</th>
                <th className="py-3 px-4">Valor Taxa</th>
                <th className="py-3 px-4">Status da Taxa</th>
                <th className="py-3 px-4">Comprovante</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {order.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block">{order.courierName || 'Aguardando aceite'}</span>
                    <span className="text-[11px] text-slate-500">{order.courierVehicle?.model}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatCurrencyBRL(order.adminFee)}
                  </td>
                  <td className="py-3.5 px-4">
                    {order.courierAdminFeeStatus === 'verified_by_admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aprovado
                      </span>
                    ) : order.courierAdminFeeStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        Comprovante Enviado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {order.courierAdminFeeReceipt || 'Nenhum comprovante anexado'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {order.courierAdminFeeStatus !== 'verified_by_admin' ? (
                      <button
                        onClick={() => adminVerifyFee(order.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                      >
                        Aprovar Pix
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">Concluído</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Couriers Fleet Overview */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          <span>Frota de Motoboys Cadastrados</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {couriers.map(courier => (
            <div
              key={courier.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={courier.avatar}
                  alt={courier.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-orange-500/20"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{courier.name}</h4>
                  <p className="text-xs text-slate-500">
                    {courier.vehicle?.model} • Placa {courier.vehicle?.plate}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mt-0.5">
                    <span>★ {courier.rating}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{courier.totalDeliveries} entregas</span>
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    courier.isOnline
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {courier.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registered Clients Overview */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>Clientes Cadastrados com Foto ({allUsers.filter(u => u.role === 'client').length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allUsers.filter(u => u.role === 'client').map(client => (
            <div
              key={client.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={client.avatar}
                  alt={client.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                  <p className="text-xs text-slate-500">
                    WhatsApp: {client.phone} {client.cpf ? `• CPF: ${client.cpf}` : ''}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    ✓ Identidade com Foto Verificada
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
