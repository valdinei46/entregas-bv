import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { POPULAR_LOCATIONS } from '../../utils/mockData';
import { LocationPoint, PaymentMethod } from '../../types';
import { calculateDistanceKm, formatCurrencyBRL } from '../../utils/geo';
import {
  MapPin,
  Package,
  FileText,
  Utensils,
  ShieldCheck,
  Pill,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Clock,
  Sparkles,
  X,
  Navigation,
  Compass,
  Edit3,
  List,
} from 'lucide-react';

interface ClientNewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export const ClientNewOrderModal: React.FC<ClientNewOrderModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
}) => {
  const { createNewOrder, currentUser } = useApp();

  // Mode for Origin and Destination: 'preset' or 'manual'
  const [originMode, setOriginMode] = useState<'preset' | 'manual'>('preset');
  const [destMode, setDestMode] = useState<'preset' | 'manual'>('preset');

  // Preset indexes
  const [originIndex, setOriginIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(1);

  // Manual Origin fields
  const [manualOriginAddress, setManualOriginAddress] = useState('');
  const [manualOriginNumber, setManualOriginNumber] = useState('');
  const [manualOriginComplement, setManualOriginComplement] = useState('');
  const [manualOriginNeighborhood, setManualOriginNeighborhood] = useState('Centro');
  const [manualOriginCity, setManualOriginCity] = useState('Boa Vista');

  // Manual Destination fields
  const [manualDestAddress, setManualDestAddress] = useState('');
  const [manualDestNumber, setManualDestNumber] = useState('');
  const [manualDestComplement, setManualDestComplement] = useState('');
  const [manualDestNeighborhood, setManualDestNeighborhood] = useState('São Pedro');
  const [manualDestCity, setManualDestCity] = useState('Boa Vista');

  // GPS fetching state
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Package & Payment
  const [packageType, setPackageType] = useState<
    'documento' | 'comida' | 'encomenda' | 'fragil' | 'medicamento'
  >('encomenda');
  const [packageNotes, setPackageNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cashChangeFor, setCashChangeFor] = useState<number | undefined>(undefined);
  const [needChange, setNeedChange] = useState(false);

  if (!isOpen) return null;

  // Resolve Origin LocationPoint
  const resolvedOrigin: LocationPoint =
    originMode === 'preset'
      ? POPULAR_LOCATIONS[originIndex]
      : {
          address: manualOriginAddress.trim() || 'Av. Jaime Brasil',
          number: manualOriginNumber.trim() || 'S/N',
          complement: manualOriginComplement.trim() || undefined,
          neighborhood: manualOriginNeighborhood.trim() || 'Centro',
          city: manualOriginCity.trim() || 'Boa Vista',
          lat: 2.8210 + (Math.sin(manualOriginAddress.length + 1) * 0.015),
          lng: -60.6720 + (Math.cos(manualOriginAddress.length + 1) * 0.015),
        };

  // Resolve Destination LocationPoint
  const resolvedDest: LocationPoint =
    destMode === 'preset'
      ? POPULAR_LOCATIONS[destIndex]
      : {
          address: manualDestAddress.trim() || 'Av. Major Williams',
          number: manualDestNumber.trim() || 'S/N',
          complement: manualDestComplement.trim() || undefined,
          neighborhood: manualDestNeighborhood.trim() || 'São Francisco',
          city: manualDestCity.trim() || 'Boa Vista',
          lat: 2.8390 + (Math.cos(manualDestAddress.length + 2) * 0.018),
          lng: -60.6680 + (Math.sin(manualDestAddress.length + 2) * 0.018),
        };

  const distanceKm = Math.max(
    1.2,
    calculateDistanceKm(
      resolvedOrigin.lat,
      resolvedOrigin.lng,
      resolvedDest.lat,
      resolvedDest.lng
    )
  );

  const price = Math.max(10, Math.round((8 + distanceKm * 2.5) * 100) / 100);
  const estimatedMin = Math.max(5, Math.round(distanceKm * 3 + 4));

  // Current GPS helper for origin
  const handleUseCurrentLocationForOrigin = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocalização não suportada no seu navegador.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        setOriginMode('manual');
        setManualOriginAddress('Minha Localização GPS Atual');
        setManualOriginNumber('Ponto Atual');
        setManualOriginNeighborhood('Centro');
      },
      (err) => {
        setIsGettingGps(false);
        alert('Não foi possível obter sua posição GPS. Digite o endereço manualmente.');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (originMode === 'manual' && !manualOriginAddress.trim()) {
      alert('Por favor, informe a rua/endereço de busca (retirada).');
      return;
    }

    if (destMode === 'manual' && !manualDestAddress.trim()) {
      alert('Por favor, informe a rua/endereço de entrega.');
      return;
    }

    createNewOrder({
      origin: resolvedOrigin,
      destination: resolvedDest,
      packageType,
      packageNotes: packageNotes.trim() || undefined,
      paymentMethod,
      cashChangeFor: needChange ? cashChangeFor : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Pedir Nova Entrega</h2>
            </div>
            <p className="text-xs text-orange-100 mt-0.5">
              Escolha na lista ou digite o endereço exato de busca e entrega
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: PONTO DE BUSCA (COLETA / ORIGEM) */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300"></span>
                <span>Ponto de Busca / Retirada</span>
              </label>

              {/* Mode switch */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-amber-300 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setOriginMode('preset')}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                    originMode === 'preset'
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'text-amber-900 hover:text-amber-700'
                  }`}
                >
                  <List className="w-3 h-3" />
                  <span>Locais Rápidos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOriginMode('manual')}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                    originMode === 'manual'
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'text-amber-900 hover:text-amber-700'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Digitar Manual</span>
                </button>
              </div>
            </div>

            {originMode === 'preset' ? (
              <div>
                <select
                  value={originIndex}
                  onChange={e => setOriginIndex(Number(e.target.value))}
                  className="w-full text-sm font-medium bg-white border border-amber-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                >
                  {POPULAR_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={idx}>
                      {loc.address}, {loc.number} - {loc.neighborhood} ({loc.city})
                    </option>
                  ))}
                </select>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocationForOrigin}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5 text-orange-600" />
                    <span>{isGettingGps ? 'Obtendo GPS...' : 'Usar minha localização atual (GPS)'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Origin Form */
              <div className="space-y-2.5 bg-white p-3 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">Endereço de Retirada do Pacote</span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocationForOrigin}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>GPS Atual</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      value={manualOriginAddress}
                      onChange={e => setManualOriginAddress(e.target.value)}
                      placeholder="Rua / Av. / Logradouro *"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualOriginNumber}
                      onChange={e => setManualOriginNumber(e.target.value)}
                      placeholder="Nº ou S/N"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={manualOriginComplement}
                      onChange={e => setManualOriginComplement(e.target.value)}
                      placeholder="Apto / Sala / Ref."
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualOriginNeighborhood}
                      onChange={e => setManualOriginNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualOriginCity}
                      onChange={e => setManualOriginCity(e.target.value)}
                      placeholder="Cidade"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: PONTO DE ENTREGA (DESTINO) */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300"></span>
                <span>Ponto de Entrega (Destino)</span>
              </label>

              {/* Mode switch */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-emerald-300 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDestMode('preset')}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                    destMode === 'preset'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-emerald-900 hover:text-emerald-700'
                  }`}
                >
                  <List className="w-3 h-3" />
                  <span>Locais Rápidos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDestMode('manual')}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                    destMode === 'manual'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-emerald-900 hover:text-emerald-700'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Digitar Manual</span>
                </button>
              </div>
            </div>

            {destMode === 'preset' ? (
              <div>
                <select
                  value={destIndex}
                  onChange={e => setDestIndex(Number(e.target.value))}
                  className="w-full text-sm font-medium bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                >
                  {POPULAR_LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={idx}>
                      {loc.address}, {loc.number} - {loc.neighborhood} ({loc.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Manual Destination Form */
              <div className="space-y-2.5 bg-white p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900">Endereço de Entrega Final</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      value={manualDestAddress}
                      onChange={e => setManualDestAddress(e.target.value)}
                      placeholder="Rua / Av. de Entrega *"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualDestNumber}
                      onChange={e => setManualDestNumber(e.target.value)}
                      placeholder="Nº ou S/N"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={manualDestComplement}
                      onChange={e => setManualDestComplement(e.target.value)}
                      placeholder="Apto / Casa / Ref."
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualDestNeighborhood}
                      onChange={e => setManualDestNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualDestCity}
                      onChange={e => setManualDestCity(e.target.value)}
                      placeholder="Cidade"
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Route summary badge */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-emerald-200/60 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                Distância calculada: <strong className="text-slate-900">{distanceKm} km</strong>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Tempo estimado: <strong className="text-slate-900">~{estimatedMin} min</strong>
              </span>
            </div>
          </div>

          {/* Package Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Encomenda
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'encomenda', label: 'Pacote / Caixa', icon: Package },
                { id: 'documento', label: 'Documento', icon: FileText },
                { id: 'comida', label: 'Alimento', icon: Utensils },
                { id: 'medicamento', label: 'Farmácia', icon: Pill },
                { id: 'fragil', label: 'Item Frágil', icon: ShieldCheck },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = packageType === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setPackageType(item.id as any)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Instruções para o Motoboy (Opcional)
            </label>
            <input
              type="text"
              value={packageNotes}
              onChange={e => setPackageNotes(e.target.value)}
              placeholder="Ex: Tocar o interfone 204, falar com Carla na portaria"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Forma de Pagamento (Direto ao Motoboy)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Pix no Destino</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">Cartão (Maquininha)</span>
              </button>
            </div>

            {/* Need change toggle if Cash */}
            {paymentMethod === 'cash' && (
              <div className="mt-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 font-medium text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needChange}
                    onChange={e => setNeedChange(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Precisa de troco?</span>
                </label>
                {needChange && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600">Para:</span>
                    <input
                      type="number"
                      value={cashChangeFor || ''}
                      onChange={e => setCashChangeFor(Number(e.target.value))}
                      placeholder="R$ 50"
                      className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold text-center"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Identificação do Cliente com Foto */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-orange-500/20"
              />
              <div>
                <span className="font-extrabold text-slate-900 block">{currentUser.name}</span>
                <span className="text-[11px] text-slate-500">Solicitante identificado com foto • {currentUser.phone}</span>
              </div>
            </div>
            {onOpenRegister && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-800"
              >
                Trocar foto
              </button>
            )}
          </div>

          {/* Pricing & Submit Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Valor Total da Corrida
              </span>
              <span className="text-2xl font-black text-slate-900">
                {formatCurrencyBRL(price)}
              </span>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Confirmar Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
