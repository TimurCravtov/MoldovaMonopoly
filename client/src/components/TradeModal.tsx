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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] text-[#141414] border-[3px] border-[#141414] shadow-[8px_8px_0_#141414] max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2.5 mb-4">
          <h3 className="text-base font-black uppercase tracking-wider">
            CONTRACT DE SCHIMB IMOBILIAR
          </h3>
          <button
            onClick={onClose}
            className="px-2 py-0.5 border border-[#141414] bg-white hover:bg-neutral-200 font-black text-xs"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-black uppercase text-xs mb-1">
              Partener de negociere:
            </label>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setRequestProps([]);
              }}
              className="w-full bg-white border-2 border-[#141414] px-3 py-2 font-bold"
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
            <div className="bg-white p-3 border-2 border-[#141414]">
              <div className="font-black uppercase text-xs text-[#1EA350] mb-2 border-b border-[#141414] pb-1">
                OFERI ({myPlayer.name}):
              </div>
              <label className="block text-[11px] font-bold mb-1">
                Numerar MDL (Max {myPlayer.cash}):
              </label>
              <input
                type="number"
                min={0}
                max={myPlayer.cash}
                value={offerCash}
                onChange={(e) => setOfferCash(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border-[1.5px] border-[#141414] px-2.5 py-1.5 mb-3 font-mono-num font-bold"
              />
              <div className="text-[11px] font-bold mb-1">
                Proprietăți oferite:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {myTradableTiles.length === 0 && (
                  <div className="text-neutral-500 italic text-xs">
                    Nicio proprietate eligibilă
                  </div>
                )}
                {myTradableTiles.map((tile) => (
                  <label
                    key={tile.index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100 p-1 text-xs font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={offerProps.includes(tile.index)}
                      onChange={() =>
                        toggleProp(tile.index, offerProps, setOfferProps)
                      }
                      className="accent-[#141414]"
                    />
                    <span className="truncate">
                      {t(tile.name, lang)} ({tile.price})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Request */}
            <div className="bg-white p-3 border-2 border-[#141414]">
              <div className="font-black uppercase text-xs text-[#E32626] mb-2 border-b border-[#141414] pb-1">
                CERI DE LA {targetPlayer?.name}:
              </div>
              <label className="block text-[11px] font-bold mb-1">
                Numerar MDL (Max {targetPlayer?.cash || 0}):
              </label>
              <input
                type="number"
                min={0}
                max={targetPlayer?.cash || 0}
                value={requestCash}
                onChange={(e) => setRequestCash(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border-[1.5px] border-[#141414] px-2.5 py-1.5 mb-3 font-mono-num font-bold"
              />
              <div className="text-[11px] font-bold mb-1">
                Proprietăți solicitate:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {targetTradableTiles.length === 0 && (
                  <div className="text-neutral-500 italic text-xs">
                    Nicio proprietate disponibilă
                  </div>
                )}
                {targetTradableTiles.map((tile) => (
                  <label
                    key={tile.index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100 p-1 text-xs font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={requestProps.includes(tile.index)}
                      onChange={() =>
                        toggleProp(tile.index, requestProps, setRequestProps)
                      }
                      className="accent-[#141414]"
                    />
                    <span className="truncate">
                      {t(tile.name, lang)} ({tile.price})
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
              className="px-4 py-2 bg-white hover:bg-neutral-100 border-2 border-[#141414] font-bold text-xs uppercase"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1EA350] hover:bg-[#168A41] text-white border-2 border-[#141414] shadow-[3px_3px_0_#141414] font-black text-xs uppercase tracking-wider"
            >
              Trimite Oferta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
