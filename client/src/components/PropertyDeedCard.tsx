import React from 'react';
import {
  GameState,
  GROUP_COLORS,
  Language,
  Tile,
} from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';

interface PropertyDeedCardProps {
  tile: Tile;
  state: GameState;
  myPlayerId: string;
  lang: Language;
  onSendAction: (action: string, payload?: Record<string, unknown>) => void;
  onClose?: () => void;
}

export const PropertyDeedCard: React.FC<PropertyDeedCardProps> = ({
  tile,
  state,
  myPlayerId,
  lang,
  onSendAction,
  onClose,
}) => {
  const groupStyle = GROUP_COLORS[tile.group] || GROUP_COLORS.NONE;
  const owner = tile.ownerId
    ? state.players.find((p) => p.id === tile.ownerId)
    : undefined;
  const isOwner = tile.ownerId === myPlayerId;

  return (
    <div className="bg-white text-[#141414] p-2.5 border-2 border-[#141414] shadow-[4px_4px_0_#141414]">
      {/* Authentic Inner Black Frame of a Monopoly Title Deed */}
      <div className="border-[1.5px] border-[#141414] p-2.5 space-y-2.5">
        {/* Deed Header Box */}
        <div
          className={`${groupStyle.bg} ${groupStyle.text} border-[1.5px] border-[#141414] px-3 py-2 text-center relative`}
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-1 right-1.5 text-[10px] font-black leading-none hover:opacity-70"
            >
              ×
            </button>
          )}
          <div className="text-[8.5px] font-bold uppercase tracking-[0.18em]">
            TITLU DE PROPRIETATE
          </div>
          <h3 className="text-sm font-black uppercase tracking-tight leading-tight mt-0.5">
            {t(tile.name, lang)}
          </h3>
        </div>

        {/* Subtitle & Flavor */}
        <div className="text-center px-1">
          <div className="text-[10px] font-bold uppercase text-neutral-600">
            {t(tile.subtitle, lang)}
          </div>
          <p className="text-[10.5px] text-neutral-700 leading-snug mt-1">
            {t(tile.flavor, lang)}
          </p>
        </div>

        {/* Street Property Classic Rent Schedule */}
        {tile.type === 'PROPERTY' && tile.rents.length >= 6 && (
          <div className="space-y-1 border-t border-b border-[#141414] py-2 text-[11px]">
            <div className="flex justify-between">
              <span>{t(UI_TEXT.baseRent, lang)}</span>
              <span className="font-mono-num font-bold">{tile.rents[0]} MDL</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>{t(UI_TEXT.monopolyRent, lang)}</span>
              <span className="font-mono-num">{tile.rents[0] * 2} MDL</span>
            </div>
            {[1, 2, 3, 4].map((hCount) => (
              <div
                key={hCount}
                className={`flex justify-between ${
                  tile.houses === hCount ? 'bg-[#FDE021] font-black px-1' : ''
                }`}
              >
                <span>
                  {t(
                    hCount === 1
                      ? UI_TEXT.with1House
                      : hCount === 2
                      ? UI_TEXT.with2Houses
                      : hCount === 3
                      ? UI_TEXT.with3Houses
                      : UI_TEXT.with4Houses,
                    lang
                  )}
                </span>
                <span className="font-mono-num">{tile.rents[hCount]} MDL</span>
              </div>
            ))}
            <div
              className={`flex justify-between ${
                tile.houses === 5
                  ? 'bg-[#E32626] text-white font-black px-1'
                  : 'font-bold'
              }`}
            >
              <span>{t(UI_TEXT.withHotel, lang)}</span>
              <span className="font-mono-num">{tile.rents[5]} MDL</span>
            </div>

            <div className="border-t border-neutral-300 pt-1.5 mt-1.5 flex justify-between text-[10.5px]">
              <span>{t(UI_TEXT.buildCost, lang)}</span>
              <span className="font-mono-num font-bold">
                {tile.houseCost} MDL
              </span>
            </div>
            <div className="flex justify-between text-[10.5px]">
              <span>{t(UI_TEXT.mortgageVal, lang)}</span>
              <span className="font-mono-num font-bold">
                {Math.floor(tile.price / 2)} MDL
              </span>
            </div>
          </div>
        )}

        {/* Transport Rent Schedule */}
        {tile.type === 'TRANSPORT' && (
          <div className="space-y-1 border-t border-b border-[#141414] py-2 text-[11px]">
            <div className="flex justify-between">
              <span>Chirie (1 linie):</span>
              <span className="font-mono-num font-bold">25 MDL</span>
            </div>
            <div className="flex justify-between">
              <span>Dacă deții 2 linii:</span>
              <span className="font-mono-num font-bold">50 MDL</span>
            </div>
            <div className="flex justify-between">
              <span>Dacă deții 3 linii:</span>
              <span className="font-mono-num font-bold">100 MDL</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Dacă deții toate 4 liniile:</span>
              <span className="font-mono-num">200 MDL</span>
            </div>
          </div>
        )}

        {/* Utility Rent Schedule */}
        {tile.type === 'UTILITY' && (
          <div className="space-y-1 border-t border-b border-[#141414] py-2 text-[11px]">
            <div className="flex justify-between">
              <span>1 Rețea de Utilități:</span>
              <span className="font-mono-num font-bold">4 × zaruri</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Ambele Rețele:</span>
              <span className="font-mono-num">10 × zaruri</span>
            </div>
          </div>
        )}

        {/* Owner Footer */}
        {tile.price > 0 && (
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <div>
              <span className="text-neutral-600 uppercase font-bold text-[10px]">
                {t(UI_TEXT.owner, lang)}{' '}
              </span>
              {owner ? (
                <span
                  className="font-bold px-1.5 py-0.5 text-white border border-[#141414] text-[10px] uppercase"
                  style={{ backgroundColor: owner.color }}
                >
                  {owner.name}
                </span>
              ) : (
                <span className="font-mono-num font-bold text-[#1EA350]">
                  LIBER ({tile.price} MDL)
                </span>
              )}
            </div>
            {tile.mortgaged && (
              <span className="px-1.5 py-0.5 bg-[#E32626] text-white font-black text-[9px] uppercase">
                {t(UI_TEXT.mortgagedBadge, lang)}
              </span>
            )}
          </div>
        )}

        {/* Owner Management Actions */}
        {isOwner && (
          <div className="pt-1.5 grid grid-cols-2 gap-1.5">
            {tile.type === 'PROPERTY' && !tile.mortgaged && tile.houses < 5 && (
              <button
                onClick={() =>
                  onSendAction('BUILD_HOUSE', { tileIndex: tile.index })
                }
                className="px-2 py-1.5 bg-[#1EA350] hover:bg-[#168A41] text-white font-black text-[10.5px] border border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
              >
                {t(UI_TEXT.buildHouse, lang)} ({tile.houseCost})
              </button>
            )}
            {tile.type === 'PROPERTY' && tile.houses > 0 && (
              <button
                onClick={() =>
                  onSendAction('SELL_HOUSE', { tileIndex: tile.index })
                }
                className="px-2 py-1.5 bg-[#F58220] hover:bg-[#DC6E12] text-[#141414] font-black text-[10.5px] border border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
              >
                {t(UI_TEXT.sellHouse, lang)} (+{Math.floor(tile.houseCost / 2)})
              </button>
            )}
            {!tile.mortgaged && tile.houses === 0 && (
              <button
                onClick={() =>
                  onSendAction('MORTGAGE_PROPERTY', { tileIndex: tile.index })
                }
                className="px-2 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-[#141414] font-bold text-[10.5px] border border-[#141414] uppercase"
              >
                {t(UI_TEXT.mortgage, lang)} (+{Math.floor(tile.price / 2)})
              </button>
            )}
            {tile.mortgaged && (
              <button
                onClick={() =>
                  onSendAction('UNMORTGAGE_PROPERTY', { tileIndex: tile.index })
                }
                className="col-span-2 px-2 py-1.5 bg-[#1B469B] hover:bg-[#15367A] text-white font-bold text-[10.5px] border border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
              >
                {t(UI_TEXT.unmortgage, lang)} (-
                {Math.floor((tile.price * 55) / 100)} MDL)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
