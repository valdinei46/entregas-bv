import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Order, OrderRating } from '../../types';
import {
  Star,
  Sparkles,
  Heart,
  Check,
  X,
  Send,
  ThumbsUp,
} from 'lucide-react';
import { formatCurrencyBRL } from '../../utils/geo';

interface RatingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const COMPLIMENT_TAGS = [
  'Super Rápido',
  'Muito Educado',
  'Cuidado com o Pacote',
  'Ótima Comunicação',
  'Pontual',
  'Seguiu as Instruções',
];

export const RatingModal: React.FC<RatingModalProps> = ({ order, isOpen, onClose }) => {
  const { submitRating } = useApp();

  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Super Rápido', 'Muito Educado']);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !order) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ratingData: OrderRating = {
      stars,
      tags: selectedTags,
      comment: comment.trim(),
      tip,
      createdAt: new Date().toISOString(),
    };

    submitRating(order.id, ratingData);

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ea580c', '#f59e0b', '#10b981', '#3b82f6'],
      });
    } catch {
      // ignore
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </span>
            <h3 className="text-lg font-extrabold tracking-tight">Avaliar Entrega</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Courier Identity */}
          <div className="text-center space-y-2">
            <img
              src={order.courierAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
              alt={order.courierName || 'Motoboy'}
              className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-orange-100 shadow-md"
            />
            <h4 className="font-extrabold text-slate-900 text-base">
              Como foi a entrega com {order.courierName || 'o motoboy'}?
            </h4>
            <p className="text-xs text-slate-500">
              Sua avaliação ajuda a manter a comunidade de entregas segura e de alto padrão.
            </p>
          </div>

          {/* 5 Stars Picker */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map(val => {
              const active = (hoverStars || stars) >= val;
              return (
                <button
                  type="button"
                  key={val}
                  onMouseEnter={() => setHoverStars(val)}
                  onMouseLeave={() => setHoverStars(0)}
                  onClick={() => setStars(val)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      active
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Compliments Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              O que você mais gostou?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMPLIMENT_TAGS.map(tag => {
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Tip */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Deixar Gorjeta ao Motoboy (Opcional)</span>
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 2, 5, 10].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setTip(val)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    tip === val
                      ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {val === 0 ? 'Sem gorjeta' : `+ R$ ${val}`}
                </button>
              ))}
            </div>
          </div>

          {/* Text feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Comentário adicional (Opcional)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitted}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {submitted ? (
              <>
                <Check className="w-5 h-5" />
                <span>Avaliação Enviada!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Avaliação</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
