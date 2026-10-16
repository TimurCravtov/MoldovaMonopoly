import React, { useEffect, useRef, useState } from 'react';
import {
  Gavel,
  Check,
  ArrowRight,
  Handshake,
  KeyRound,
  AlertTriangle,
  Trophy,
  RotateCcw,
  Coins,
  Building,
} from 'lucide-react';
import {
  GameState,
  Language,
  Player,
  GROUP_COLORS,
} from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';
import {
  TileIcon,
  TokenSvg,
  HouseSvg,
  HotelSvg,
} from './icons/MoldovaIcons';
import { Dice3D } from './Dice3D';

interface MonopolyBoardProps {
  state: GameState;
  myPlayerId: string;
  lang: Language;
  selectedTileIdx: number | null;
  onSelectTile: (idx: number) => void;
  onSendAction: (action: string, payload?: Record<string, unknown>) => void;
  onOpenTradeModal: () => void;
}

function getGridCoords(index: number): {
  row: number;
  col: number;
  side: 'bottom' | 'left' | 'top' | 'right' | 'corner';
} {
  if (index === 0) return { row: 11, col: 11, side: 'corner' };
  if (index === 10) return { row: 11, col: 1, side: 'corner' };
  if (index === 20) return { row: 1, col: 1, side: 'corner' };
  if (index === 30) return { row: 1, col: 11, side: 'corner' };

  if (index > 0 && index < 10) {
    return { row: 11, col: 11 - index, side: 'bottom' };
  }
  if (index > 10 && index < 20) {
    return { row: 11 - (index - 10), col: 1, side: 'left' };
  }
  if (index > 20 && index < 30) {
    return { row: 1, col: 1 + (index - 20), side: 'top' };
  }
  return { row: 1 + (index - 30), col: 11, side: 'right' };
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

  // Track dice roll trigger count so Dice3D animates on every roll
  const [rollTrigger, setRollTrigger] = useState(0);
  const prevLogLenRef = useRef(state.logs.length);

  // Step-by-step animated token positions map: playerId -> visible tile index
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      state.players.forEach((p) => {
        init[p.id] = p.position;
      });
      return init;
    }
  );
  const [hoppingPlayerId, setHoppingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (state.logs.length !== prevLogLenRef.current) {
      prevLogLenRef.current = state.logs.length;
      if (state.hasRolled) {
        setRollTrigger((c) => c + 1);
      }
    }
  }, [state.logs.length, state.hasRolled]);

  // Animate token stepping around the board when a player's position changes
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    state.players.forEach((p) => {
      const currentVisual =
        visualPositions[p.id] !== undefined ? visualPositions[p.id] : p.position;
      if (currentVisual !== p.position) {
        // Compute forward steps on the 40-tile loop
        const forwardSteps = (p.position - currentVisual + 40) % 40;
        if (forwardSteps > 0 && forwardSteps <= 12) {
          setHoppingPlayerId(p.id);
          for (let s = 1; s <= forwardSteps; s++) {
            const nextPos = (currentVisual + s) % 40;
            const timer = setTimeout(() => {
              setVisualPositions((prev) => ({ ...prev, [p.id]: nextPos }));
              if (s === forwardSteps) {
                setHoppingPlayerId(null);
              }
            }, s * 75);
            timers.push(timer);
          }
        } else {
          // Direct jump (e.g. sent to Jail or long card jump)
          setVisualPositions((prev) => ({ ...prev, [p.id]: p.position }));
        }
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [state.players]);

  const getPlayerById = (id: string): Player | undefined =>
    state.players.find((p) => p.id === id);

  return (
    <div className="board-viewport-square mx-auto bg-[#EDE6D6] text-[#1E1915] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.75)] border-[6px] border-[#3A241B] ring-2 ring-[#C59B27]/70 overflow-hidden monopoly-grid select-none relative">
      {/* 40 Perimeter Tiles */}
      {state.tiles.map((tile) => {
        const { row, col, side } = getGridCoords(tile.index);
        const playersHere = state.players.filter((p) => {
          if (p.bankrupt) return false;
          const pos =
            visualPositions[p.id] !== undefined
              ? visualPositions[p.id]
              : p.position;
          return pos === tile.index;
        });
        const owner = tile.ownerId ? getPlayerById(tile.ownerId) : undefined;
        const groupColor = GROUP_COLORS[tile.group] || GROUP_COLORS.NONE;
        const isCorner = side === 'corner';
        const isSelected = selectedTileIdx === tile.index;

        return (
          <div
            key={tile.index}
            style={{ gridRow: row, gridColumn: col }}
            onClick={() => onSelectTile(tile.index)}
            className={`relative flex flex-col justify-between border border-[#B8AC96] cursor-pointer transition-colors overflow-hidden ${
              isCorner ? 'bg-[#E5DCC8]' : 'bg-[#F4EFE4]'
            } ${
              isSelected
                ? 'ring-2 ring-inset ring-[#9F1239] bg-[#FAF5EA] z-20'
                : 'hover:bg-[#FAF6ED]'
            } ${tile.mortgaged ? 'opacity-60 bg-[#D5CBB8]' : ''}`}
          >
            {/* Color Group Header Bar + Houses/Hotel */}
            {tile.group !== 'NONE' && (
              <div
                className={`h-2.5 sm:h-3.5 w-full ${groupColor.bg} flex items-center justify-center gap-0.5 px-0.5 border-b border-black/25 shrink-0`}
              >
                {tile.houses > 0 &&
                  tile.houses < 5 &&
                  Array.from({ length: tile.houses }).map((_, idx) => (
                    <HouseSvg
                      key={idx}
                      className="w-2.5 h-2.5 text-[#ECFDF5] drop-shadow"
                    />
                  ))}
                {tile.houses === 5 && (
                  <HotelSvg className="w-3 h-3 text-[#FEF08A] drop-shadow" />
                )}
              </div>
            )}

            {/* Tile Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-0.5 py-0.5 text-center min-h-0">
              <div
                className={`${
                  isCorner ? 'text-[#7C1D26]' : 'text-[#4A3B31]'
                } mb-0.5 shrink-0`}
              >
                <TileIcon
                  iconKey={tile.icon}
                  className={
                    isCorner
                      ? 'w-4 h-4 sm:w-5 sm:h-5'
                      : 'w-3 h-3 sm:w-3.5 sm:h-3.5'
                  }
                />
              </div>
              <span className="text-[7px] sm:text-[8.5px] xl:text-[9px] font-bold leading-[1.08] line-clamp-2 text-[#1E1915] tracking-tight px-0.5">
                {t(tile.name, lang)}
              </span>
              {tile.price > 0 && (
                <span className="font-mono-num text-[6.5px] sm:text-[8px] font-bold text-[#4A3B31] mt-0.5">
                  {tile.price}
                </span>
              )}
              {tile.taxAmount && tile.taxAmount > 0 && (
                <span className="font-mono-num text-[6.5px] sm:text-[8px] font-bold text-[#9F1239] mt-0.5">
                  -{tile.taxAmount}
                </span>
              )}
            </div>

            {/* Owner Color Bar at Bottom */}
            {owner && (
              <div
                className="h-1.5 w-full shrink-0"
                style={{ backgroundColor: owner.color }}
                title={`${t(UI_TEXT.owner, lang)} ${owner.name}`}
              />
            )}

            {/* Mortgaged Stamp */}
            {tile.mortgaged && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#7C1D26]/90 text-white text-[6.5px] font-bold uppercase text-center py-0.5 tracking-wider">
                {t(UI_TEXT.mortgagedBadge, lang)}
              </div>
            )}

            {/* Player Tokens on this Tile */}
            {playersHere.length > 0 && (
              <div className="absolute inset-x-0.5 bottom-1 flex flex-wrap items-center justify-center gap-0.5 pointer-events-none z-10">
                {playersHere.map((p) => (
                  <div
                    key={p.id}
                    style={{ backgroundColor: p.color }}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white shadow-[0_2px_6px_rgba(0,0,0,0.65)] border border-[#FAF6EE] transition-transform ${
                      hoppingPlayerId === p.id ? 'animate-token-hop' : ''
                    }`}
                    title={`${p.name} (${p.cash} MDL)`}
                  >
                    <TokenSvg tokenId={p.token} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Center 9x9 Court */}
      <div
        style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
        className="bg-[#1C1512] text-[#F5EFE6] p-2.5 sm:p-4 flex flex-col justify-between relative overflow-hidden border-2 border-[#8E6F2E]"
      >
        {/* Subtle AI-Generated Engraved Chișinău Emblem Watermark */}
        <img
          src="/assets/chisinau-emblem.jpg"
          alt="Chișinău Emblem"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.11] pointer-events-none mix-blend-luminosity"
        />

        {/* Decorative Inner Frame */}
        <div className="relative z-10 flex flex-col items-center text-center border-b border-[#3A2C24] pb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-5 h-1.5 bg-[#0046AE]" />
            <span className="w-5 h-1.5 bg-[#FFD200]" />
            <span className="w-5 h-1.5 bg-[#CC092F]" />
          </div>
          <h2 className="font-editorial text-sm sm:text-lg lg:text-xl font-bold tracking-wider text-[#E5C158] uppercase">
            {t(UI_TEXT.title, lang)}
          </h2>
          <p className="text-[9px] sm:text-[11px] text-[#B8A99A] tracking-wide">
            {t(UI_TEXT.subtitle, lang)}
          </p>

          {/* Municipal Treasury & BNM Reserve Strip */}
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-xs bg-[#261D18]/95 px-3.5 py-1 rounded-full border border-[#4A382E]">
            <span className="flex items-center gap-1 text-[#D6C7B2]">
              <Coins className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>{t(UI_TEXT.jackpotPot, lang)}</span>
              <strong className="font-mono-num text-[#E5C158]">
                {state.freeParkingPot} MDL
              </strong>
            </span>
            <span className="text-[#5C493E]">|</span>
            <span className="flex items-center gap-1 text-[#D6C7B2]">
              <HouseSvg className="w-3 h-3 text-[#4ADE80]" />
              <span>{t(UI_TEXT.housesLeft, lang)}</span>
              <strong className="font-mono-num text-white">
                {state.housesRemaining}
              </strong>
            </span>
            <span className="flex items-center gap-1 text-[#D6C7B2]">
              <HotelSvg className="w-3 h-3 text-[#E5C158]" />
              <span>{t(UI_TEXT.hotelsLeft, lang)}</span>
              <strong className="font-mono-num text-white">
                {state.hotelsRemaining}
              </strong>
            </span>
          </div>
        </div>

        {/* Center Interactive Stage */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-1 gap-2.5">
          {/* Circular Medallion Preview when no modal is blocking */}
          {!state.lastDrawnCard && state.phase !== 'AUCTION' && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#C59B27]/70 shadow-xl hidden sm:block">
              <img
                src="/assets/chisinau-emblem.jpg"
                alt="Chișinău Medallion"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Drawn Chance / Cumătrie Card */}
          {state.lastDrawnCard && (
            <div
              className={`animate-card-reveal w-full max-w-md rounded-xl p-3 border shadow-2xl ${
                state.lastDrawnCard.deck === 'CHANCE'
                  ? 'bg-[#2C1F14]/95 border-[#C59B27] text-[#FAF3E8]'
                  : 'bg-[#2E161B]/95 border-[#B84A69] text-[#FAF3E8]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#E5C158] border-b border-white/10 pb-1 mb-1.5">
                <span>
                  {state.lastDrawnCard.deck === 'CHANCE'
                    ? 'NOROC / ȘANSĂ'
                    : 'CUTIA CU CUMĂTRIE'}
                </span>
                <span>{t(state.lastDrawnCard.title, lang)}</span>
              </div>
              <p className="text-xs sm:text-sm leading-snug text-[#EDE3D2]">
                {t(state.lastDrawnCard.description, lang)}
              </p>
            </div>
          )}

          {/* Live Auction Panel */}
          {state.phase === 'AUCTION' && state.auction && (
            <div className="animate-card-reveal w-full max-w-md bg-[#261C17]/95 border-2 border-[#C59B27] rounded-xl p-3 sm:p-4 text-center shadow-2xl">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#E5C158] tracking-widest">
                <Gavel className="w-3.5 h-3.5" />
                <span>Licitație Publică la Primărie</span>
              </div>
              <div className="font-editorial text-sm sm:text-base font-bold text-white mt-0.5">
                {t(state.tiles[state.auction.tileIndex].name, lang)}
              </div>
              <div className="text-xs text-[#D6C7B2] mt-1">
                Oferta curentă:{' '}
                <strong className="font-mono-num text-[#E5C158] text-sm">
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
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        onSendAction('PLACE_BID', {
                          amount:
                            state.auction!.highestBidderId === ''
                              ? 10
                              : state.auction!.currentBid + 10,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#1E6B45] hover:bg-[#165234] text-white font-bold text-xs shadow"
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
                      className="px-3 py-1.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs shadow"
                    >
                      +50 MDL ({state.auction.currentBid + 50} MDL)
                    </button>
                    <button
                      onClick={() => onSendAction('PASS_AUCTION')}
                      className="px-3 py-1.5 rounded-lg bg-[#3A2D27] hover:bg-[#4A3A32] text-[#D6C7B2] font-bold text-xs"
                    >
                      Pas
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Active Player Banner + 3D Animated Dice + Action Console */}
          {currentPlayer && state.phase !== 'GAME_OVER' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-[#261D18] px-3.5 py-1 rounded-full border border-[#4A382E]">
                <span className="text-[11px] text-[#B8A99A]">
                  {t(UI_TEXT.turnOf, lang)}
                </span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white border border-white/40"
                  style={{ backgroundColor: currentPlayer.color }}
                >
                  <TokenSvg tokenId={currentPlayer.token} className="w-3 h-3" />
                </span>
                <span className="font-bold text-xs sm:text-sm text-white">
                  {currentPlayer.name}
                </span>
                <span className="font-mono-num text-xs font-bold text-[#E5C158]">
                  {currentPlayer.cash} MDL
                </span>
              </div>

              {/* 3D Animated Tumbling Dice */}
              <Dice3D
                dice={state.lastDice}
                isRollingTrigger={rollTrigger}
                canRoll={isMyTurn && state.phase === 'ROLL'}
                onRollClick={() => onSendAction('ROLL_DICE')}
              />

              {/* Action Controls for Active Human Player */}
              {isMyTurn && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5">
                  {state.phase === 'ROLL' && (
                    <>
                      <button
                        onClick={() => onSendAction('ROLL_DICE')}
                        className="px-5 py-2 rounded-lg bg-[#C59B27] hover:bg-[#D4AB37] text-[#16110E] font-bold text-xs sm:text-sm shadow-lg transition transform active:scale-95 uppercase tracking-wider"
                      >
                        {t(UI_TEXT.rollDice, lang)}
                      </button>
                      {currentPlayer.inJail && currentPlayer.cash >= 50 && (
                        <button
                          onClick={() => onSendAction('PAY_JAIL_BAIL')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#7C1D26] hover:bg-[#9F1239] text-white font-bold text-xs shadow"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{t(UI_TEXT.payBail, lang)}</span>
                        </button>
                      )}
                      {currentPlayer.inJail &&
                        currentPlayer.getOutOfJailFree > 0 && (
                          <button
                            onClick={() => onSendAction('USE_JAIL_CARD')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{t(UI_TEXT.useJailCard, lang)}</span>
                          </button>
                        )}
                    </>
                  )}

                  {state.phase === 'BUY_OR_AUCTION' && currentTile && (
                    <div className="flex flex-col items-center gap-2 bg-[#261D18] p-2.5 sm:p-3 rounded-xl border border-[#C59B27]/60 shadow-xl">
                      <div className="text-xs sm:text-sm font-bold text-center flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-[#E5C158]" />
                        <span>{t(currentTile.name, lang)}</span>
                        <span className="font-mono-num text-[#E5C158]">
                          — {currentTile.price} MDL
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          disabled={currentPlayer.cash < currentTile.price}
                          onClick={() => onSendAction('BUY_PROPERTY')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E6B45] hover:bg-[#165234] disabled:opacity-40 text-white font-bold text-xs shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {t(UI_TEXT.buyProperty, lang)} ({currentTile.price}{' '}
                            MDL)
                          </span>
                        </button>
                        <button
                          onClick={() => onSendAction('DECLINE_PROPERTY')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8E5B18] hover:bg-[#A66B1E] text-white font-bold text-xs shadow"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>{t(UI_TEXT.sendToAuction, lang)}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {state.phase === 'ACTION' && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => onSendAction('END_TURN')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E6B45] hover:bg-[#165234] text-white font-bold text-xs sm:text-sm shadow-lg uppercase tracking-wider"
                      >
                        <span>{t(UI_TEXT.endTurn, lang)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onOpenTradeModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3A2C24] hover:bg-[#4A382E] border border-[#6E5647] text-[#F5EFE6] font-bold text-xs sm:text-sm shadow"
                      >
                        <Handshake className="w-3.5 h-3.5 text-[#E5C158]" />
                        <span>{t(UI_TEXT.proposeTrade, lang)}</span>
                      </button>
                    </div>
                  )}

                  {state.phase === 'DEBT' && state.pendingDebt && (
                    <div className="flex flex-col items-center gap-2 bg-[#3B1216] border border-[#B91C1C] p-3 rounded-xl">
                      <p className="text-xs text-[#FECACA] font-semibold text-center flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-[#F87171]" />
                        <span>
                          Datorie: <strong>{state.pendingDebt.amount} MDL</strong>{' '}
                          (Disponibil: {currentPlayer.cash} MDL)
                        </span>
                      </p>
                      <div className="flex gap-2">
                        {currentPlayer.cash >= state.pendingDebt.amount && (
                          <button
                            onClick={() => onSendAction('PAY_DEBT')}
                            className="px-3.5 py-1.5 rounded-lg bg-[#1E6B45] hover:bg-[#165234] text-white font-bold text-xs"
                          >
                            {t(UI_TEXT.payDebt, lang)}
                          </button>
                        )}
                        <button
                          onClick={() => onSendAction('DECLARE_BANKRUPTCY')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs"
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
            <div className="bg-[#261D18] border-2 border-[#C59B27] rounded-2xl p-4 text-center max-w-md shadow-2xl">
              <Trophy className="w-8 h-8 text-[#E5C158] mx-auto mb-1" />
              <h3 className="font-editorial text-lg font-bold text-[#E5C158]">
                {getPlayerById(state.winnerId)?.name}
              </h3>
              <p className="text-xs text-[#D6C7B2] mt-1">
                Magnatul Imobiliar al Chișinăului
              </p>
              <button
                onClick={() => onSendAction('RESET_GAME')}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C59B27] hover:bg-[#D4AB37] text-[#16110E] font-bold text-xs uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t(UI_TEXT.resetRoom, lang)}</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Hint */}
        <div className="relative z-10 text-center text-[9.5px] text-[#9E8E7E] border-t border-[#3A2C24] pt-1">
          {t(UI_TEXT.clickTileHint, lang)}
        </div>
      </div>
    </div>
  );
};
