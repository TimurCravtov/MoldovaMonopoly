import React, { useEffect, useRef, useState } from 'react';
import {
  GameState,
  Language,
  Player,
  Tile,
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
  expanded?: boolean;
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
  expanded = false,
}) => {
  const currentPlayer = state.players[state.currentPlayerIdx];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const currentTile = currentPlayer ? state.tiles[currentPlayer.position] : null;

  const [rollTrigger, setRollTrigger] = useState(0);
  const prevLogLenRef = useRef(state.logs.length);

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

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    state.players.forEach((p) => {
      const currentVisual =
        visualPositions[p.id] !== undefined ? visualPositions[p.id] : p.position;
      if (currentVisual !== p.position) {
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

  const renderBuildings = (tile: Tile, vertical: boolean) => {
    if (tile.houses <= 0) return null;
    if (tile.houses === 5) {
      return <HotelSvg className="w-3 h-3 text-[#FFECEC] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />;
    }
    return (
      <div
        className={`flex ${
          vertical ? 'flex-col' : 'flex-row'
        } items-center justify-center gap-0.5`}
      >
        {Array.from({ length: tile.houses }).map((_, idx) => (
          <HouseSvg
            key={idx}
            className="w-2.5 h-2.5 text-[#D1FAE5] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`${
        expanded ? 'board-viewport-square-full' : 'board-viewport-square'
      } mx-auto bg-[#D8E5D7] text-[#141414] border-[3px] border-[#141414] shadow-[8px_8px_0_#141414] overflow-hidden monopoly-grid select-none relative`}
    >
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
        const isSelected = selectedTileIdx === tile.index;
        const hasColorBar = tile.type === 'PROPERTY';

        // Special Corner Tile 0: START
        if (tile.index === 0) {
          return (
            <div
              key={0}
              style={{ gridRow: row, gridColumn: col }}
              onClick={() => onSelectTile(0)}
              className={`relative border border-[#141414] bg-[#D8E5D7] p-1 flex flex-col justify-between items-center text-center cursor-pointer ${
                isSelected ? 'bg-[#C4D8C3] ring-2 ring-inset ring-[#141414]' : 'hover:bg-[#CEE0CD]'
              }`}
            >
              <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-tight leading-none mt-0.5">
                ÎNCASEAZĂ 200 MDL
              </span>
              <span className="text-xs sm:text-base font-black tracking-tighter text-[#D92626] uppercase leading-none">
                START
              </span>
              {/* Red Arrow pointing left */}
              <div className="w-full flex items-center justify-center text-[#D92626] font-black text-xs leading-none mb-0.5">
                ←──
              </div>
              {playersHere.length > 0 && (
                <div className="absolute inset-x-0.5 bottom-1 flex flex-wrap items-center justify-center gap-0.5 z-10">
                  {playersHere.map((p) => (
                    <div
                      key={p.id}
                      style={{ backgroundColor: p.color }}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white border-[1.5px] border-[#141414] shadow-[1px_1px_0_#141414] ${
                        hoppingPlayerId === p.id ? 'animate-token-hop' : ''
                      }`}
                    >
                      <TokenSvg tokenId={p.token} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Special Corner Tile 10: JAIL (Penitenciarul Nr. 13 + Just Visiting corridor)
        if (tile.index === 10) {
          return (
            <div
              key={10}
              style={{ gridRow: row, gridColumn: col }}
              onClick={() => onSelectTile(10)}
              className={`relative border border-[#141414] bg-[#D8E5D7] cursor-pointer overflow-hidden ${
                isSelected ? 'ring-2 ring-inset ring-[#141414]' : ''
              }`}
            >
              {/* Inner Orange Prison Box in Top-Right */}
              <div className="absolute top-0 right-0 w-[72%] h-[72%] bg-[#F58220] border-l-[1.5px] border-b-[1.5px] border-[#141414] flex flex-col items-center justify-center p-0.5 text-center">
                <div className="w-full flex justify-evenly border-y border-[#141414] py-0.5 my-0.5 bg-white/40">
                  <span className="w-[1.5px] h-2.5 bg-[#141414]" />
                  <span className="w-[1.5px] h-2.5 bg-[#141414]" />
                  <span className="w-[1.5px] h-2.5 bg-[#141414]" />
                </div>
                <span className="text-[7px] sm:text-[8px] font-black uppercase leading-none text-[#141414]">
                  NR. 13
                </span>
              </div>
              {/* Bottom corridor label */}
              <div className="absolute bottom-0.5 inset-x-0 text-center text-[6.5px] sm:text-[7.5px] font-extrabold uppercase tracking-tighter">
                VIZITĂ
              </div>
              {playersHere.length > 0 && (
                <div className="absolute inset-x-0.5 bottom-1 flex flex-wrap items-center justify-center gap-0.5 z-10">
                  {playersHere.map((p) => (
                    <div
                      key={p.id}
                      style={{ backgroundColor: p.color }}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white border-[1.5px] border-[#141414] shadow-[1px_1px_0_#141414] ${
                        hoppingPlayerId === p.id ? 'animate-token-hop' : ''
                      }`}
                    >
                      <TokenSvg tokenId={p.token} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Special Corners 20 (Free Parking) and 30 (Go to Jail)
        if (tile.index === 20 || tile.index === 30) {
          return (
            <div
              key={tile.index}
              style={{ gridRow: row, gridColumn: col }}
              onClick={() => onSelectTile(tile.index)}
              className={`relative border border-[#141414] bg-[#D8E5D7] p-1 flex flex-col justify-between items-center text-center cursor-pointer ${
                isSelected ? 'bg-[#C4D8C3] ring-2 ring-inset ring-[#141414]' : 'hover:bg-[#CEE0CD]'
              }`}
            >
              <span className="text-[6.5px] sm:text-[7.5px] font-extrabold uppercase leading-tight tracking-tight">
                {tile.index === 20 ? 'ARCUL DE TRIUMF' : 'REȚINUT DE CNA'}
              </span>
              <TileIcon
                iconKey={tile.icon}
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  tile.index === 30 ? 'text-[#D92626]' : 'text-[#141414]'
                }`}
              />
              <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase leading-none">
                {tile.index === 20 ? 'PARCARE' : 'LA NR. 13'}
              </span>
              {playersHere.length > 0 && (
                <div className="absolute inset-x-0.5 bottom-1 flex flex-wrap items-center justify-center gap-0.5 z-10">
                  {playersHere.map((p) => (
                    <div
                      key={p.id}
                      style={{ backgroundColor: p.color }}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white border-[1.5px] border-[#141414] shadow-[1px_1px_0_#141414] ${
                        hoppingPlayerId === p.id ? 'animate-token-hop' : ''
                      }`}
                    >
                      <TokenSvg tokenId={p.token} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Standard Edge Tiles (Bottom, Top, Left, Right) with Inward-Facing Color Bands!
        const isHorizontalSide = side === 'left' || side === 'right';

        return (
          <div
            key={tile.index}
            style={{ gridRow: row, gridColumn: col }}
            onClick={() => onSelectTile(tile.index)}
            className={`relative border border-[#141414] bg-[#D8E5D7] cursor-pointer overflow-hidden flex ${
              side === 'bottom'
                ? 'flex-col'
                : side === 'top'
                ? 'flex-col-reverse'
                : side === 'left'
                ? 'flex-row-reverse'
                : 'flex-row'
            } ${
              isSelected
                ? 'bg-[#C2D6C0] ring-2 ring-inset ring-[#141414] z-20'
                : 'hover:bg-[#CCE0CA]'
            } ${tile.mortgaged ? 'opacity-55 bg-[#B8C4B7]' : ''}`}
          >
            {/* Inward-Facing Color Band for Street Properties */}
            {hasColorBar && (
              <div
                className={`${groupColor.bg} shrink-0 flex items-center justify-center ${
                  side === 'bottom'
                    ? 'h-[22%] w-full border-b-[1.5px] border-[#141414]'
                    : side === 'top'
                    ? 'h-[22%] w-full border-t-[1.5px] border-[#141414]'
                    : side === 'left'
                    ? 'w-[22%] h-full border-l-[1.5px] border-[#141414]'
                    : 'w-[22%] h-full border-r-[1.5px] border-[#141414]'
                }`}
              >
                {renderBuildings(tile, isHorizontalSide)}
              </div>
            )}

            {/* Tile Body */}
            <div className="flex-1 flex flex-col items-center justify-between p-0.5 text-center min-w-0 min-h-0">
              <span className="text-[6.5px] sm:text-[8px] xl:text-[8.5px] font-extrabold uppercase leading-[1.05] line-clamp-2 text-[#141414] tracking-tighter px-0.5">
                {t(tile.name, lang)}
              </span>

              {!hasColorBar && (
                <TileIcon
                  iconKey={tile.icon}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#141414] my-auto shrink-0"
                />
              )}

              {tile.price > 0 && (
                <span className="font-mono-num text-[6px] sm:text-[7.5px] font-bold text-[#141414] leading-none">
                  {tile.price} MDL
                </span>
              )}
              {tile.taxAmount && tile.taxAmount > 0 && (
                <span className="font-mono-num text-[6px] sm:text-[7.5px] font-bold text-[#D92626] leading-none">
                  -{tile.taxAmount}
                </span>
              )}
            </div>

            {/* Owner Marker Dot/Tab on Outer Edge */}
            {owner && (
              <div
                style={{ backgroundColor: owner.color }}
                className={
                  side === 'bottom'
                    ? 'h-1.5 w-full border-t border-[#141414] shrink-0'
                    : side === 'top'
                    ? 'h-1.5 w-full border-b border-[#141414] shrink-0'
                    : side === 'left'
                    ? 'w-1.5 h-full border-r border-[#141414] shrink-0'
                    : 'w-1.5 h-full border-l border-[#141414] shrink-0'
                }
                title={`${t(UI_TEXT.owner, lang)} ${owner.name}`}
              />
            )}

            {/* Mortgaged Stamp */}
            {tile.mortgaged && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#D92626] text-white text-[6px] font-black uppercase text-center py-0.5 border-y border-[#141414]">
                {t(UI_TEXT.mortgagedBadge, lang)}
              </div>
            )}

            {/* Player Tokens on this Tile */}
            {playersHere.length > 0 && (
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 pointer-events-none z-10 p-0.5">
                {playersHere.map((p) => (
                  <div
                    key={p.id}
                    style={{ backgroundColor: p.color }}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white border-[1.5px] border-[#141414] shadow-[1.5px_1.5px_0_#141414] ${
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

      {/* Center 9x9 Court — Continuous Mint Board Surface (#D8E5D7) */}
      <div
        style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
        className="bg-[#D8E5D7] text-[#141414] p-3 sm:p-5 flex flex-col justify-between relative overflow-hidden border border-[#141414]"
      >
        {/* Top-Left Diagonal Card Deck Slot: CUTIA CU CUMĂTRIE */}
        <div className="hidden sm:flex absolute top-5 left-5 w-28 h-16 border-2 border-dashed border-[#141414]/60 -rotate-12 flex-col items-center justify-center p-1 text-center pointer-events-none">
          <span className="text-[8px] font-black uppercase tracking-widest text-[#141414]/80">
            CUTIA CU CUMĂTRIE
          </span>
          <span className="text-[7px] font-mono-num text-[#141414]/60">
            16 CĂRȚI
          </span>
        </div>

        {/* Bottom-Right Diagonal Card Deck Slot: NOROC / ȘANSĂ */}
        <div className="hidden sm:flex absolute bottom-5 right-5 w-28 h-16 border-2 border-dashed border-[#141414]/60 -rotate-12 flex-col items-center justify-center p-1 text-center pointer-events-none">
          <span className="text-[8px] font-black uppercase tracking-widest text-[#141414]/80">
            NOROC / ȘANSĂ
          </span>
          <span className="text-[7px] font-mono-num text-[#141414]/60">
            16 CĂRȚI
          </span>
        </div>

        {/* Top Bar: Classic Red Stamped MONOPOLY Banner & Bank Supply */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-[#E32626] text-white border-[2.5px] border-[#141414] shadow-[4px_4px_0_#141414] px-5 py-1.5">
            <h2 className="text-base sm:text-2xl font-black tracking-[0.14em] uppercase leading-none">
              MONOPOLY
            </h2>
            <div className="text-[8px] sm:text-[10px] font-bold tracking-[0.22em] uppercase mt-0.5 border-t border-white/40 pt-0.5">
              CHIȘINĂU & MOLDOVA
            </div>
          </div>

          {/* Bank Supply & Triumphal Arch Pot Ledger */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-xs bg-[#FAF8F5] px-3 py-1 border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414] font-mono-num">
            <span>
              {t(UI_TEXT.jackpotPot, lang)}{' '}
              <strong>{state.freeParkingPot} MDL</strong>
            </span>
            <span>|</span>
            <span>
              {t(UI_TEXT.housesLeft, lang)}{' '}
              <strong className="text-[#1EA350]">{state.housesRemaining}</strong>
            </span>
            <span>|</span>
            <span>
              {t(UI_TEXT.hotelsLeft, lang)}{' '}
              <strong className="text-[#E32626]">{state.hotelsRemaining}</strong>
            </span>
          </div>
        </div>

        {/* Center Interactive Tabletop Stage */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 gap-3">
          {/* Drawn Chance / Cumătrie Card (Printed Cardstock Style) */}
          {state.lastDrawnCard && (
            <div
              className={`w-full max-w-sm p-3.5 border-2 border-[#141414] shadow-[4px_4px_0_#141414] ${
                state.lastDrawnCard.deck === 'CHANCE'
                  ? 'bg-[#FDE021] text-[#141414]'
                  : 'bg-[#FAF8F5] text-[#141414]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-b-[1.5px] border-[#141414] pb-1 mb-1.5">
                <span>
                  {state.lastDrawnCard.deck === 'CHANCE'
                    ? 'CARTE NOROC / ȘANSĂ'
                    : 'CARTE CUMĂTRIE'}
                </span>
                <span>{t(state.lastDrawnCard.title, lang)}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium leading-snug">
                {t(state.lastDrawnCard.description, lang)}
              </p>
            </div>
          )}

          {/* Live Public Auction Card */}
          {state.phase === 'AUCTION' && state.auction && (
            <div className="w-full max-w-sm bg-[#FAF8F5] border-2 border-[#141414] shadow-[4px_4px_0_#141414] p-3.5 text-center">
              <div className="text-[10px] uppercase font-black tracking-widest bg-[#141414] text-white py-0.5 px-2 inline-block">
                LICITAȚIE PUBLICĂ
              </div>
              <div className="text-sm sm:text-base font-black text-[#141414] mt-1.5 uppercase">
                {t(state.tiles[state.auction.tileIndex].name, lang)}
              </div>
              <div className="text-xs text-[#141414] mt-1 font-mono-num">
                Oferta maximă:{' '}
                <strong className="text-[#E32626] text-sm">
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
                      className="px-3 py-1.5 bg-[#1EA350] hover:bg-[#188741] text-white border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414] font-bold text-xs uppercase"
                    >
                      +10 MDL (
                      {state.auction.highestBidderId === ''
                        ? 10
                        : state.auction.currentBid + 10}
                      )
                    </button>
                    <button
                      onClick={() =>
                        onSendAction('PLACE_BID', {
                          amount: state.auction!.currentBid + 50,
                        })
                      }
                      className="px-3 py-1.5 bg-[#F58220] hover:bg-[#DC6E12] text-[#141414] border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414] font-bold text-xs uppercase"
                    >
                      +50 MDL ({state.auction.currentBid + 50})
                    </button>
                    <button
                      onClick={() => onSendAction('PASS_AUCTION')}
                      className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-[#141414] border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414] font-bold text-xs uppercase"
                    >
                      Pas
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Active Turn Indicator + Dice + Mechanical Buttons */}
          {currentPlayer && state.phase !== 'GAME_OVER' && (
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex items-center gap-2 bg-[#FAF8F5] px-3 py-1 border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414]">
                <span className="text-[10px] font-bold uppercase text-neutral-600">
                  {t(UI_TEXT.turnOf, lang)}
                </span>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white border border-[#141414]"
                  style={{ backgroundColor: currentPlayer.color }}
                >
                  <TokenSvg tokenId={currentPlayer.token} className="w-2.5 h-2.5" />
                </span>
                <span className="font-black text-xs sm:text-sm uppercase">
                  {currentPlayer.name}
                </span>
                <span className="font-mono-num text-xs font-bold text-[#1EA350]">
                  {currentPlayer.cash} MDL
                </span>
              </div>

              {/* 3D Animated Dice on Board Felt */}
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
                        className="px-5 py-2 bg-[#E32626] hover:bg-[#C81E1E] text-white font-black text-xs sm:text-sm border-2 border-[#141414] shadow-[3px_3px_0_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-wider"
                      >
                        {t(UI_TEXT.rollDice, lang)}
                      </button>
                      {currentPlayer.inJail && currentPlayer.cash >= 50 && (
                        <button
                          onClick={() => onSendAction('PAY_JAIL_BAIL')}
                          className="px-3 py-2 bg-[#FAF8F5] hover:bg-white text-[#141414] font-bold text-xs border-2 border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
                        >
                          {t(UI_TEXT.payBail, lang)}
                        </button>
                      )}
                      {currentPlayer.inJail &&
                        currentPlayer.getOutOfJailFree > 0 && (
                          <button
                            onClick={() => onSendAction('USE_JAIL_CARD')}
                            className="px-3 py-2 bg-[#FDE021] hover:bg-[#F5D400] text-[#141414] font-bold text-xs border-2 border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
                          >
                            {t(UI_TEXT.useJailCard, lang)}
                          </button>
                        )}
                    </>
                  )}

                  {state.phase === 'BUY_OR_AUCTION' && currentTile && (
                    <div className="flex flex-col items-center gap-2 bg-[#FAF8F5] p-3 border-2 border-[#141414] shadow-[4px_4px_0_#141414]">
                      <div className="text-xs sm:text-sm font-black uppercase text-center">
                        {t(currentTile.name, lang)} —{' '}
                        <span className="font-mono-num text-[#1EA350]">
                          {currentTile.price} MDL
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          disabled={currentPlayer.cash < currentTile.price}
                          onClick={() => onSendAction('BUY_PROPERTY')}
                          className="px-3.5 py-1.5 bg-[#1EA350] hover:bg-[#168A41] disabled:opacity-40 text-white font-black text-xs border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
                        >
                          {t(UI_TEXT.buyProperty, lang)} ({currentTile.price} MDL)
                        </button>
                        <button
                          onClick={() => onSendAction('DECLINE_PROPERTY')}
                          className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-[#141414] font-bold text-xs border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
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
                        className="px-5 py-2 bg-[#1EA350] hover:bg-[#168A41] text-white font-black text-xs sm:text-sm border-2 border-[#141414] shadow-[3px_3px_0_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-wider"
                      >
                        {t(UI_TEXT.endTurn, lang)}
                      </button>
                      <button
                        onClick={onOpenTradeModal}
                        className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-white text-[#141414] font-bold text-xs sm:text-sm border-2 border-[#141414] shadow-[3px_3px_0_#141414] uppercase"
                      >
                        {t(UI_TEXT.proposeTrade, lang)}
                      </button>
                    </div>
                  )}

                  {state.phase === 'DEBT' && state.pendingDebt && (
                    <div className="flex flex-col items-center gap-2 bg-[#FAF8F5] border-2 border-[#E32626] p-3 shadow-[4px_4px_0_#141414]">
                      <p className="text-xs text-[#E32626] font-bold uppercase text-center">
                        Datorie: {state.pendingDebt.amount} MDL (Disponibil:{' '}
                        {currentPlayer.cash} MDL)
                      </p>
                      <div className="flex gap-2">
                        {currentPlayer.cash >= state.pendingDebt.amount && (
                          <button
                            onClick={() => onSendAction('PAY_DEBT')}
                            className="px-3.5 py-1.5 bg-[#1EA350] text-white font-bold text-xs border-[1.5px] border-[#141414] uppercase"
                          >
                            {t(UI_TEXT.payDebt, lang)}
                          </button>
                        )}
                        <button
                          onClick={() => onSendAction('DECLARE_BANKRUPTCY')}
                          className="px-3.5 py-1.5 bg-[#E32626] text-white font-bold text-xs border-[1.5px] border-[#141414] uppercase"
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

          {/* Game Over Winner Card */}
          {state.phase === 'GAME_OVER' && state.winnerId && (
            <div className="bg-[#FAF8F5] border-2 border-[#141414] shadow-[6px_6px_0_#141414] p-5 text-center max-w-sm">
              <div className="text-xs font-bold uppercase tracking-widest text-[#E32626]">
                CÂȘTIGĂTORUL PARTIDEI
              </div>
              <h3 className="text-xl font-black uppercase mt-1">
                {getPlayerById(state.winnerId)?.name}
              </h3>
              <button
                onClick={() => onSendAction('RESET_GAME')}
                className="mt-3 px-4 py-2 bg-[#E32626] text-white font-black text-xs border-2 border-[#141414] shadow-[2px_2px_0_#141414] uppercase"
              >
                {t(UI_TEXT.resetRoom, lang)}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Print Caption */}
        <div className="relative z-10 text-center text-[9px] font-bold uppercase tracking-wider text-[#141414]/70">
          {t(UI_TEXT.clickTileHint, lang)}
        </div>
      </div>
    </div>
  );
};
