import React from 'react';
import { UserCheck, CheckCircle, AlertCircle } from 'lucide-react';

export default function CardSlotsVisitantes({ portaria = 'P1', ocupados = [], onSelectCard }) {
  // P1: Visitantes de 01 a 20 | P2: Visitantes de 21 a 40
  const cards = portaria === 'P1'
    ? Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0'))
    : Array.from({ length: 20 }, (_, i) => String(i + 21).padStart(2, '0'));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Escaninho de Visitantes • {portaria === 'P1' ? 'Portaria 1 (01 a 20)' : 'Portaria 2 (21 a 40)'}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Disponível
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> No Site (Em Uso)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {cards.map((num) => {
          const cardId = `VIS-${num}/${portaria}`;
          const ocupacao = ocupados.find(o => o.cartao === cardId || o.cartao === `${num}/${portaria}`);
          const isOcupado = !!ocupacao;

          return (
            <button
              key={cardId}
              type="button"
              disabled={isOcupado}
              onClick={() => onSelectCard && onSelectCard(num)}
              title={isOcupado ? `Com: ${ocupacao.visitante} (Anfitrião: ${ocupacao.anfitriao})` : `Cartão ${cardId} Disponível`}
              className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${isOcupado
                  ? 'bg-red-950/40 border-red-800/60 text-red-300 opacity-85 cursor-not-allowed'
                  : 'bg-slate-950 border-slate-700/80 hover:border-emerald-500 text-slate-200 hover:bg-slate-850 cursor-pointer'
                }`}
            >
              <span className="font-mono text-xs font-bold">{num}</span>
              <span className="text-[8px] uppercase font-semibold text-slate-400">
                {portaria}
              </span>
              {isOcupado ? (
                <AlertCircle className="w-3 h-3 text-red-400" />
              ) : (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
