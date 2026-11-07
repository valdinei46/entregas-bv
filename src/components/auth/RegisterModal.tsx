import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, User } from '../../types';
import {
  User as UserIcon,
  Bike,
  Camera,
  Upload,
  CheckCircle2,
  X,
  ShieldCheck,
  Phone,
  Mail,
  FileText,
  Sparkles,
  CreditCard,
  Users,
  Check,
  Plus,
} from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../../utils/mockData';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRole?: UserRole;
  title?: string;
}

const DEFAULT_CLIENT_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
];

const DEFAULT_COURIER_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
];

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'client',
  title,
}) => {
  const { currentUser, allUsers, registerNewUser, switchUserAccount, activeRole } = useApp();

  const [activeTab, setActiveTab] = useState<'client' | 'courier' | 'switch'>(
    defaultRole === 'courier' ? 'courier' : 'client'
  );

  // Sync tab with defaultRole when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultRole === 'courier') {
        setActiveTab('courier');
      } else if (activeRole === 'courier') {
        setActiveTab('courier');
      } else {
        setActiveTab('client');
      }
    }
  }, [isOpen, defaultRole, activeRole]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnh, setCnh] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_CLIENT_AVATARS[0]);

  // Vehicle fields for Courier
  const [vehicleModel, setVehicleModel] = useState('Honda CG 160 Titan');
  const [vehiclePlate, setVehiclePlate] = useState('RR-');
  const [vehicleColor, setVehicleColor] = useState('Vermelha');
  const [vehicleYear, setVehicleYear] = useState('2023');

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switch default avatar when tab changes
  useEffect(() => {
    if (activeTab === 'courier') {
      setAvatar(DEFAULT_COURIER_AVATARS[0]);
    } else {
      setAvatar(DEFAULT_CLIENT_AVATARS[0]);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Handle local image file upload & convert to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A foto deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao carregar imagem. Tente novamente.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Format Brazilian phone (95) 98888-8888
  const formatPhone = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  // Format CPF 000.000.000-00
  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  };

  // Format vehicle plate
  const formatPlate = (val: string) => {
    return val.toUpperCase().slice(0, 8);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }

    if (!avatar) {
      setErrorMsg('Adicione uma foto de perfil para identificação.');
      return;
    }

    if (activeTab === 'courier') {
      if (!vehicleModel.trim() || !vehiclePlate.trim()) {
        setErrorMsg('Informe o modelo e a placa da sua moto.');
        return;
      }
    }

    // Register user
    const newUserRole: UserRole = activeTab === 'courier' ? 'courier' : 'client';

    registerNewUser({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}${Date.now().toString().slice(-4)}@motoflash.com`,
      phone: phone.trim(),
      cpf: cpf.trim() || undefined,
      cnh: activeTab === 'courier' ? cnh.trim() || undefined : undefined,
      role: newUserRole,
      avatar,
      isRegistered: true,
      vehicle: activeTab === 'courier' ? {
        model: vehicleModel.trim(),
        plate: vehiclePlate.trim(),
        color: vehicleColor.trim(),
        year: vehicleYear.trim() || undefined,
      } : undefined,
    });

    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const currentAvatars = activeTab === 'courier' ? DEFAULT_COURIER_AVATARS : DEFAULT_CLIENT_AVATARS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-xl">
              {activeTab === 'courier' ? (
                <Bike className="w-5 h-5 text-white" />
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </span>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {title || (activeTab === 'courier' ? 'Cadastro de Novo Motoboy Parceiro' : 'Cadastro de Novo Cliente')}
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                {activeTab === 'courier'
                  ? 'Cadastre sua moto e comece a faturar com entregas em Boa Vista'
                  : 'Cadastre-se com foto para solicitar entregas rápidas com segurança'}
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

        {/* Tab Switcher: Cliente / Motoboy / Contas Existentes */}
        <div className="px-6 pt-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('client')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'client'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Novo Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('courier')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'courier'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Novo Motoboy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('switch')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'switch'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Trocar de Conta ({allUsers.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 3: LIST / SWITCH ACCOUNTS */}
        {activeTab === 'switch' ? (
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contas Cadastradas no Dispositivo
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('client')}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Nova Conta</span>
              </button>
            </div>

            <div className="space-y-2">
              {allUsers.map(user => {
                const isSelected = user.id === currentUser.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      switchUserAccount(user.id);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-50/80 border-orange-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-orange-500/20"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{user.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              user.role === 'courier'
                                ? 'bg-amber-100 text-amber-800'
                                : user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.role === 'courier' ? 'Motoboy' : user.role === 'admin' ? 'Admin' : 'Cliente'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{user.phone} • {user.email}</p>
                        {user.vehicle && (
                          <p className="text-[11px] text-slate-400">
                            Moto: {user.vehicle.model} ({user.vehicle.plate})
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <span className="p-1.5 rounded-full bg-orange-600 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
                          Acessar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* FORM FOR NEW CLIENT OR NEW COURIER */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Photo Section with Camera / Upload */}
            <div className="flex flex-col items-center justify-center space-y-3 pb-3 border-b border-slate-100">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-orange-500/30 shadow-lg bg-slate-100">
                  <img
                    src={avatar}
                    alt="Foto de Perfil"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Upload badge button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
                  title="Tirar foto ou escolher da galeria"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 mx-auto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Processando foto...' : 'Enviar foto do celular ou câmera'}</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeTab === 'courier'
                    ? 'Foto oficial do motoboy para identificação na entrega'
                    : 'Foto de perfil para confirmação com o entregador'}
                </p>
              </div>

              {/* Quick avatar selector options */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Ou escolha:</span>
                <div className="flex items-center gap-1.5">
                  {currentAvatars.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                        avatar === av ? 'border-orange-600 ring-2 ring-orange-300 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* General Fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={activeTab === 'courier' ? 'Ex: Lucas Silva Nascimento' : 'Ex: Juliana Costa Silva'}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-orange-600" />
                    <span>WhatsApp / Celular *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="(95) 99155-2233"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>CPF *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>E-mail</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* COURIER-SPECIFIC VEHICLE FIELDS */}
              {activeTab === 'courier' && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                    <Bike className="w-4 h-4 text-amber-700" />
                    <span>Dados da Motocicleta</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Modelo da Moto *
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleModel}
                        onChange={e => setVehicleModel(e.target.value)}
                        placeholder="Ex: Honda CG 160 Fan"
                        className="w-full text-xs bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Placa do Veículo *
                      </label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={e => setVehiclePlate(formatPlate(e.target.value))}
                        placeholder="Ex: RR-8M42"
                        className="w-full text-xs bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-orange-500 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Cor da Moto
                      </label>
                      <input
                        type="text"
                        value={vehicleColor}
                        onChange={e => setVehicleColor(e.target.value)}
                        placeholder="Ex: Vermelha, Preta"
                        className="w-full text-xs bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Nº da CNH (Opcional)
                      </label>
                      <input
                        type="text"
                        value={cnh}
                        onChange={e => setCnh(e.target.value)}
                        placeholder="00000000000"
                        className="w-full text-xs bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Informação sobre taxa de R$ 15 */}
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <span className="font-bold text-orange-600">ℹ️</span>
                    <span>
                      Taxa de R$ 15,00 por corrida para o administrador via Pix chave <strong>{ADMIN_CREDENTIALS.pixKey}</strong>.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                {errorMsg}
              </p>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {activeTab === 'courier' ? 'Cadastrar e Ficar Online Como Motoboy' : 'Cadastrar e Acessar Como Cliente'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
