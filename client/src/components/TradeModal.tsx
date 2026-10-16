import React, { useState } from 'react';
import { GameState, Language } from '../types/game';
import { t } from '../i18n/translations';

interface TradeModalProps {
  state: GameState;
  myPlayerId: string;
  lang: Language;
  onClose: () => void;
  onSendAction: (action: string, payload?: Record<string, unknown>) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  state,
  myPlayerId,
  lang,
  onClose,
  onSendAction,
}) => {
  const otherPlayers = state.players.filter(
    (p) => p.id !== myPlayerId && !p.bankrupt
  );
  const myPlayer = state.players.find((p) => p.id === myPlayerId);

  const [targetId, setTargetId] = useState<string>(otherPlayers[0]?.id || '');
  const [offerCash, setOfferCash] = useState<number>(0);
  const [requestCash, setRequestCash] = useState<number>(0);
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [requestProps, setRequestProps] = useState<number[]>([]);

  if (!myPlayer || otherPlayers.length === 0) {
    return null;
  }

  const targetPlayer = state.players.find((p) => p.id === targetId);
  const myTradableTiles = state.tiles.filter(
    (tile) => tile.ownerId === myPlayerId && tile.houses === 0
  );
  const targetTradableTiles = state.tiles.filter(
    (tile) => tile.ownerId === targetId && tile.houses === 0
  );

  const toggleProp = (
    idx: number,
    list: number[],
    setList: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    if (list.includes(idx)) {
      setList(list.filter((i) => i !== idx));
    } else {
      setList([...list, idx]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    onSendAction('PROPOSE_TRADE', {
      trade: {
        toPlayerId: targetId,
        offerCash: Number(offerCash) || 0,
        requestCash: Number(requestCash) || 0,
        offerProperties: offerProps,
        requestProperties: requestProps,
        offerJailCards: 0,
        requestJailCards: 0,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl max-w-xl w-full p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-lg font-black text-amber-400">
            🤝 Negociere la Piața Centrală (Schimb)
          </h3>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Alege partenerul de afacere:
            </label>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setRequestProps([]);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
            >
              {otherPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.cash} MDL)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* My Offer */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700">
              <div className="font-bold text-emerald-400 mb-2">
                Oferi ({myPlayer.name}):
              </div>
              <label className="block text-xs text-slate-400 mb-1">
                MDL Numerar (Max {myPlayer.cash} MDL):
              </label>
              <input
                type="number"
                min={0}
                max={myPlayer.cash}
                value={offerCash}
                onChange={(e) => setOfferCash(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 mb-3 text-white"
              />
              <div className="text-xs text-slate-400 mb-1">
                Proprietăți oferite:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {myTradableTiles.length === 0 && (
                  <div className="text-slate-500 italic text-xs">
                    Nicio proprietate fără construcții
                  </div>
                )}
                {myTradableTiles.map((tile) => (
                  <label
                    key={tile.index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={offerProps.includes(tile.index)}
                      onChange={() =>
                        toggleProp(tile.index, offerProps, setOfferProps)
                      }
                    />
                    <span>
                      {tile.icon} {t(tile.name, lang)} ({tile.price} MDL)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Request */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700">
              <div className="font-bold text-amber-400 mb-2">
                Ceri de la {targetPlayer?.name}:
              </div>
              <label className="block text-xs text-slate-400 mb-1">
                MDL Numerar (Max {targetPlayer?.cash || 0} MDL):
              </label>
              <input
                type="number"
                min={0}
                max={targetPlayer?.cash || 0}
                value={requestCash}
                onChange={(e) => setRequestCash(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 mb-3 text-white"
              />
              <div className="text-xs text-slate-400 mb-1">
                Proprietăți cerute:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {targetTradableTiles.length === 0 && (
                  <div className="text-slate-500 italic text-xs">
                    Nicio proprietate disponibilă
                  </div>
                )}
                {targetTradableTiles.map((tile) => (
                  <label
                    key={tile.index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={requestProps.includes(tile.index)}
                      onChange={() =>
                        toggleProp(tile.index, requestProps, setRequestProps)
                      }
                    />
                    <span>
                      {tile.icon} {t(tile.name, lang)} ({tile.price} MDL)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg"
            >
              Trimite Oferta 🤝
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
