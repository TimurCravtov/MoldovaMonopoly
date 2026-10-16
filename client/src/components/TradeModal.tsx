import React, { useState } from 'react';
import { Handshake, X } from 'lucide-react';
import { GameState, Language } from '../types/game';
import { t } from '../i18n/translations';
import { TileIcon } from './icons/MoldovaIcons';

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
      <div className="bg-[#201713] border-2 border-[#C59B27] rounded-2xl max-w-xl w-full p-5 shadow-2xl text-[#FAF6EE] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#34261E] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-[#E5C158]" />
            <h3 className="font-editorial text-lg font-bold text-[#E5C158]">
              Contract de Schimb Imobiliar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#2C201B] hover:bg-[#3A2C24] text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-[#B8A99A] mb-1 font-semibold">
              Partener de negociere:
            </label>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setRequestProps([]);
              }}
              className="w-full bg-[#16100D] border border-[#4A382E] rounded-xl px-3 py-2 text-[#FAF6EE] font-semibold"
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
            <div className="bg-[#16100D] p-3 rounded-xl border border-[#34261E]">
              <div className="font-bold text-[#4ADE80] mb-2">
                Oferta ta ({myPlayer.name}):
              </div>
              <label className="block text-xs text-[#B8A99A] mb-1">
                Numerar MDL (Max {myPlayer.cash} MDL):
              </label>
              <input
                type="number"
                min={0}
                max={myPlayer.cash}
                value={offerCash}
                onChange={(e) => setOfferCash(Number(e.target.value))}
                className="w-full bg-[#201713] border border-[#4A382E] rounded-lg px-2.5 py-1.5 mb-3 text-white font-mono-num"
              />
              <div className="text-xs text-[#B8A99A] mb-1">
                Proprietăți oferite:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {myTradableTiles.length === 0 && (
                  <div className="text-[#6E5D4F] italic text-xs">
                    Nicio proprietate eligibilă
                  </div>
                )}
                {myTradableTiles.map((tile) => (
                  <label
                    key={tile.index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-[#2A1E19] p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={offerProps.includes(tile.index)}
                      onChange={() =>
                        toggleProp(tile.index, offerProps, setOfferProps)
                      }
                      className="accent-[#C59B27]"
                    />
                    <TileIcon iconKey={tile.icon} className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
                    <span className="truncate">
                      {t(tile.name, lang)} ({tile.price})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Request */}
            <div className="bg-[#16100D] p-3 rounded-xl border border-[#34261E]">
              <div className="font-bold text-[#E5C158] mb-2">
                Solicitare de la {targetPlayer?.name}:
              </div>
              <label className="block text-xs text-[#B8A99A] mb-1">
                Numerar MDL (Max {targetPlayer?.cash || 0} MDL):
              </label>
              <input
                type="number"
                min={0}
                max={targetPlayer?.cash || 0}
                value={requestCash}
                onChange={(e) => setRequestCash(Number(e.target.value))}
                className="w-full bg-[#201713] border border-[#4A382E] rounded-lg px-2.5 py-1.5 mb-3 text-white font-mono-num"
              />
              <div className="text-xs text-[#B8A99A] mb-1">
                Proprietăți solicitate:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {targetTradableTiles.length === 0 && (
                  <div className="text-[#6E5D4F] italic text-xs">
                    Nicio proprietate disponibilă
                  </div>
                )}
                {targetTradableTiles.map((tile) => (
                  <label
                    key={tile.index}
                    className="flex items-center gap-2 cursor-pointer hover:bg-[#2A1E19] p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={requestProps.includes(tile.index)}
                      onChange={() =>
                        toggleProp(tile.index, requestProps, setRequestProps)
                      }
                      className="accent-[#C59B27]"
                    />
                    <TileIcon iconKey={tile.icon} className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
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
              className="px-4 py-2 rounded-lg bg-[#2C201B] hover:bg-[#3A2C24] text-[#D6C7B2] font-semibold"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#C59B27] hover:bg-[#D4AB37] text-[#16110E] font-bold shadow-lg uppercase tracking-wider text-xs"
            >
              <Handshake className="w-4 h-4" />
              <span>Trimite Oferta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
