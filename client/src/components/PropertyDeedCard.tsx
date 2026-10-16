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
    <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl overflow-hidden shadow-xl text-slate-100">
      {/* Deed Header */}
      <div className={`${groupStyle.bg} ${groupStyle.text} px-4 py-3 relative`}>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-85">
          {t(UI_TEXT.deedTitle, lang)} #{tile.index}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <h3 className="text-base font-black leading-tight flex items-center gap-1.5">
            <span>{tile.icon}</span>
            <span>{t(tile.name, lang)}</span>
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2 py-0.5 rounded bg-black/25 hover:bg-black/40"
            >
              ✕
            </button>
          )}
        </div>
        <div className="text-xs opacity-90 font-medium mt-0.5">
          {t(tile.subtitle, lang)}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 text-xs">
        {/* Cultural Flavor Box */}
        <p className="italic text-slate-300 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 leading-relaxed">
          “{t(tile.flavor, lang)}”
        </p>

        {/* Owner & Price */}
        {tile.price > 0 && (
          <div className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded-lg">
            <div>
              <span className="text-slate-400">{t(UI_TEXT.owner, lang)} </span>
              {owner ? (
                <span
                  className="font-bold px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: owner.color }}
                >
                  {owner.name}
                </span>
              ) : (
                <span className="font-semibold text-emerald-400">
                  {t(UI_TEXT.unowned, lang)} ({tile.price} MDL)
                </span>
              )}
            </div>
            {tile.mortgaged && (
              <span className="px-2 py-0.5 rounded bg-red-700 text-white font-bold text-[10px]">
                {t(UI_TEXT.mortgagedBadge, lang)}
              </span>
            )}
          </div>
        )}

        {/* Street Property Rent Schedule */}
        {tile.type === 'PROPERTY' && tile.rents.length >= 6 && (
          <div className="space-y-1 border-t border-slate-800 pt-2">
            <div className="flex justify-between">
              <span className="text-slate-400">{t(UI_TEXT.baseRent, lang)}</span>
              <span className="font-bold">{tile.rents[0]} MDL</span>
            </div>
            <div className="flex justify-between text-amber-300">
              <span>{t(UI_TEXT.monopolyRent, lang)}</span>
              <span className="font-bold">{tile.rents[0] * 2} MDL</span>
            </div>
            <div
              className={`flex justify-between ${
                tile.houses === 1 ? 'text-emerald-400 font-bold' : ''
              }`}
            >
              <span>🏠 {t(UI_TEXT.with1House, lang)}</span>
              <span>{tile.rents[1]} MDL</span>
            </div>
            <div
              className={`flex justify-between ${
                tile.houses === 2 ? 'text-emerald-400 font-bold' : ''
              }`}
            >
              <span>🏠🏠 {t(UI_TEXT.with2Houses, lang)}</span>
              <span>{tile.rents[2]} MDL</span>
            </div>
            <div
              className={`flex justify-between ${
                tile.houses === 3 ? 'text-emerald-400 font-bold' : ''
              }`}
            >
              <span>🏠🏠🏠 {t(UI_TEXT.with3Houses, lang)}</span>
              <span>{tile.rents[3]} MDL</span>
            </div>
            <div
              className={`flex justify-between ${
                tile.houses === 4 ? 'text-emerald-400 font-bold' : ''
              }`}
            >
              <span>🏠🏠🏠🏠 {t(UI_TEXT.with4Houses, lang)}</span>
              <span>{tile.rents[4]} MDL</span>
            </div>
            <div
              className={`flex justify-between ${
                tile.houses === 5 ? 'text-amber-400 font-black' : ''
              }`}
            >
              <span>🏰 {t(UI_TEXT.withHotel, lang)}</span>
              <span>{tile.rents[5]} MDL</span>
            </div>

            <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between text-slate-400">
              <span>{t(UI_TEXT.buildCost, lang)}</span>
              <span className="text-slate-200 font-semibold">
                {tile.houseCost} MDL
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{t(UI_TEXT.mortgageVal, lang)}</span>
              <span className="text-slate-200 font-semibold">
                {Math.floor(tile.price / 2)} MDL
              </span>
            </div>
          </div>
        )}

        {/* Transport Rent Schedule */}
        {tile.type === 'TRANSPORT' && (
          <div className="space-y-1 border-t border-slate-800 pt-2">
            <div className="flex justify-between">
              <span>1 Transport deținut:</span>
              <span className="font-bold">25 MDL</span>
            </div>
            <div className="flex justify-between">
              <span>2 Transporturi deținute:</span>
              <span className="font-bold">50 MDL</span>
            </div>
            <div className="flex justify-between">
              <span>3 Transporturi deținute:</span>
              <span className="font-bold">100 MDL</span>
            </div>
            <div className="flex justify-between text-amber-300">
              <span>Toate 4 Transporturile:</span>
              <span className="font-bold">200 MDL</span>
            </div>
          </div>
        )}

        {/* Utility Rent Schedule */}
        {tile.type === 'UTILITY' && (
          <div className="space-y-1 border-t border-slate-800 pt-2">
            <div className="flex justify-between">
              <span>1 Companie de Utilități:</span>
              <span className="font-bold">4 × suma zarurilor</span>
            </div>
            <div className="flex justify-between text-amber-300">
              <span>Ambele Utilități (Premier Energy + Apă-Canal):</span>
              <span className="font-bold">10 × suma zarurilor</span>
            </div>
          </div>
        )}

        {/* Owner Management Actions */}
        {isOwner && (
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            {tile.type === 'PROPERTY' && !tile.mortgaged && tile.houses < 5 && (
              <button
                onClick={() =>
                  onSendAction('BUILD_HOUSE', { tileIndex: tile.index })
                }
                className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
              >
                {t(UI_TEXT.buildHouse, lang)} ({tile.houseCost} MDL)
              </button>
            )}
            {tile.type === 'PROPERTY' && tile.houses > 0 && (
              <button
                onClick={() =>
                  onSendAction('SELL_HOUSE', { tileIndex: tile.index })
                }
                className="px-2.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow"
              >
                {t(UI_TEXT.sellHouse, lang)} (+{Math.floor(tile.houseCost / 2)} MDL)
              </button>
            )}
            {!tile.mortgaged && tile.houses === 0 && (
              <button
                onClick={() =>
                  onSendAction('MORTGAGE_PROPERTY', { tileIndex: tile.index })
                }
                className="px-2.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold text-xs"
              >
                {t(UI_TEXT.mortgage, lang)} (+{Math.floor(tile.price / 2)} MDL)
              </button>
            )}
            {tile.mortgaged && (
              <button
                onClick={() =>
                  onSendAction('UNMORTGAGE_PROPERTY', { tileIndex: tile.index })
                }
                className="col-span-2 px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
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
