import React from 'react';
import {
  GameState,
  Language,
  Player,
  Tile,
  GROUP_COLORS,
  getTokenEmoji,
} from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';

interface MonopolyBoardProps {
  state: GameState;
  myPlayerId: string;
  lang: Language;
  selectedTileIdx: number | null;
  onSelectTile: (idx: number) => void;
  onSendAction: (action: string, payload?: Record<string, unknown>) => void;
  onOpenTradeModal: () => void;
}

// Convert tile index (0..39) to 1-based CSS Grid { row, col } on an 11x11 board
function getGridCoords(index: number): { row: number; col: number } {
  if (index >= 0 && index <= 10) {
    // Bottom row: right (11) to left (1)
    return { row: 11, col: 11 - index };
  }
  if (index > 10 && index <= 20) {
    // Left column: bottom (11) to top (1)
    return { row: 11 - (index - 10), col: 1 };
  }
  if (index > 20 && index <= 30) {
    // Top row: left (1) to right (11)
    return { row: 1, col: 1 + (index - 20) };
  }
  // Right column: top (1) to bottom (11)
  return { row: 1 + (index - 30), col: 11 };
}

export const MonopolyBoard: React.FC<MonopolyBoardProps> = ({
  state,
  myPlayerId,
  lang,
  selectedTileIdx,
  onSelectTile,
  onSendAction,
  onOpenTradeModal,
}) => {
  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const currentTile = currentPlayer ? state.tiles[currentPlayer.position] : null;

  const getPlayerById = (id: string): Player | undefined =>
    state.players.find((p) => p.id === id);

  return (
    <div className="w-full max-w-[920px] aspect-square mx-auto bg-[#DCE8D6] text-slate-900 rounded-2xl shadow-2xl border-4 border-amber-600/80 overflow-hidden monopoly-grid select-none relative">
      {/* 40 Perimeter Tiles */}
      {state.tiles.map((tile) => {
        const { row, col } = getGridCoords(tile.index);
        const playersHere = state.players.filter(
          (p) => !p.bankrupt && p.position === tile.index
        );
        const owner = tile.ownerId ? getPlayerById(tile.ownerId) : undefined;
        const groupColor = GROUP_COLORS[tile.group] || GROUP_COLORS.NONE;
        const isCorner =
          tile.index === 0 ||
          tile.index === 10 ||
          tile.index === 20 ||
          tile.index === 30;
        const isSelected = selectedTileIdx === tile.index;

        return (
          <div
            key={tile.index}
            style={{ gridRow: row, gridColumn: col }}
            onClick={() => onSelectTile(tile.index)}
            className={`relative flex flex-col justify-between border border-slate-700/40 cursor-pointer transition-all overflow-hidden ${
              isCorner ? 'bg-amber-50/95' : 'bg-[#F4F7F0]'
            } ${
              isSelected
                ? 'ring-2 ring-amber-500 z-20 bg-amber-100/90'
                : 'hover:bg-amber-50/80'
            } ${tile.mortgaged ? 'opacity-65 bg-slate-300' : ''}`}
          >
            {/* Color Group Header Bar + Houses/Hotel */}
            {tile.group !== 'NONE' && (
              <div
                className={`h-3.5 sm:h-4 w-full ${groupColor.bg} flex items-center justify-center gap-0.5 px-0.5 border-b border-black/20`}
              >
                {tile.houses > 0 && tile.houses < 5 &&
                  Array.from({ length: tile.houses }).map((_, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] leading-none drop-shadow"
                      title="Casă / Bloc"
                    >
                      🏠
                    </span>
                  ))}
                {tile.houses === 5 && (
                  <span
                    className="text-[10px] leading-none font-bold drop-shadow"
                    title="Hotel / Vinărie"
                  >
                    🏰
                  </span>
                )}
              </div>
            )}

            {/* Tile Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-0.5 py-0.5 text-center">
              <span className={`${isCorner ? 'text-lg sm:text-2xl' : 'text-xs sm:text-sm'} leading-none mb-0.5`}>
                {tile.icon}
              </span>
              <span className="text-[8px] sm:text-[9.5px] font-bold leading-tight line-clamp-2 text-slate-900">
                {t(tile.name, lang)}
              </span>
              {tile.price > 0 && (
                <span className="text-[7.5px] sm:text-[9px] font-semibold text-emerald-800 mt-0.5">
                  {tile.price} MDL
                </span>
              )}
              {tile.taxAmount && tile.taxAmount > 0 && (
                <span className="text-[7.5px] sm:text-[9px] font-semibold text-red-700 mt-0.5">
                  -{tile.taxAmount} MDL
                </span>
              )}
            </div>

            {/* Owner color stripe at bottom */}
            {owner && (
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: owner.color }}
                title={`${t(UI_TEXT.owner, lang)} ${owner.name}`}
              />
            )}

            {/* Mortgaged badge */}
            {tile.mortgaged && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-800/90 text-white text-[7px] font-black uppercase text-center py-0.5">
                {t(UI_TEXT.mortgagedBadge, lang)}
              </div>
            )}

            {/* Player Tokens on this Tile */}
            {playersHere.length > 0 && (
              <div className="absolute inset-x-0.5 bottom-1.5 flex flex-wrap items-center justify-center gap-0.5 pointer-events-none z-10">
                {playersHere.map((p) => (
                  <div
                    key={p.id}
                    style={{ backgroundColor: p.color }}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs shadow-md border border-white animate-bounce"
                    title={`${p.name} (${p.cash} MDL)`}
                  >
                    {getTokenEmoji(p.token)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Center 9x9 Dashboard */}
      <div
        style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
        className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 p-3 sm:p-5 flex flex-col justify-between relative overflow-y-auto border-2 border-amber-500/40"
      >
        {/* Top Banner: Moldovan Tricolor Accent & Edition Title */}
        <div className="flex flex-col items-center text-center border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-4 h-2 rounded-xs bg-[#0046AE]" />
            <span className="w-4 h-2 rounded-xs bg-[#FFD200]" />
            <span className="w-4 h-2 rounded-xs bg-[#CC092F]" />
          </div>
          <h2 className="text-base sm:text-xl font-black tracking-wider text-amber-400 uppercase">
            {t(UI_TEXT.title, lang)}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400">
            {t(UI_TEXT.subtitle, lang)}
          </p>

          {/* Bank & Triumphal Arch Jackpot Bar */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            <span>
              🏛️ {t(UI_TEXT.jackpotPot, lang)}{' '}
              <strong className="text-amber-400">{state.freeParkingPot} MDL</strong>
            </span>
            <span>
              🏠 {t(UI_TEXT.housesLeft, lang)}{' '}
              <strong className="text-emerald-400">{state.housesRemaining}</strong>
            </span>
            <span>
              🏰 {t(UI_TEXT.hotelsLeft, lang)}{' '}
              <strong className="text-amber-300">{state.hotelsRemaining}</strong>
            </span>
          </div>
        </div>

        {/* Middle Area: Active Turn / Dice / Drawn Card / Live Auction */}
        <div className="my-auto flex flex-col items-center justify-center py-2 gap-3">
          {/* Last Drawn Chance / Cumătrie Card */}
          {state.lastDrawnCard && (
            <div
              className={`w-full max-w-md rounded-xl p-3 border-2 shadow-lg ${
                state.lastDrawnCard.deck === 'CHANCE'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-100'
                  : 'bg-rose-950/80 border-rose-500 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wide mb-1">
                <span>{state.lastDrawnCard.deck === 'CHANCE' ? '🍀 Noroc / Șansă' : '🎁 Cutia cu Cumătrie'}</span>
                <span>— {t(state.lastDrawnCard.title, lang)}</span>
              </div>
              <p className="text-xs sm:text-sm leading-snug">
                {t(state.lastDrawnCard.description, lang)}
              </p>
            </div>
          )}

          {/* Live Auction Panel */}
          {state.phase === 'AUCTION' && state.auction && (
            <div className="w-full max-w-md bg-amber-950/90 border-2 border-amber-400 rounded-xl p-3 sm:p-4 text-center shadow-xl">
              <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                🔨 Licitație Publică la Primărie
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {t(state.tiles[state.auction.tileIndex].name, lang)}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Oferta curentă:{' '}
                <strong className="text-amber-400 text-sm">
                  {state.auction.currentBid} MDL
                </strong>
                {state.auction.highestBidderId && (
                  <span>
                    {' '}
                    ({getPlayerById(state.auction.highestBidderId)?.name})
                  </span>
                )}
              </div>
              {myPlayer &&
                !myPlayer.bankrupt &&
                !state.auction.passedPlayers[myPlayer.id] && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        onSendAction('PLACE_BID', {
                          amount:
                            state.auction!.highestBidderId === ''
                              ? 10
                              : state.auction!.currentBid + 10,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                    >
                      +10 MDL (
                      {state.auction.highestBidderId === ''
                        ? 10
                        : state.auction.currentBid + 10}{' '}
                      MDL)
                    </button>
                    <button
                      onClick={() =>
                        onSendAction('PLACE_BID', {
                          amount: state.auction!.currentBid + 50,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow"
                    >
                      +50 MDL ({state.auction.currentBid + 50} MDL)
                    </button>
                    <button
                      onClick={() => onSendAction('PASS_AUCTION')}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs"
                    >
                      Pas
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Current Player Indicator + Dice */}
          {currentPlayer && state.phase !== 'GAME_OVER' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-full border border-slate-700">
                <span className="text-xs text-slate-400">{t(UI_TEXT.turnOf, lang)}</span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: currentPlayer.color }}
                >
                  {getTokenEmoji(currentPlayer.token)}
                </span>
                <span className="font-bold text-xs sm:text-sm text-white">
                  {currentPlayer.name}
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  ({currentPlayer.cash} MDL)
                </span>
              </div>

              {/* Dice Display */}
              {state.lastDice[0] > 0 && (
                <div className="flex items-center gap-3 my-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white text-slate-950 font-black text-lg sm:text-2xl flex items-center justify-center shadow-lg border-2 border-amber-400">
                    {state.lastDice[0]}
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white text-slate-950 font-black text-lg sm:text-2xl flex items-center justify-center shadow-lg border-2 border-amber-400">
                    {state.lastDice[1]}
                  </div>
                </div>
              )}

              {/* Action Controls for Active Human Player */}
              {isMyTurn && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  {state.phase === 'ROLL' && (
                    <>
                      <button
                        onClick={() => onSendAction('ROLL_DICE')}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition transform active:scale-95"
                      >
                        {t(UI_TEXT.rollDice, lang)}
                      </button>
                      {currentPlayer.inJail && currentPlayer.cash >= 50 && (
                        <button
                          onClick={() => onSendAction('PAY_JAIL_BAIL')}
                          className="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow"
                        >
                          {t(UI_TEXT.payBail, lang)}
                        </button>
                      )}
                      {currentPlayer.inJail && currentPlayer.getOutOfJailFree > 0 && (
                        <button
                          onClick={() => onSendAction('USE_JAIL_CARD')}
                          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                        >
                          {t(UI_TEXT.useJailCard, lang)}
                        </button>
                      )}
                    </>
                  )}

                  {state.phase === 'BUY_OR_AUCTION' && currentTile && (
                    <div className="flex flex-col items-center gap-2 bg-slate-800/95 p-3 rounded-xl border border-amber-500/50">
                      <div className="text-xs sm:text-sm font-bold text-center">
                        {currentTile.icon} {t(currentTile.name, lang)} —{' '}
                        <span className="text-emerald-400">{currentTile.price} MDL</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          disabled={currentPlayer.cash < currentTile.price}
                          onClick={() => onSendAction('BUY_PROPERTY')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow"
                        >
                          {t(UI_TEXT.buyProperty, lang)} ({currentTile.price} MDL)
                        </button>
                        <button
                          onClick={() => onSendAction('DECLINE_PROPERTY')}
                          className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow"
                        >
                          {t(UI_TEXT.sendToAuction, lang)}
                        </button>
                      </div>
                    </div>
                  )}

                  {state.phase === 'ACTION' && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => onSendAction('END_TURN')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg"
                      >
                        {t(UI_TEXT.endTurn, lang)}
                      </button>
                      <button
                        onClick={onOpenTradeModal}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow"
                      >
                        {t(UI_TEXT.proposeTrade, lang)}
                      </button>
                    </div>
                  )}

                  {state.phase === 'DEBT' && state.pendingDebt && (
                    <div className="flex flex-col items-center gap-2 bg-red-950/90 border border-red-500 p-3 rounded-xl">
                      <p className="text-xs text-red-200 font-semibold text-center">
                        Datorie: <strong>{state.pendingDebt.amount} MDL</strong> (Ai:{' '}
                        {currentPlayer.cash} MDL)
                      </p>
                      <div className="flex gap-2">
                        {currentPlayer.cash >= state.pendingDebt.amount && (
                          <button
                            onClick={() => onSendAction('PAY_DEBT')}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          >
                            {t(UI_TEXT.payDebt, lang)}
                          </button>
                        )}
                        <button
                          onClick={() => onSendAction('DECLARE_BANKRUPTCY')}
                          className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs"
                        >
                          {t(UI_TEXT.declareBankruptcy, lang)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Game Over Winner Banner */}
          {state.phase === 'GAME_OVER' && state.winnerId && (
            <div className="bg-amber-500/20 border-2 border-amber-400 rounded-2xl p-4 text-center max-w-md">
              <div className="text-3xl mb-1">👑🇲🇩</div>
              <h3 className="text-lg font-black text-amber-300">
                {getPlayerById(state.winnerId)?.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Magnatul Imobiliar al Chișinăului!
              </p>
              <button
                onClick={() => onSendAction('RESET_GAME')}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                {t(UI_TEXT.resetRoom, lang)}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Hint */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
          {t(UI_TEXT.clickTileHint, lang)}
        </div>
      </div>
    </div>
  );
};
