import React from 'react';
import { Hammer, ArrowDownToLine, Landmark, LockOpen, X } from 'lucide-react';
import {
  GameState,
  GROUP_COLORS,
  Language,
  Tile,
} from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';
import { TileIcon, HouseSvg, HotelSvg } from './icons/MoldovaIcons';

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
    <div className="bg-[#FAF6EE] text-[#1E1915] border-2 border-[#3A241B] rounded-xl overflow-hidden shadow-xl ring-1 ring-[#C59B27]/50">
      {/* Deed Cadastral Header */}
      <div className={`${groupStyle.bg} ${groupStyle.text} px-3.5 py-2.5 border-b-2 border-[#1E1915]/30`}>
        <div className="flex items-center justify-between text-[9px] font-mono-num uppercase tracking-widest opacity-85">
          <span>{t(UI_TEXT.deedTitle, lang)}</span>
          <span>NR. {tile.index}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <h3 className="font-editorial text-sm sm:text-base font-bold leading-tight flex items-center gap-2">
            <TileIcon iconKey={tile.icon} className="w-4 h-4 shrink-0" />
            <span>{t(tile.name, lang)}</span>
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded bg-black/20 hover:bg-black/35 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-[11px] opacity-90 font-medium mt-0.5">
          {t(tile.subtitle, lang)}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5 text-xs">
        {/* Cultural Note */}
        <p className="italic text-[#4A3B31] bg-[#EFE9DA] p-2 rounded-lg border border-[#D5C9B4] leading-snug text-[11px]">
          “{t(tile.flavor, lang)}”
        </p>

        {/* Owner & Price */}
        {tile.price > 0 && (
          <div className="flex items-center justify-between bg-[#EFE9DA] px-2.5 py-1.5 rounded-lg border border-[#D5C9B4]">
            <div>
              <span className="text-[#6E5D4F] text-[11px]">
                {t(UI_TEXT.owner, lang)}{' '}
              </span>
              {owner ? (
                <span
                  className="font-bold px-2 py-0.5 rounded text-white text-[11px]"
                  style={{ backgroundColor: owner.color }}
                >
                  {owner.name}
                </span>
              ) : (
                <span className="font-bold text-[#1E6B45] text-[11px]">
                  {t(UI_TEXT.unowned, lang)} ({tile.price} MDL)
                </span>
              )}
            </div>
            {tile.mortgaged && (
              <span className="px-2 py-0.5 rounded bg-[#9F1239] text-white font-bold text-[9px] tracking-wider">
                {t(UI_TEXT.mortgagedBadge, lang)}
              </span>
            )}
          </div>
        )}

        {/* Street Property Rent Schedule */}
        {tile.type === 'PROPERTY' && tile.rents.length >= 6 && (
          <div className="space-y-1 border-t border-[#D5C9B4] pt-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#5C4D40]">{t(UI_TEXT.baseRent, lang)}</span>
              <span className="font-mono-num font-bold">{tile.rents[0]} MDL</span>
            </div>
            <div className="flex justify-between text-[#8E5B18] font-semibold">
              <span>{t(UI_TEXT.monopolyRent, lang)}</span>
              <span className="font-mono-num font-bold">
                {tile.rents[0] * 2} MDL
              </span>
            </div>
            {[1, 2, 3, 4].map((hCount) => (
              <div
                key={hCount}
                className={`flex items-center justify-between ${
                  tile.houses === hCount
                    ? 'text-[#1E6B45] font-bold bg-[#1E6B45]/10 px-1 rounded'
                    : ''
                }`}
              >
                <span className="flex items-center gap-1">
                  <HouseSvg className="w-3 h-3 text-[#1E6B45]" />
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
                </span>
                <span className="font-mono-num">{tile.rents[hCount]} MDL</span>
              </div>
            ))}
            <div
              className={`flex items-center justify-between ${
                tile.houses === 5
                  ? 'text-[#9F1239] font-bold bg-[#9F1239]/10 px-1 rounded'
                  : ''
              }`}
            >
              <span className="flex items-center gap-1">
                <HotelSvg className="w-3.5 h-3.5 text-[#9F1239]" />
                <span>{t(UI_TEXT.withHotel, lang)}</span>
              </span>
              <span className="font-mono-num font-bold">{tile.rents[5]} MDL</span>
            </div>

            <div className="border-t border-[#D5C9B4] pt-1.5 mt-1.5 flex justify-between text-[#5C4D40]">
              <span>{t(UI_TEXT.buildCost, lang)}</span>
              <span className="font-mono-num font-bold text-[#1E1915]">
                {tile.houseCost} MDL
              </span>
            </div>
            <div className="flex justify-between text-[#5C4D40]">
              <span>{t(UI_TEXT.mortgageVal, lang)}</span>
              <span className="font-mono-num font-bold text-[#1E1915]">
                {Math.floor(tile.price / 2)} MDL
              </span>
            </div>
          </div>
        )}

        {/* Transport Rent Schedule */}
        {tile.type === 'TRANSPORT' && (
          <div className="space-y-1 border-t border-[#D5C9B4] pt-2 text-[11px]">
            <div className="flex justify-between">
              <span>1 Linie de Transport:</span>
              <span className="font-mono-num font-bold">25 MDL</span>
            </div>
            <div className="flex justify-between">
              <span>2 Linii de Transport:</span>
              <span className="font-mono-num font-bold">50 MDL</span>
            </div>
            <div className="flex justify-between">
              <span>3 Linii de Transport:</span>
              <span className="font-mono-num font-bold">100 MDL</span>
            </div>
            <div className="flex justify-between text-[#8E5B18] font-bold">
              <span>Toate 4 Liniile (Monopol RTEC/Gări):</span>
              <span className="font-mono-num">200 MDL</span>
            </div>
          </div>
        )}

        {/* Utility Rent Schedule */}
        {tile.type === 'UTILITY' && (
          <div className="space-y-1 border-t border-[#D5C9B4] pt-2 text-[11px]">
            <div className="flex justify-between">
              <span>1 Rețea de Utilități:</span>
              <span className="font-mono-num font-bold">4 × suma zarurilor</span>
            </div>
            <div className="flex justify-between text-[#8E5B18] font-bold">
              <span>Ambele Rețele (Premier Energy + Apă-Canal):</span>
              <span className="font-mono-num">10 × suma zarurilor</span>
            </div>
          </div>
        )}

        {/* Owner Management Actions */}
        {isOwner && (
          <div className="pt-2 border-t border-[#D5C9B4] grid grid-cols-2 gap-1.5">
            {tile.type === 'PROPERTY' && !tile.mortgaged && tile.houses < 5 && (
              <button
                onClick={() =>
                  onSendAction('BUILD_HOUSE', { tileIndex: tile.index })
                }
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E6B45] hover:bg-[#165234] text-white font-bold text-[11px] shadow"
              >
                <Hammer className="w-3 h-3" />
                <span>
                  {t(UI_TEXT.buildHouse, lang)} ({tile.houseCost})
                </span>
              </button>
            )}
            {tile.type === 'PROPERTY' && tile.houses > 0 && (
              <button
                onClick={() =>
                  onSendAction('SELL_HOUSE', { tileIndex: tile.index })
                }
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-[11px] shadow"
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>
                  {t(UI_TEXT.sellHouse, lang)} (+{Math.floor(tile.houseCost / 2)})
                </span>
              </button>
            )}
            {!tile.mortgaged && tile.houses === 0 && (
              <button
                onClick={() =>
                  onSendAction('MORTGAGE_PROPERTY', { tileIndex: tile.index })
                }
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3A2C24] hover:bg-[#4A382E] text-[#FAF6EE] font-bold text-[11px]"
              >
                <Landmark className="w-3 h-3 text-[#E5C158]" />
                <span>
                  {t(UI_TEXT.mortgage, lang)} (+{Math.floor(tile.price / 2)})
                </span>
              </button>
            )}
            {tile.mortgaged && (
              <button
                onClick={() =>
                  onSendAction('UNMORTGAGE_PROPERTY', { tileIndex: tile.index })
                }
                className="col-span-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white font-bold text-[11px] shadow"
              >
                <LockOpen className="w-3 h-3" />
                <span>
                  {t(UI_TEXT.unmortgage, lang)} (-
                  {Math.floor((tile.price * 55) / 100)} MDL)
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
