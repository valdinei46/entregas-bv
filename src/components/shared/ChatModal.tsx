import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  MessageCircle,
  Send,
  X,
  Bike,
  User,
  Sparkles,
  Phone,
} from 'lucide-react';

interface ChatModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ order, isOpen, onClose }) => {
  const { chatMessages, sendChatMessage, currentUser, activeRole } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const relevantMessages = order ? chatMessages.filter(m => m.orderId === order.id) : [];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && order) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [relevantMessages.length, isOpen, order]);

  if (!isOpen || !order) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(order.id, inputText.trim());
    setInputText('');
  };

  const handleSendQuick = (text: string) => {
    sendChatMessage(order.id, text, true);
  };

  const isClient = activeRole === 'client';
  const otherPartyName = isClient ? (order.courierName || 'Motoboy') : order.clientName;
  const otherPartyAvatar = isClient
    ? (order.courierAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80')
    : order.clientAvatar;

  // Quick message options based on role
  const quickMessages = isClient
    ? [
        'Já estou na portaria!',
        'Pode tocar o interfone 204?',
        'Obrigado, estou descendo!',
        'Deixar com a recepção.',
      ]
    : [
        'Cheguei no local de coleta!',
        'Trânsito moderado, chego em 5 min!',
        'Já estou em frente ao seu portão.',
        'Obrigado pela preferência!',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={otherPartyAvatar}
                alt={otherPartyName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/30"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{otherPartyName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-600/80 font-normal">
                  {isClient ? 'Entregador' : 'Cliente'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Corrida {order.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={`tel:${isClient ? order.courierPhone : order.clientPhone}`}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Ligar"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70">
          {relevantMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium">Nenhuma mensagem ainda.</p>
              <p className="text-[11px] text-slate-400">
                Envie uma mensagem direta para alinhar detalhes da entrega em tempo real.
              </p>
            </div>
          ) : (
            relevantMessages.map(msg => {
              const isMe = msg.senderRole === activeRole;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs font-medium shadow-xs ${
                      isMe
                        ? 'bg-orange-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies Bar */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickMessages.map((text, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuick(text)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 border border-slate-200/80 text-[11px] font-medium whitespace-nowrap transition-all"
            >
              {text}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
