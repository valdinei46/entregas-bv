import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ADMIN_CREDENTIALS } from '../../utils/mockData';
import { generatePixPayload, formatCurrencyBRL } from '../../utils/geo';
import {
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  X,
  Send,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface CourierFeeModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourierFeeModal: React.FC<CourierFeeModalProps> = ({
  orderId,
  isOpen,
  onClose,
}) => {
  const { orders, payAdminFee } = useApp();
  const [receiptNote, setReceiptNote] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !orderId) return null;

  const currentOrder = orders.find(o => o.id === orderId);
  const feeAmount = currentOrder?.adminFee || ADMIN_CREDENTIALS.feeAmount;

  // Generate standard Brazilian Pix Payload
  const pixPayload = generatePixPayload(
    ADMIN_CREDENTIALS.pixKey,
    ADMIN_CREDENTIALS.name,
    'Boa Vista',
    feeAmount,
    currentOrder?.code.replace('#', '') || 'MOTOFLASH'
  );

  const handleCopyKey = () => {
    navigator.clipboard.writeText(ADMIN_CREDENTIALS.pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    payAdminFee(orderId, receiptNote || undefined);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg">
                <QrCode className="w-5 h-5 text-amber-200" />
              </span>
              <h3 className="text-lg font-extrabold tracking-tight">Taxa do Motoboy</h3>
            </div>
            <p className="text-xs text-amber-100 mt-0.5">
              Pagamento da taxa administrativa de R$ 15,00
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount Badge */}
          <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-200/80">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              Valor da Taxa do Administrador
            </span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {formatCurrencyBRL(feeAmount)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Corrida: <strong>{currentOrder?.code}</strong>
            </span>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-48 h-48 bg-white p-3 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center relative">
              {/* Modern SVG QR Code representation */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  pixPayload
                )}`}
                alt="QR Code Pix"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-2">
              Abra o app do seu banco e aponte a câmera
            </span>
          </div>

          {/* Admin Pix Key Row */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Chave Pix do Admin (Celular)
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-slate-800 text-sm">
                {ADMIN_CREDENTIALS.pixKey}
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-lg border border-orange-200 flex items-center gap-1 transition-all"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copiado!' : 'Copiar Chave'}</span>
              </button>
            </div>
          </div>

          {/* Pix Copia e Cola Code */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Código Pix Copia e Cola
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-slate-500 truncate max-w-[200px]">
                {pixPayload}
              </span>
              <button
                type="button"
                onClick={handleCopyPayload}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 flex items-center gap-1 transition-all shrink-0"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
          </div>

          {/* Receipt Note & Confirmation Form */}
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Comprovante / Observação (Opcional)
              </label>
              <input
                type="text"
                value={receiptNote}
                onChange={e => setReceiptNote(e.target.value)}
                placeholder="Ex: Pix feito via Nubank às 14:32"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitted}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {submitted ? (
                <>
                  <FileCheck className="w-5 h-5" />
                  <span>Enviado ao Admin!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Já paguei! Informar Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
